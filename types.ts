
export enum ViewState {
  LEADS = 'LEADS',
  CLIENTS = 'CLIENTS',
  HISTORY = 'HISTORY',
  QUOTES = 'QUOTES',
  TRANSFERS = 'TRANSFERS',
  ROUTES = 'ROUTES',
  PLACES = 'PLACES',
  REGIONS = 'REGIONS',
  EXPERIENCES = 'EXPERIENCES',
  ACTIVITIES = 'ACTIVITIES',
  WINERIES = 'WINERIES',
  HOTELS = 'HOTELS',
  RESTAURANTS = 'RESTAURANTS',
  USERS = 'USERS',
  CONFIG = 'CONFIG',
}

export enum LeadStatus {
  // BOT FLOW
  NUEVO = 'Nuevo',
  CALIFICADO = 'Calificado',
  PRE_COTIZADO = 'Pre-cotizado',
  INTERESADO = 'Interesado', // "Handoff pendiente"
  FRIO = 'Frío / Sin respuesta',

  // HUMAN FLOW
  EN_GESTION = 'En gestión',
  COORDINANDO = 'Coordinando',
  PROGRAMADO = 'Programado',
  REALIZADO = 'Realizado',

  // SHARED
  CANCELADO = 'Cancelado',
}

export enum LeadPriority {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja',
}

export enum ServiceType {
  TRANSFER = 'Transfer',
  RUTA = 'Ruta',
  SERVICIO = 'Servicio',
  GENERAL = 'General',
}

export interface Lead {
  id: string;
  phone: string;
  name?: string;
  status: LeadStatus;
  type: ServiceType;
  isBotActive: boolean; // true = AUTO, false = HUMANO
  priority: LeadPriority;
  lastActivity: string; // ISO string or formatted time
  lastMessage: string;
  messageHistory?: Message[];
  notes?: string;
  pendingDecision?: boolean; // New flag for known contacts in NUEVO
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

export interface Quote {
  id: string;
  leadId: string;
  leadName: string;
  type: string;
  origin?: string;
  destination?: string;
  pax: number;
  price: number;
  status: 'Enviada' | 'Aprobada' | 'Cancelada' | 'Sin respuesta';
  date: string;
}

// ── SISTEMA DE COTIZACIONES ───────────────────────────────────────────────────

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type QuoteType = 'experience' | 'custom';
export type QuoteServiceType = 'winery' | 'hotel' | 'restaurant' | 'activity' | 'tour';

export interface QuoteTransfer {
  id?: string;
  quote_id?: string;
  day: string;
  origin: string;
  destination: string;
  pax: number;
  hour?: string;
  distance_km?: number;
  duration_hours?: number;
  is_full_day?: boolean | number;
  is_round_trip?: boolean;
  base_cost_ars?: number;
  base_cost_usd?: number;
  margin_pct?: number;
  final_cost_usd?: number;
  notes?: string;
  sort_order?: number;
}

export interface QuoteService {
  id?: string;
  quote_id?: string;
  day: string;
  service_type: QuoteServiceType;
  service_id?: string;
  service_name: string;
  pax: number;
  unit_price_usd: number;
  margin_pct?: number;
  final_cost_usd?: number;
  notes?: string;
  sort_order?: number;
}

export interface FullQuote {
  id?: string;
  quote_number?: number;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  description?: string;
  pax?: number;
  date: string;
  status: QuoteStatus;
  type: QuoteType;
  experience_id?: string;
  exchange_rate?: number;
  total_transfers?: number;
  total_services?: number;
  total_gross?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  transfers: QuoteTransfer[];
  services: QuoteService[];
}

export interface Hotel {
  id: string;
  name: string;
  region: string;
  stars?: number;
  price_per_night?: number;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  notes?: string;
  is_active?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  region: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  notes?: string;
  is_active?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  region: string;
  category?: string;
  price?: number;
  duration?: string;
  description?: string;
  notes?: string;
  is_active?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  region: string;
  price?: number;
  duration?: string;
  description?: string;
  notes?: string;
  is_active?: boolean;
}

export interface Experience {
  id: string;
  name: string;
  region?: string;
  price?: number;
  duration?: string;
  description?: string;
  notes?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface Transfer {
  id: string;
  name: string;
  type: 'Aeropuerto' | 'Tour' | 'Especial' | 'Cena';
  origin: string;
  destination: string;
  oneWay: boolean; // Solo_ida
  price: number;
  paxMax: number;
  extraHourPrice?: number;
  active: boolean;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  origin: string; // e.g. Country/City
  client_type: 'Particular' | 'Agencia' | 'Corporativo';
  status: 'Activo' | 'Inactivo' | 'VIP';
  total_spent: number;
  last_trip: string;
  created_at?: string;
  birthdate?: string;
  document_id?: string;
  emergency_phone?: string;
  has_food_restrictions?: boolean;
  food_restrictions_detail?: string;
  has_disability?: boolean;
  disability_detail?: string;
  travels_with_pet?: boolean;
  image_consent?: boolean;
  visit_reason?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Conductor' | 'Ventas';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  region: string;
  category?: string;
  status: 'Active' | 'Inactive';
  rating?: number;
  details?: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  created_at?: string;
}

export type RegionName = 'Ciudad' | 'Primera Zona (Luján + Maipú)' | 'Valle de Uco' | 'Alta Montaña' | 'Valle Sur' | 'Valle Este';

export interface Winery {
  id: string;
  name: string;
  region: RegionName | string;
  department?: string;
  hasRestaurant: boolean;
  hasDegustation: boolean;
  isAccessible: boolean;
  isPetFriendly: boolean;
  isKidFriendly: boolean;
  isActive: boolean;
  menuPrice?: number;
  degustationPrice?: number;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  notes?: string;
  requiresReservation?: boolean;
}
