import type { Hono } from 'hono';
import { generateId } from './auth';
import { requireAuth } from './middleware';

// ── CALENDARIO (Operación → Calendario) ───────────────────────────────────────
// Cada transfer de una cotización aprobada es un evento del calendario. A cada
// vehículo pedido en el transfer se le asigna un vehículo propio y un conductor
// (o un proveedor, si el vehículo es contratado).
//
// Las cotizaciones borran y vuelven a crear sus transfers en cada edición, así que
// la asignación no se ata al id del transfer sino a una clave estable:
// día|origen|destino|n (n = ocurrencia, por si hay dos transfers iguales el mismo día).

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };

let calendarSchemaReady = false;

export async function ensureCalendarSchema(db: D1Database) {
  if (calendarSchemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    capacity INTEGER DEFAULT 0,
    vehicle_type TEXT DEFAULT 'van',
    accessible INTEGER DEFAULT 0,
    status TEXT DEFAULT 'operativo',
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS transfer_assignments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    transfer_key TEXT NOT NULL,
    day TEXT,
    slot INTEGER DEFAULT 0,
    vehicle_id TEXT,
    driver_id TEXT,
    external_provider TEXT,
    notes TEXT,
    updated_at TEXT
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_transfer_assignments_quote ON transfer_assignments (quote_id, transfer_key)').run();
  calendarSchemaReady = true;
}

const parseJson = (v: unknown, fallback: any) => {
  if (typeof v !== 'string' || !v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};

const dayOf = (d: unknown) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : '');

const norm = (s: unknown) => String(s || '').trim().toLowerCase();

// Las cotizaciones viejas guardan vehicles como ['van']; las nuevas como [{ type, contracted }]
const normalizeVehicles = (raw: unknown) => {
  const list: any[] = parseJson(raw, []);
  const out = list
    .map(v => (typeof v === 'string' ? { type: v, contracted: false } : v && typeof v === 'object' ? { type: v.type || 'van', contracted: !!v.contracted } : null))
    .filter(Boolean) as { type: string; contracted: boolean }[];
  return out.length ? out : [{ type: 'van', contracted: false }];
};

const VEHICLE_FIELDS = ['plate', 'brand', 'model', 'year', 'capacity', 'vehicle_type', 'accessible', 'status', 'notes', 'is_active'];
const DRIVER_FIELDS = ['first_name', 'last_name', 'phone', 'email', 'notes', 'is_active'];

const pick = (body: Record<string, unknown>, fields: string[]) => {
  const out: Record<string, unknown> = {};
  for (const f of fields) if (f in body) out[f] = body[f] === '' ? null : body[f];
  return out;
};

function catalogRoutes(app: Hono<Env>, path: string, table: string, fields: string[], required: string, order: string) {
  app.get(`/api/${path}`, requireAuth, async (c) => {
    await ensureCalendarSchema(c.env.DB);
    const { results } = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY is_active DESC, ${order}`).all();
    return c.json(results);
  });

  app.post(`/api/${path}`, requireAuth, async (c) => {
    await ensureCalendarSchema(c.env.DB);
    const data = pick(await c.req.json(), fields);
    if (!String(data[required] || '').trim()) return c.json({ error: 'Falta completar un campo obligatorio' }, 400);
    const id = generateId();
    const keys = Object.keys(data);
    await c.env.DB.prepare(`INSERT INTO ${table} (id${keys.map(k => `, ${k}`).join('')}) VALUES (?${keys.map(() => ', ?').join('')})`)
      .bind(id, ...Object.values(data)).run();
    return c.json({ ok: true, id });
  });

  app.patch(`/api/${path}/:id`, requireAuth, async (c) => {
    await ensureCalendarSchema(c.env.DB);
    const data = pick(await c.req.json(), fields);
    const keys = Object.keys(data);
    if (keys.length === 0) return c.json({ ok: true });
    if (required in data && !String(data[required] || '').trim()) return c.json({ error: 'Falta completar un campo obligatorio' }, 400);
    await c.env.DB.prepare(`UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`)
      .bind(...Object.values(data), c.req.param('id')).run();
    return c.json({ ok: true });
  });
}

export function calendarRoutes(app: Hono<Env>) {
  // Vehículos y conductores no se borran: se dan de baja (is_active = 0) para no
  // perder el historial de asignaciones.
  catalogRoutes(app, 'fleet', 'fleet_vehicles', VEHICLE_FIELDS, 'plate', 'plate ASC');
  catalogRoutes(app, 'drivers', 'drivers', DRIVER_FIELDS, 'first_name', 'first_name ASC, last_name ASC');

  app.get('/api/calendar', requireAuth, async (c) => {
    await ensureCalendarSchema(c.env.DB);
    const { date_from, date_to } = c.req.query();
    if (!date_from || !date_to) return c.json({ error: 'Faltan date_from y date_to' }, 400);

    const { results: quotes } = await c.env.DB.prepare(`
      SELECT q.id, q.quote_number, q.client_name, q.client_phone, q.description, q.pax, q.notes
      FROM quotes q
      WHERE q.status = 'approved' AND COALESCE(q.kind, 'quote') <> 'experience'
        AND EXISTS (SELECT 1 FROM quote_transfers t WHERE t.quote_id = q.id AND substr(t.day, 1, 10) BETWEEN ? AND ?)
    `).bind(date_from, date_to).all<any>();
    if (quotes.length === 0) return c.json([]);

    const ids = quotes.map(q => q.id);
    const marks = ids.map(() => '?').join(', ');
    // Se traen todos los transfers de cada cotización (no solo los del rango) para
    // que la numeración de ocurrencias sea la misma en cualquier mes.
    const { results: transfers } = await c.env.DB.prepare(
      `SELECT * FROM quote_transfers WHERE quote_id IN (${marks}) ORDER BY quote_id, sort_order ASC`
    ).bind(...ids).all<any>();
    const { results: assignments } = await c.env.DB.prepare(
      `SELECT * FROM transfer_assignments WHERE quote_id IN (${marks}) ORDER BY slot ASC`
    ).bind(...ids).all<any>();

    const quoteById = new Map(quotes.map(q => [q.id, q]));
    const assignByKey = new Map<string, any[]>();
    for (const a of assignments) {
      const k = `${a.quote_id}::${a.transfer_key}`;
      if (!assignByKey.has(k)) assignByKey.set(k, []);
      assignByKey.get(k)!.push(a);
    }

    const seen = new Map<string, number>();
    const events: any[] = [];
    for (const t of transfers) {
      const day = dayOf(t.day);
      const base = `${t.quote_id}|${day}|${norm(t.origin)}|${norm(t.destination)}`;
      const n = seen.get(base) || 0;
      seen.set(base, n + 1);
      if (!day || day < date_from || day > date_to) continue;
      const q = quoteById.get(t.quote_id);
      const transferKey = `${day}|${norm(t.origin)}|${norm(t.destination)}|${n}`;
      events.push({
        id: `${t.quote_id}::${transferKey}`,
        quote_id: t.quote_id,
        quote_number: q?.quote_number || 0,
        client_name: q?.client_name || '',
        client_phone: q?.client_phone || null,
        quote_description: q?.description || null,
        quote_notes: q?.notes || null,
        transfer_key: transferKey,
        day,
        hour: t.hour || null,
        origin: t.origin || '',
        destination: t.destination || '',
        pax: t.pax || q?.pax || 1,
        duration_hours: t.duration_hours || 0,
        is_full_day: !!t.is_full_day,
        is_round_trip: !!t.is_round_trip,
        distance_km: t.distance_km || 0,
        notes: t.notes || null,
        vehicles: normalizeVehicles(t.vehicles),
        assignments: (assignByKey.get(`${t.quote_id}::${transferKey}`) || []).map(a => ({
          slot: a.slot,
          vehicle_id: a.vehicle_id,
          driver_id: a.driver_id,
          external_provider: a.external_provider,
          notes: a.notes,
        })),
      });
    }
    events.sort((a, b) => (a.day + (a.hour || '99:99')).localeCompare(b.day + (b.hour || '99:99')));
    return c.json(events);
  });

  // Reemplaza las asignaciones de un transfer (un registro por vehículo pedido)
  app.put('/api/calendar/assignments', requireAuth, async (c) => {
    await ensureCalendarSchema(c.env.DB);
    const body = await c.req.json();
    const quoteId = String(body.quote_id || '');
    const transferKey = String(body.transfer_key || '');
    if (!quoteId || !transferKey) return c.json({ error: 'Faltan datos del transfer' }, 400);
    const slots: any[] = Array.isArray(body.slots) ? body.slots : [];
    const now = new Date().toISOString();

    const stmts = [
      c.env.DB.prepare('DELETE FROM transfer_assignments WHERE quote_id = ? AND transfer_key = ?').bind(quoteId, transferKey),
    ];
    for (const s of slots) {
      const vehicleId = s.vehicle_id || null;
      const driverId = s.driver_id || null;
      const provider = String(s.external_provider || '').trim() || null;
      if (!vehicleId && !driverId && !provider) continue;
      stmts.push(c.env.DB.prepare(`
        INSERT INTO transfer_assignments (id, quote_id, transfer_key, day, slot, vehicle_id, driver_id, external_provider, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(generateId(), quoteId, transferKey, transferKey.slice(0, 10), Number(s.slot) || 0, vehicleId, driverId, provider, s.notes || null, now));
    }
    await c.env.DB.batch(stmts);
    return c.json({ ok: true });
  });
}
