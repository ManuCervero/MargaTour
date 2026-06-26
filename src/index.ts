import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, createJWT, generateId } from './auth';
import { requireAuth } from './middleware';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Faltan datos' }, 400);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ? AND status = ?')
    .bind(username.trim(), 'Active')
    .first<{ id: string; username: string; password_hash: string; name: string; role: string }>();

  if (!user) return c.json({ error: 'Usuario o contraseña incorrectos' }, 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: 'Usuario o contraseña incorrectos' }, 401);

  await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .bind(new Date().toISOString(), user.id)
    .run();

  const token = await createJWT({ id: user.id, username: user.username, name: user.name, role: user.role }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

app.post('/api/auth/create-user', requireAuth, async (c) => {
  const { username, password, name, role } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Faltan datos' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) return c.json({ error: 'El usuario ya existe' }, 409);

  const hash = await hashPassword(password);
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)')
    .bind(id, username.trim(), hash, name || username, role || 'Ventas')
    .run();

  return c.json({ ok: true, id });
});

app.get('/api/auth/me', requireAuth, (c) => {
  return c.json({ user: c.get('user') });
});

// ── SETUP ─────────────────────────────────────────────────────────────────────
app.post('/api/setup', async (c) => {
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind('admin').first();
  if (existing) return c.json({ error: 'Setup ya realizado' }, 409);

  const hash = await hashPassword('admin123');
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)')
    .bind(id, 'admin', hash, 'Administrador', 'Admin')
    .run();

  return c.json({ ok: true, message: 'Usuario admin creado. Cambiá la contraseña luego.' });
});

// ── GENERIC CRUD HELPER ───────────────────────────────────────────────────────

function crudRoutes(app: Hono<{ Bindings: Bindings }>, table: string) {
  app.get(`/api/${table}`, requireAuth, async (c) => {
    const { results } = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC`).all();
    return c.json(results);
  });

  app.get(`/api/${table}/:id`, requireAuth, async (c) => {
    const row = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'No encontrado' }, 404);
    return c.json(row);
  });

  app.post(`/api/${table}`, requireAuth, async (c) => {
    const body = await c.req.json();
    const id = generateId();
    const keys = Object.keys(body);
    const values = Object.values(body);
    const placeholders = keys.map(() => '?').join(', ');
    await c.env.DB.prepare(`INSERT INTO ${table} (id, ${keys.join(', ')}) VALUES (?, ${placeholders})`)
      .bind(id, ...values)
      .run();
    return c.json({ ok: true, id });
  });

  app.patch(`/api/${table}/:id`, requireAuth, async (c) => {
    const body = await c.req.json();
    const keys = Object.keys(body);
    const values = Object.values(body);
    const sets = keys.map(k => `${k} = ?`).join(', ');
    await c.env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`)
      .bind(...values, c.req.param('id'))
      .run();
    return c.json({ ok: true });
  });

  app.delete(`/api/${table}/:id`, requireAuth, async (c) => {
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(c.req.param('id')).run();
    return c.json({ ok: true });
  });
}

// ── HELPER: calcular costo de transfer ───────────────────────────────────────

interface TarifaSettings {
  costo_km: number;
  precio_full_day: number;
  precio_medio_dia: number;
  precio_viaticos: number;
  ganancia: number;
  usd_exchange_rate: number;
}

const DEFAULT_SETTINGS: TarifaSettings = {
  costo_km: 566,
  precio_full_day: 90000,
  precio_medio_dia: 45000,
  precio_viaticos: 20000,
  ganancia: 50,
  usd_exchange_rate: 1200,
};

function calcTransferCosts(distanceKm: number, durationHours: number, settings: TarifaSettings) {
  const isFullDay = distanceKm > 150 || durationHours >= 6;
  const baseCostArs =
    (distanceKm * settings.costo_km) +
    settings.precio_viaticos +
    (isFullDay ? settings.precio_full_day : settings.precio_medio_dia);
  const exchangeRate = settings.usd_exchange_rate || 1200;
  const baseCostUsd = baseCostArs / exchangeRate;
  const finalCostUsd = baseCostUsd * (1 + settings.ganancia / 100);
  return { baseCostArs, baseCostUsd, finalCostUsd, isFullDay };
}

