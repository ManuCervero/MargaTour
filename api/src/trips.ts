import type { Hono } from 'hono';
import { generateId } from './auth';
import { requireAuth } from './middleware';

// ── VIAJES (Contable → hoja VIAJES) ───────────────────────────────────────────
// Un viaje es una carga de income con source='cotizacion' más sus costos previstos
// (income_costs). Se crea solo al aprobar la cotización; los cobros y pagos se
// registran después como movimientos (income_payments), en pesos.

type CostCategory = 'transfer' | 'viaticos' | 'terceros' | 'actividad' | 'comision' | 'extra';

interface TripCost {
  category: CostCategory;
  description: string;
  amount_ars: number;
}

interface TripData {
  client_name: string;
  concept: string;
  reference: string;
  date: string;
  exchange_rate: number;
  amount_ars: number;
  costs: TripCost[];
}

let tripSchemaReady = false;

// La base de producción no sigue schema.sql al pie de la letra: las columnas
// nuevas se agregan acá y se ignoran si ya existen.
export async function ensureTripSchema(db: D1Database) {
  if (tripSchemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS income_costs (
    id TEXT PRIMARY KEY,
    income_id TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount_ars REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  )`).run();
  const alters = [
    'ALTER TABLE income_payments ADD COLUMN cost_id TEXT',
    'ALTER TABLE income ADD COLUMN synced_from_quote INTEGER DEFAULT 0',
    'ALTER TABLE income ADD COLUMN costs_edited INTEGER DEFAULT 0',
    'ALTER TABLE income ADD COLUMN quote_changed INTEGER DEFAULT 0',
  ];
  for (const sql of alters) {
    try { await db.prepare(sql).run(); } catch { /* la columna ya existe */ }
  }
  tripSchemaReady = true;
}

const parseJson = (v: unknown, fallback: any) => {
  if (typeof v !== 'string' || !v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};

// Replica el total final de QuotesView (TotalsPanel) y separa los costos como la hoja VIAJES.
// Ojo: en quote_transfers/quote_services los campos *_usd guardan pesos.
export async function computeTripFromQuote(db: D1Database, quoteId: string): Promise<{ status: string; trip: TripData } | null> {
  const quote = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteId).first<any>();
  if (!quote) return null;
  const { results: transfers } = await db.prepare('SELECT * FROM quote_transfers WHERE quote_id = ? ORDER BY sort_order ASC').bind(quoteId).all<any>();
  const { results: services } = await db.prepare('SELECT * FROM quote_services WHERE quote_id = ? ORDER BY sort_order ASC').bind(quoteId).all<any>();
  let extras: any[] = [];
  try {
    const { results } = await db.prepare('SELECT * FROM quote_extra_services WHERE quote_id = ? ORDER BY sort_order ASC').bind(quoteId).all<any>();
    extras = results;
  } catch {}

  let transferOwn = 0, viaticos = 0, terceros = 0;
  for (const t of transfers) {
    const base = t.final_cost_usd || t.base_cost_ars || 0;
    const tViaticos = t.viaticos || 0;
    const vehicles: any[] = parseJson(t.vehicles, []);
    const tTerceros = vehicles
      .filter(v => v && typeof v === 'object' && v.contracted)
      .reduce((s, v) => s + (Number(v.manual_price) || 0), 0);
    viaticos += tViaticos;
    terceros += tTerceros;
    transferOwn += Math.max(base - tViaticos - tTerceros, 0);
  }

  const costs: TripCost[] = [];
  if (transferOwn > 0) costs.push({ category: 'transfer', description: 'Transfer', amount_ars: transferOwn });
  if (viaticos > 0) costs.push({ category: 'viaticos', description: 'Viáticos', amount_ars: viaticos });
  if (terceros > 0) costs.push({ category: 'terceros', description: 'Transfer terceros', amount_ars: terceros });

  let totalServices = 0;
  for (const s of services) {
    const mostradorTotal = s.final_cost_usd || 0;
    totalServices += mostradorTotal;
    // El costo real es el precio de agencia por la misma cantidad (pax o noches) que el de mostrador
    const qty = s.unit_price_usd > 0 ? mostradorTotal / s.unit_price_usd : (s.pax || 1);
    const cost = s.agency_price_ars > 0 ? s.agency_price_ars * qty : mostradorTotal;
    if (cost > 0) costs.push({ category: 'actividad', description: s.service_name || 'Servicio', amount_ars: cost });
  }

  let totalExtras = 0;
  for (const e of extras) {
    totalExtras += e.price || 0;
    if (e.price > 0) costs.push({ category: 'extra', description: e.description || 'Servicio extra', amount_ars: e.price });
  }

  const totalTransfers = transfers.reduce((s: number, t: any) => s + (t.final_cost_usd || 0), 0);
  const subtotal = totalTransfers * (1 + (quote.ganancia_transfer || 0) / 100)
    + totalServices * (1 + (quote.ganancia_servicio || 0) / 100)
    + totalExtras;
  const r = (quote.comision || 0) / 100;
  const montoComision = subtotal * r * (1 + r);
  if (montoComision > 0) costs.push({ category: 'comision', description: `Comisión (${quote.comision}%)`, amount_ars: montoComision });

  // Fecha del viaje: el primer día de servicio; si no hay, la fecha de la cotización
  const days = [...transfers.map((t: any) => t.day), ...services.map((s: any) => s.day)]
    .filter((d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d))
    .map((d: string) => d.slice(0, 10))
    .sort();

  const ref = `#${String(quote.quote_number || 0).padStart(4, '0')}`;
  return {
    status: quote.status,
    trip: {
      client_name: quote.client_name || '',
      concept: quote.description || `Cotización ${ref}`,
      reference: ref,
      date: days[0] || quote.date,
      exchange_rate: quote.exchange_rate || 0,
      amount_ars: Math.ceil(subtotal + montoComision),
      costs: costs.map(c => ({ ...c, amount_ars: Math.ceil(c.amount_ars) })),
    },
  };
}

async function writeTripHeader(db: D1Database, incomeId: string, trip: TripData) {
  const tc = trip.exchange_rate;
  await db.prepare(`
    UPDATE income SET client_name=?, concept=?, reference=?, date=?, exchange_rate=?, amount_ars=?, amount_usd=?,
      quote_changed=0, updated_at=? WHERE id=?
  `).bind(
    trip.client_name, trip.concept, trip.reference, trip.date, tc || null,
    trip.amount_ars, tc > 0 ? Math.ceil(trip.amount_ars / tc) : 0,
    new Date().toISOString(), incomeId
  ).run();
}

// Reemplaza los costos conservando el id de los que siguen (mismo rubro y descripción),
// así los pagos ya asociados no quedan huérfanos.
async function writeTripCosts(db: D1Database, incomeId: string, costs: TripCost[]) {
  const { results: existing } = await db.prepare('SELECT * FROM income_costs WHERE income_id = ? ORDER BY sort_order ASC').bind(incomeId).all<any>();
  const pool = [...existing];
  for (let i = 0; i < costs.length; i++) {
    const c = costs[i];
    const idx = pool.findIndex(e => e.category === c.category && e.description === c.description);
    if (idx >= 0) {
      const match = pool.splice(idx, 1)[0];
      await db.prepare('UPDATE income_costs SET amount_ars=?, sort_order=? WHERE id=?').bind(c.amount_ars, i, match.id).run();
    } else {
      await db.prepare('INSERT INTO income_costs (id, income_id, category, description, amount_ars, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(generateId(), incomeId, c.category, c.description, c.amount_ars, i).run();
    }
  }
  for (const old of pool) {
    const used = await db.prepare('SELECT 1 FROM income_payments WHERE cost_id = ? LIMIT 1').bind(old.id).first();
    if (used) await db.prepare('UPDATE income_costs SET amount_ars = 0 WHERE id = ?').bind(old.id).run();
    else await db.prepare('DELETE FROM income_costs WHERE id = ?').bind(old.id).run();
  }
}

const tripKey = (amount: number, date: string, costs: { category: string; description: string; amount_ars: number }[]) =>
  JSON.stringify({ a: amount, d: date, c: costs.map(c => [c.category, c.description, c.amount_ars]) });

// Mantiene el viaje de una cotización al día:
// - aprobada y sin viaje → lo crea (o adopta una carga manual hecha para esa cotización)
// - aprobada, sin movimientos ni costos editados a mano → lo actualiza
// - con movimientos o costos editados → no lo toca y marca quote_changed si difiere
// - deja de estar aprobada → borra el viaje automático si no tiene movimientos
export async function syncTripForQuote(db: D1Database, quoteId: string) {
  await ensureTripSchema(db);
  const computed = await computeTripFromQuote(db, quoteId);
  const income = await db.prepare(
    "SELECT * FROM income WHERE quote_id = ? AND source = 'cotizacion' ORDER BY synced_from_quote DESC, created_at ASC LIMIT 1"
  ).bind(quoteId).first<any>();
  const hasMovements = income
    ? !!(await db.prepare('SELECT 1 FROM income_payments WHERE income_id = ? LIMIT 1').bind(income.id).first())
    : false;

  if (!computed || computed.status !== 'approved') {
    if (!income) return;
    if (income.synced_from_quote && !hasMovements) {
      await db.prepare('DELETE FROM income_costs WHERE income_id = ?').bind(income.id).run();
      await db.prepare('DELETE FROM income WHERE id = ?').bind(income.id).run();
    } else {
      await db.prepare('UPDATE income SET quote_changed = 1 WHERE id = ?').bind(income.id).run();
    }
    return;
  }

  const trip = computed.trip;
  if (!income) {
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO income (id, source, quote_id, client_name, concept, reference, amount_usd, amount_ars,
        exchange_rate, date, notes, synced_from_quote, created_at, updated_at)
      VALUES (?, 'cotizacion', ?, ?, ?, ?, 0, 0, NULL, ?, NULL, 1, ?, ?)
    `).bind(id, quoteId, trip.client_name, trip.concept, trip.reference, trip.date, now, now).run();
    await writeTripHeader(db, id, trip);
    await writeTripCosts(db, id, trip.costs);
    return;
  }

  if (!hasMovements && !income.costs_edited) {
    await db.prepare('UPDATE income SET synced_from_quote = 1 WHERE id = ?').bind(income.id).run();
    await writeTripHeader(db, income.id, trip);
    await writeTripCosts(db, income.id, trip.costs);
    return;
  }
  const { results: currentCosts } = await db.prepare(
    'SELECT category, description, amount_ars FROM income_costs WHERE income_id = ? ORDER BY sort_order ASC'
  ).bind(income.id).all<any>();
  // Carga manual vieja sin costos: agregar los costos previstos no pisa nada de lo cobrado
  if (currentCosts.length === 0) {
    await writeTripCosts(db, income.id, trip.costs);
    return;
  }
  const differs = tripKey(income.amount_ars, income.date, currentCosts) !== tripKey(trip.amount_ars, trip.date, trip.costs);
  await db.prepare('UPDATE income SET quote_changed = ? WHERE id = ?').bind(differs ? 1 : 0, income.id).run();
}

const paymentToRow = (p: any, exchangeRate: number | null) => {
  const ars = Math.ceil(Number(p.amount_ars) || 0);
  const tc = Number(p.exchange_rate) || exchangeRate || 0;
  return {
    type: p.type === 'egreso' ? 'egreso' : 'ingreso',
    amount_ars: ars,
    exchange_rate: tc || null,
    amount_usd: tc > 0 ? Math.ceil(ars / tc) : 0,
  };
};

export function tripRoutes(app: Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>) {
  app.get('/api/trips', requireAuth, async (c) => {
    await ensureTripSchema(c.env.DB);
    const { date_from, date_to } = c.req.query();
    let sql = `SELECT i.*, q.quote_number, q.status as quote_status,
        COALESCE((SELECT SUM(amount_ars) FROM income_payments WHERE income_id = i.id AND type = 'ingreso'), 0) as cobrado_ars,
        COALESCE((SELECT SUM(amount_ars) FROM income_payments WHERE income_id = i.id AND type = 'egreso'), 0) as pagado_ars
      FROM income i LEFT JOIN quotes q ON q.id = i.quote_id
      WHERE i.source = 'cotizacion'`;
    const params: unknown[] = [];
    if (date_from) { sql += ' AND i.date >= ?'; params.push(date_from); }
    if (date_to) { sql += ' AND i.date <= ?'; params.push(date_to); }
    sql += ' ORDER BY i.date ASC, i.created_at ASC';
    const { results: trips } = await c.env.DB.prepare(sql).bind(...params).all<any>();
    const { results: costs } = await c.env.DB.prepare(
      `SELECT ic.income_id, ic.category, SUM(ic.amount_ars) as amount_ars FROM income_costs ic
       JOIN income i ON i.id = ic.income_id WHERE i.source = 'cotizacion' GROUP BY ic.income_id, ic.category`
    ).all<any>();
    const byTrip: Record<string, Record<string, number>> = {};
    for (const r of costs) (byTrip[r.income_id] ||= {})[r.category] = r.amount_ars;
    return c.json(trips.map(t => ({ ...t, costs_by_category: byTrip[t.id] || {} })));
  });

  app.get('/api/trips/:id', requireAuth, async (c) => {
    await ensureTripSchema(c.env.DB);
    const id = c.req.param('id');
    const income = await c.env.DB.prepare(
      'SELECT i.*, q.quote_number, q.status as quote_status FROM income i LEFT JOIN quotes q ON q.id = i.quote_id WHERE i.id = ?'
    ).bind(id).first();
    if (!income) return c.json({ error: 'No encontrado' }, 404);
    const { results: costs } = await c.env.DB.prepare('SELECT * FROM income_costs WHERE income_id = ? ORDER BY sort_order ASC').bind(id).all();
    const { results: payments } = await c.env.DB.prepare('SELECT * FROM income_payments WHERE income_id = ? ORDER BY date ASC, sort_order ASC').bind(id).all();
    return c.json({ ...income, costs, payments });
  });

  // Edición manual de los costos previstos y del presupuestado (desde ahí la cotización ya no los pisa)
  app.put('/api/trips/:id/costs', requireAuth, async (c) => {
    await ensureTripSchema(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    const costs: any[] = body.costs || [];
    const keep = new Set(costs.filter(x => x.id).map(x => x.id));
    const { results: existing } = await c.env.DB.prepare('SELECT id FROM income_costs WHERE income_id = ?').bind(id).all<any>();
    for (const e of existing) {
      if (keep.has(e.id)) continue;
      await c.env.DB.prepare('UPDATE income_payments SET cost_id = NULL WHERE cost_id = ?').bind(e.id).run();
      await c.env.DB.prepare('DELETE FROM income_costs WHERE id = ?').bind(e.id).run();
    }
    for (let i = 0; i < costs.length; i++) {
      const x = costs[i];
      const amount = Math.ceil(Number(x.amount_ars) || 0);
      if (x.id) {
        await c.env.DB.prepare('UPDATE income_costs SET category=?, description=?, amount_ars=?, sort_order=? WHERE id=? AND income_id=?')
          .bind(x.category, x.description || '', amount, i, x.id, id).run();
      } else {
        await c.env.DB.prepare('INSERT INTO income_costs (id, income_id, category, description, amount_ars, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(generateId(), id, x.category, x.description || '', amount, i).run();
      }
    }
    if (body.amount_ars != null) {
      const ars = Math.ceil(Number(body.amount_ars) || 0);
      const income = await c.env.DB.prepare('SELECT exchange_rate, amount_usd FROM income WHERE id = ?').bind(id).first<any>();
      const tc = income?.exchange_rate || 0;
      await c.env.DB.prepare('UPDATE income SET amount_ars = ?, amount_usd = ? WHERE id = ?')
        .bind(ars, tc > 0 ? Math.ceil(ars / tc) : (income?.amount_usd || 0), id).run();
    }
    await c.env.DB.prepare('UPDATE income SET costs_edited = 1, updated_at = ? WHERE id = ?').bind(new Date().toISOString(), id).run();
    return c.json({ ok: true });
  });

  // Trae de nuevo los números de la cotización, conservando cobros y pagos
  app.post('/api/trips/:id/resync', requireAuth, async (c) => {
    await ensureTripSchema(c.env.DB);
    const id = c.req.param('id');
    const income = await c.env.DB.prepare('SELECT quote_id FROM income WHERE id = ?').bind(id).first<any>();
    if (!income?.quote_id) return c.json({ error: 'El viaje no tiene cotización asociada' }, 400);
    const computed = await computeTripFromQuote(c.env.DB, income.quote_id);
    if (!computed) return c.json({ error: 'La cotización ya no existe' }, 404);
    await writeTripHeader(c.env.DB, id!, computed.trip);
    await writeTripCosts(c.env.DB, id!, computed.trip.costs);
    await c.env.DB.prepare('UPDATE income SET costs_edited = 0, synced_from_quote = 1 WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
  });

  // Cobro del cliente (ingreso) o pago de un costo (egreso, con cost_id)
  app.post('/api/trips/:id/payments', requireAuth, async (c) => {
    await ensureTripSchema(c.env.DB);
    const id = c.req.param('id');
    const p = await c.req.json();
    const income = await c.env.DB.prepare('SELECT exchange_rate FROM income WHERE id = ?').bind(id).first<any>();
    if (!income) return c.json({ error: 'No encontrado' }, 404);
    const row = paymentToRow(p, income.exchange_rate);
    const order = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM income_payments WHERE income_id = ?').bind(id).first<any>();
    const pid = generateId();
    await c.env.DB.prepare(`
      INSERT INTO income_payments (id, income_id, type, amount_usd, amount_ars, exchange_rate,
        payment_method, transfer_account, invoice_number, date, notes, sort_order, cost_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      pid, id, row.type, row.amount_usd, row.amount_ars, row.exchange_rate,
      p.payment_method || null, p.transfer_account || null, p.invoice_number || null,
      p.date, p.notes || null, order?.n ?? 0, row.type === 'egreso' ? (p.cost_id || null) : null
    ).run();
    return c.json({ ok: true, id: pid });
  });

  app.delete('/api/trips/:id/payments/:pid', requireAuth, async (c) => {
    await c.env.DB.prepare('DELETE FROM income_payments WHERE id = ? AND income_id = ?').bind(c.req.param('pid'), c.req.param('id')).run();
    return c.json({ ok: true });
  });
}
