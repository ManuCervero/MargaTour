-- ============================================================
-- MARGA TOUR CRM - D1 Schema (SQLite)
-- ============================================================

-- Users (auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'Ventas',
  status TEXT NOT NULL DEFAULT 'Active',
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'Nuevo',
  service_type TEXT,
  is_bot_active INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'Media',
  last_activity TEXT DEFAULT (datetime('now')),
  last_message TEXT,
  notes TEXT,
  client_id TEXT,
  pending_decision INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  origin TEXT,
  client_type TEXT,
  status TEXT DEFAULT 'Activo',
  total_spent REAL DEFAULT 0,
  last_trip TEXT,
  birthdate TEXT,
  document_id TEXT,
  emergency_phone TEXT,
  has_food_restrictions INTEGER DEFAULT 0,
  food_restrictions_detail TEXT,
  has_disability INTEGER DEFAULT 0,
  disability_detail TEXT,
  travels_with_pet INTEGER DEFAULT 0,
  image_consent INTEGER DEFAULT 0,
  visit_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  region TEXT,
  category TEXT,
  stars INTEGER,
  is_active INTEGER DEFAULT 1,
  contact TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  rating REAL,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  is_accessible INTEGER DEFAULT 0,
  is_pet_friendly INTEGER DEFAULT 0,
  notes TEXT,
  price_per_night REAL,
  has_wifi INTEGER DEFAULT 0,
  has_pool INTEGER DEFAULT 0,
  has_gym INTEGER DEFAULT 0,
  has_spa INTEGER DEFAULT 0,
  has_restaurant INTEGER DEFAULT 0,
  has_parking INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  region TEXT,
  category TEXT,
  duration TEXT,
  difficulty TEXT,
  is_active INTEGER DEFAULT 1,
  contact TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  notes TEXT,
  rating REAL,
  price TEXT,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  is_accessible INTEGER DEFAULT 0,
  is_pet_friendly INTEGER DEFAULT 0,
  is_kid_friendly INTEGER DEFAULT 0,
  provider TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  region TEXT,
  category TEXT,
  cuisine_type TEXT,
  is_active INTEGER DEFAULT 1,
  contact TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  notes TEXT,
  rating REAL,
  price_range TEXT,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  schedule TEXT,
  price_min REAL,
  price_max REAL,
  is_accessible INTEGER DEFAULT 0,
  is_pet_friendly INTEGER DEFAULT 0,
  is_kid_friendly INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Wineries
CREATE TABLE IF NOT EXISTS wineries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  region TEXT,
  department TEXT,
  has_restaurant INTEGER DEFAULT 0,
  has_degustation INTEGER DEFAULT 0,
  is_accessible INTEGER DEFAULT 0,
  is_pet_friendly INTEGER DEFAULT 0,
  is_kid_friendly INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  description TEXT,
  menu_price REAL,
  degustation_price REAL,
  contact TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  requires_reservation INTEGER DEFAULT 0,
  rating REAL,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Experiences
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  region TEXT,
  category TEXT,
  duration TEXT,
  includes TEXT,
  is_active INTEGER DEFAULT 1,
  contact TEXT,
  description TEXT,
  rating REAL,
  price TEXT,
  image_url TEXT,
  highlight TEXT,
  departure_time TEXT,
  is_accessible INTEGER DEFAULT 0,
  url_producto TEXT,
  notes TEXT,
  provider TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lead_id TEXT NOT NULL,
  quote_type TEXT,
  origin TEXT,
  destination TEXT,
  pax INTEGER,
  price REAL,
  status TEXT DEFAULT 'Enviada',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lead_id TEXT NOT NULL,
  sender TEXT,
  text TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Airport transfers
CREATE TABLE IF NOT EXISTS airport_transfers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  zone TEXT NOT NULL,
  price REAL,
  needs_consultation INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tours
CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  tour_type TEXT,
  region TEXT,
  duration_hours REAL,
  price REAL,
  extra_hour_price REAL,
  needs_consultation INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  service_type TEXT,
  origin TEXT,
  destination TEXT,
  price REAL,
  pax_max INTEGER,
  active INTEGER DEFAULT 1,
  notes TEXT,
  extra_hour_price REAL
);

-- Places
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  place_type TEXT NOT NULL,
  region TEXT,
  category TEXT,
  status TEXT DEFAULT 'Active',
  contact TEXT,
  address TEXT,
  website TEXT,
  details TEXT,
  rating REAL,
  department TEXT,
  has_restaurant INTEGER DEFAULT 0,
  is_accessible INTEGER DEFAULT 0,
  is_pet_friendly INTEGER DEFAULT 0,
  is_kid_friendly INTEGER DEFAULT 0,
  is_recommended INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  requires_reservation INTEGER DEFAULT 0,
  price REAL,
  description TEXT,
  opening_hours TEXT,
  image_url TEXT
);

-- Settings
CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO guides (id, name, language) VALUES
  ('guide-pt', 'Guía Portugués', 'Portugués'),
  ('guide-fr', 'Guía Francés', 'Francés'),
  ('guide-en', 'Guía Inglés', 'Inglés');

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  costo_km REAL DEFAULT 1500,
  precio_full_day REAL DEFAULT 45000,
  precio_medio_dia REAL DEFAULT 25000,
  precio_viaticos REAL DEFAULT 10000,
  ganancia REAL DEFAULT 0
);

INSERT OR IGNORE INTO settings (id) VALUES (1);