async function fetchSettings(db: D1Database): Promise<TarifaSettings> {
  const row = await db.prepare('SELECT * FROM settings WHERE id = 1').first<TarifaSettings>();
  return { ...DEFAULT_SETTINGS, ...row };
}

// ── SETTINGS: Exchange Rate ───────────────────────────────────────────────────

app.get('/api/settings/exchange-rate', requireAuth, async (c) => {
  const row = await c.env.DB.prepare('SELECT usd_exchange_rate FROM settings WHERE id = 1').first<{ usd_exchange_rate: number }>();
  const value = row?.usd_exchange_rate ?? 1200;
  return c.json({ value });
});

app.put('/api/settings/exchange-rate', requireAuth, async (c) => {
  const { value } = await c.req.json();
  if (!value || isNaN(Number(value))) return c.json({ error: 'Valor inválido' }, 400);
  await c.env.DB.prepare('INSERT OR IGNORE INTO settings (id) VALUES (1)').run();
  await c.env.DB.prepare('UPDATE settings SET usd_exchange_rate = ? WHERE id = 1').bind(Number(value)).run();
  return c.json({ ok: true, value: Number(value) });
});

// ── QUOTES ────────────────────────────────────────────────────────────────────

app.get('/api/quotes/next-number', requireAuth, async (c) => {
  const row = await c.env.DB.prepare('SELECT last_number FROM quote_sequence').first<{ last_number: number }>();
  return c.json({ next_number: (row?.last_number ?? 0) + 1 });
});

app.get('/api/quotes', requireAuth, async (c) => {
  const { status, client_id, date_from, date_to } = c.req.query();
  let sql = 'SELECT * FROM quotes WHERE 1=1';
  const params: unknown[] = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (client_id) { sql += ' AND client_id = ?'; params.push(client_id); }
  if (date_from) { sql += ' AND date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND date <= ?'; params.push(date_to); }
  sql += ' ORDER BY created_at DESC';
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

app.get('/api/quotes/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first();
  if (!quote) return c.json({ error: 'No encontrado' }, 404);
  const { results: rawTransfers } = await c.env.DB.prepare(
    'SELECT * FROM quote_transfers WHERE quote_id = ? ORDER BY sort_order ASC'
  ).bind(id).all();
  const { results: services } = await c.env.DB.prepare(
    'SELECT * FROM quote_services WHERE quote_id = ? ORDER BY sort_order ASC'
  ).bind(id).all();
  const transfers = rawTransfers.map((t: any) => ({
    ...t,
    map_waypoints: t.map_waypoints ? JSON.parse(t.map_waypoints) : undefined,
  }));
  return c.json({ ...quote, transfers, services });
});

app.post('/api/quotes', requireAuth, async (c) => {
  const body = await c.req.json();

  const settings = await fetchSettings(c.env.DB);

  // Get next quote number
  await c.env.DB.prepare('UPDATE quote_sequence SET last_number = last_number + 1').run();
  const seqRow = await c.env.DB.prepare('SELECT last_number FROM quote_sequence').first<{ last_number: number }>();
  const quoteNumber = seqRow?.last_number ?? 1;

  const id = generateId();
  const now = new Date().toISOString();

  const transfers: any[] = body.transfers || [];
  const services: any[] = body.services || [];

  // Insert quote — usa TC y ganancias del frontend
  await c.env.DB.prepare(`
    INSERT INTO quotes (id, quote_number, client_id, client_name, client_phone, client_email,
      description, date, status, type, experience_id, exchange_rate, ganancia_transfer,
      ganancia_servicio, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, quoteNumber,
    body.client_id || null, body.client_name, body.client_phone || null, body.client_email || null,
    body.description || null, body.date, body.status || 'draft', body.type || 'custom',
    body.experience_id || null,
    body.exchange_rate || settings.usd_exchange_rate,
    body.ganancia_transfer || 0,
    body.ganancia_servicio || 0,
    body.notes || null, now, now
  ).run();

  let totalTransfers = 0;
  let totalServices = 0;

  // Insert transfers — respeta valores calculados por el frontend
  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i];
    const tid = generateId();
    const finalCost = t.final_cost_usd || 0;
    totalTransfers += finalCost;
    await c.env.DB.prepare(`
      INSERT INTO quote_transfers (id, quote_id, day, origin, destination, pax, hour,
        distance_km, duration_hours, is_full_day, is_round_trip, viaticos,
        base_cost_ars, base_cost_usd, margin_pct, final_cost_usd, map_waypoints, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tid, id, t.day, t.origin, t.destination, t.pax || 1, t.hour || null,
      t.distance_km || 0, t.duration_hours || 0,
      t.is_full_day ? 1 : 0, t.is_round_trip ? 1 : 0, t.viaticos || 0,
      t.base_cost_ars || 0, t.base_cost_usd || 0,
      t.margin_pct || 0, finalCost,
      t.map_waypoints ? JSON.stringify(t.map_waypoints) : null,
      t.notes || null, i
    ).run();
  }

  // Insert services — respeta valores calculados por el frontend
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const sid = generateId();
    const finalCost = s.final_cost_usd || 0;
    totalServices += finalCost;
    await c.env.DB.prepare(`
      INSERT INTO quote_services (id, quote_id, day, checkout_day, service_type, service_id,
        service_name, pax, agency_price_ars, unit_price_usd, margin_pct, final_cost_usd, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sid, id, s.day, s.checkout_day || null, s.service_type, s.service_id || null,
      s.service_name, s.pax || 1,
      s.agency_price_ars || 0, s.unit_price_usd || 0, s.margin_pct || 0,
      finalCost, s.notes || null, i
    ).run();
  }

  const totalGross = totalTransfers + totalServices;
  await c.env.DB.prepare(`
    UPDATE quotes SET total_transfers = ?, total_services = ?, total_gross = ? WHERE id = ?
  `).bind(totalTransfers, totalServices, totalGross, id).run();

  return c.json({ ok: true, id, quote_number: quoteNumber });
});

app.put('/api/quotes/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const settings = await fetchSettings(c.env.DB);
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE quotes SET client_id=?, client_name=?, client_phone=?, client_email=?,
      description=?, date=?, status=?, type=?, experience_id=?, notes=?,
      exchange_rate=?, ganancia_transfer=?, ganancia_servicio=?, updated_at=?
    WHERE id=?
  `).bind(
    body.client_id || null, body.client_name, body.client_phone || null, body.client_email || null,
    body.description || null, body.date, body.status || 'draft', body.type || 'custom',
    body.experience_id || null, body.notes || null,
    body.exchange_rate || settings.usd_exchange_rate,
    body.ganancia_transfer || 0,
    body.ganancia_servicio || 0,
    now, id
  ).run();

  // Replace transfers and services
  await c.env.DB.prepare('DELETE FROM quote_transfers WHERE quote_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM quote_services WHERE quote_id = ?').bind(id).run();

  const transfers: any[] = body.transfers || [];
  const services: any[] = body.services || [];
  let totalTransfers = 0;
  let totalServices = 0;

  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i];
    const tid = generateId();
    const finalCost = t.final_cost_usd || 0;
    totalTransfers += finalCost;
    await c.env.DB.prepare(`
      INSERT INTO quote_transfers (id, quote_id, day, origin, destination, pax, hour,
        distance_km, duration_hours, is_full_day, is_round_trip, viaticos,
        base_cost_ars, base_cost_usd, margin_pct, final_cost_usd, map_waypoints, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tid, id, t.day, t.origin, t.destination, t.pax || 1, t.hour || null,
      t.distance_km || 0, t.duration_hours || 0,
      t.is_full_day ? 1 : 0, t.is_round_trip ? 1 : 0, t.viaticos || 0,
      t.base_cost_ars || 0, t.base_cost_usd || 0,
      t.margin_pct || 0, finalCost,
      t.map_waypoints ? JSON.stringify(t.map_waypoints) : null,
      t.notes || null, i
    ).run();
  }

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const sid = generateId();
    const finalCost = s.final_cost_usd || 0;
    totalServices += finalCost;
    await c.env.DB.prepare(`
      INSERT INTO quote_services (id, quote_id, day, checkout_day, service_type, service_id,
        service_name, pax, agency_price_ars, unit_price_usd, margin_pct, final_cost_usd, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sid, id, s.day, s.checkout_day || null, s.service_type, s.service_id || null,
      s.service_name, s.pax || 1,
      s.agency_price_ars || 0, s.unit_price_usd || 0, s.margin_pct || 0,
      finalCost, s.notes || null, i
    ).run();
  }

  const totalGross = totalTransfers + totalServices;
  await c.env.DB.prepare(`
    UPDATE quotes SET total_transfers = ?, total_services = ?, total_gross = ? WHERE id = ?
  `).bind(totalTransfers, totalServices, totalGross, id).run();

  return c.json({ ok: true });
});

app.patch('/api/quotes/:id/status', requireAuth, async (c) => {
  const { status } = await c.req.json();
  const validStatuses = ['draft', 'sent', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) return c.json({ error: 'Estado inválido' }, 400);
  await c.env.DB.prepare('UPDATE quotes SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, new Date().toISOString(), c.req.param('id'))
    .run();
  return c.json({ ok: true });
});

app.delete('/api/quotes/:id', requireAuth, async (c) => {
  await c.env.DB.prepare('DELETE FROM quotes WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

// ── RUTAS CRUD ────────────────────────────────────────────────────────────────
crudRoutes(app, 'leads');
crudRoutes(app, 'clients');
crudRoutes(app, 'hotels');
crudRoutes(app, 'activities');
crudRoutes(app, 'restaurants');
crudRoutes(app, 'wineries');
crudRoutes(app, 'experiences');
crudRoutes(app, 'messages');
crudRoutes(app, 'airport_transfers');
crudRoutes(app, 'routes');
crudRoutes(app, 'tours');
crudRoutes(app, 'guides');
crudRoutes(app, 'services');
crudRoutes(app, 'places');

// ── MESSAGES: buscar por lead ─────────────────────────────────────────────────
app.get('/api/leads/:id/messages', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM messages WHERE lead_id = ? ORDER BY timestamp ASC')
    .bind(c.req.param('id'))
    .all();
  return c.json(results);
});

// ── SETTINGS (siempre id=1) ───────────────────────────────────────────────────
app.get('/api/settings', requireAuth, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM settings WHERE id = 1').first();
  return c.json(row ? [row] : []);
});

app.patch('/api/settings', requireAuth, async (c) => {
  const body = await c.req.json();
  const { id: _id, ...rest } = body as Record<string, unknown>;
  const keys = Object.keys(rest);
  if (keys.length === 0) return c.json({ ok: true });
  const values = Object.values(rest);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();
  await c.env.DB.prepare(`UPDATE settings SET ${sets} WHERE id = 1`).bind(...values).run();
  return c.json({ ok: true });
});

// ── USERS (admin) ─────────────────────────────────────────────────────────────
app.get('/api/users', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, username, name, role, status, last_login, created_at FROM users').all();
  return c.json(results);
});

app.patch('/api/users/:id', requireAuth, async (c) => {
  const body = await c.req.json();
  if (body.password) {
    body.password_hash = await hashPassword(body.password);
    delete body.password;
  }
  const keys = Object.keys(body);
  const values = Object.values(body);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  await c.env.DB.prepare(`UPDATE users SET ${sets} WHERE id = ?`).bind(...values, c.req.param('id')).run();
  return c.json({ ok: true });
});

app.delete('/api/users/:id', requireAuth, async (c) => {
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

export default app;
