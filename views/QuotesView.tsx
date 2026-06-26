import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, FileText, Edit2, Trash2, Printer, ChevronLeft,
  DollarSign, ArrowRight, X, Check, Clock, SendHorizontal,
  CalendarDays, Users, MapPin, Utensils, Bed, Wine, Compass, Navigation,
  AlertCircle, RefreshCw, PenLine, Loader2, UserCheck
} from 'lucide-react';
import { api } from '../lib/api';
import type { FullQuote, QuoteTransfer, QuoteService, QuoteStatus, QuoteServiceType, Route, Client } from '../types';
import { RouteMapModal } from '../components/RouteMapModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtARS = (n: number) =>
  `$${Math.round(n).toLocaleString('es-AR')}`;

interface TarifaSettings {
  costo_km: number;
  precio_full_day: number;
  precio_medio_dia: number;
  precio_viaticos: number;
  ganancia: number;
  usd_exchange_rate: number;
}

const DEFAULT_TARIFA: TarifaSettings = {
  costo_km: 566,
  precio_full_day: 90000,
  precio_medio_dia: 45000,
  precio_viaticos: 20000,
  ganancia: 50,
  usd_exchange_rate: 1200,
};

function calcTransferCosts(distKm: number, durHours: number, settings: TarifaSettings, viaticos = 0) {
  if (!distKm) return { baseCostArs: 0, finalCostArs: 0, isFullDay: false };
  const isFullDay = distKm > 150 || durHours >= 6;
  const baseCostArs =
    (distKm * settings.costo_km) +
    (isFullDay ? settings.precio_full_day : settings.precio_medio_dia) +
    viaticos;
  return { baseCostArs, finalCostArs: baseCostArs, isFullDay };
}

function calcServiceFinal(unitPrice: number, pax: number) {
  return unitPrice * pax;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const SERVICE_ICONS: Record<QuoteServiceType, React.ReactNode> = {
  winery: <Wine size={14} />,
  hotel: <Bed size={14} />,
  restaurant: <Utensils size={14} />,
  activity: <Compass size={14} />,
  tour: <Navigation size={14} />,
  guide: <UserCheck size={14} />,
};

const SERVICE_LABELS: Record<QuoteServiceType, string> = {
  winery: 'Bodega',
  hotel: 'Hotel',
  restaurant: 'Restaurante',
  activity: 'Actividad',
  tour: 'Tour',
  guide: 'Guía',
};

const emptyTransfer = (): QuoteTransfer => ({
  day: new Date().toISOString().slice(0, 10),
  origin: '',
  destination: '',
  pax: 1,
  hour: '',
  distance_km: 0,
  duration_hours: 0,
  is_full_day: false,
  base_cost_ars: 0,
  base_cost_usd: 0,
  final_cost_usd: 0,
  margin_pct: 50,
  notes: '',
});

const emptyService = (): QuoteService => ({
  day: new Date().toISOString().slice(0, 10),
  service_type: 'winery',
  service_id: '',
  service_name: '',
  pax: 1,
  unit_price_usd: 0,
  margin_pct: 10,
  final_cost_usd: 0,
  notes: '',
});

const emptyQuote = (): FullQuote => ({
  client_name: '',
  client_phone: '',
  client_email: '',
  description: '',
  pax: 1,
  date: new Date().toISOString().slice(0, 10),
  status: 'draft',
  type: 'custom',
  notes: '',
  transfers: [],
  services: [],
});

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: QuoteStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

// ── ExchangeRateModal ─────────────────────────────────────────────────────────

const ExchangeRateModal: React.FC<{
  current: number;
  onSave: (val: number) => void;
  onClose: () => void;
}> = ({ current, onSave, onClose }) => {
  const [val, setVal] = useState(String(current));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await api.settings.updateExchangeRate(n);
      onSave(n);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-marga-wine mb-1">Tipo de cambio</h3>
        <p className="text-sm text-marga-dark/50 mb-4">Pesos argentinos por USD</p>
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full border border-marga-creamDark rounded-xl px-4 py-2.5 text-lg font-bold text-marga-dark focus:outline-none focus:ring-2 focus:ring-marga-wine/30 mb-4"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-marga-creamDark text-marga-dark/60 font-semibold text-sm hover:bg-marga-creamDark transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-marga-wine text-marga-cream font-bold text-sm hover:bg-marga-wineLight transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── TransferRow ───────────────────────────────────────────────────────────────

type TransferMode = 'aeropuerto' | 'tour' | 'ruta';

const TransferRow: React.FC<{
  transfer: QuoteTransfer;
  index: number;
  routes: Route[];
  settings: TarifaSettings;
  catalogData: CatalogData;
  onChange: (index: number, updated: QuoteTransfer) => void;
  onRemove: (index: number) => void;
}> = ({ transfer, index, routes, settings, catalogData, onChange, onRemove }) => {

  const [mode, setMode] = useState<TransferMode>('ruta');
  const [showMap, setShowMap] = useState(false);
  const [mapMode, setMapMode] = useState(false);

  const inp = "w-full border border-marga-creamDark rounded-lg px-3 py-2 text-sm text-marga-dark focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white";
  const sel = inp + " cursor-pointer";

  // Datos del catálogo
  const airportTransfers = catalogData.airportTransfers.filter((t: any) => t.is_active);
  const tours = catalogData.tours.filter((t: any) => t.is_active !== false);

  // Nodos de rutas (solo para modo ruta)
  const routeNodes = [...new Set([...routes.map(r => r.origin), ...routes.map(r => r.destination)])].sort();
  const destinations = !transfer.origin ? [] : [
    ...routes.filter(r => r.origin === transfer.origin).map(r => r.destination),
    ...routes.filter(r => r.destination === transfer.origin).map(r => r.origin),
  ].filter((d, i, arr) => arr.indexOf(d) === i && d !== transfer.origin).sort();

  const handleModeChange = (newMode: TransferMode) => {
    setMode(newMode);
    setMapMode(false);
    onChange(index, { ...transfer, origin: '', destination: '', distance_km: 0, base_cost_ars: 0, final_cost_usd: 0 });
  };

  const handleAirportSelect = (id: string) => {
    const t = airportTransfers.find((a: any) => a.id === id);
    if (!t) return;
    const price = t.needs_consultation ? 0 : (t.price || 0);
    onChange(index, { ...transfer, origin: 'Aeropuerto Mendoza', destination: t.zone, distance_km: 0, base_cost_ars: price, final_cost_usd: price, notes: t.needs_consultation ? 'A consultar' : (transfer.notes || '') });
  };

  const handleTourSelect = (id: string) => {
    const t = tours.find((t: any) => t.id === id);
    if (!t) return;
    const price = t.price || 0;
    onChange(index, { ...transfer, origin: t.region || '', destination: t.name, distance_km: 0, base_cost_ars: price, final_cost_usd: price, duration_hours: t.duration_hours || transfer.duration_hours });
  };

  const handleOriginChange = (origin: string) => onChange(index, { ...transfer, origin, destination: '' });

  const effectiveKm = (distKm: number) => distKm * (transfer.is_round_trip ? 2 : 1);

  const handleDestinationChange = (destination: string) => {
    const route = routes.find(r => r.origin === transfer.origin && r.destination === destination)
      || routes.find(r => r.origin === destination && r.destination === transfer.origin);
    const distKm = route?.distance_km || 0;
    const durHours = transfer.duration_hours || 0;
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(effectiveKm(distKm), durHours, settings, transfer.viaticos || 0);
    onChange(index, { ...transfer, destination, distance_km: distKm, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
  };

  const handleDurationChange = (durHours: number) => {
    const distKm = transfer.distance_km || 0;
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(effectiveKm(distKm), durHours, settings, transfer.viaticos || 0);
    onChange(index, { ...transfer, duration_hours: durHours, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
  };

  const handleRoundTripToggle = (isRoundTrip: boolean) => {
    const distKm = transfer.distance_km || 0;
    const durHours = transfer.duration_hours || 0;
    const km = distKm * (isRoundTrip ? 2 : 1);
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(km, durHours, settings, transfer.viaticos || 0);
    onChange(index, { ...transfer, is_round_trip: isRoundTrip, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
  };

  const handleViaticosChange = (viaticos: number) => {
    const distKm = transfer.distance_km || 0;
    const durHours = transfer.duration_hours || 0;
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(effectiveKm(distKm), durHours, settings, viaticos);
    onChange(index, { ...transfer, viaticos, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
  };

  const handleMapSave = async (_origin: string, _destination: string, distanceKm: number, _routeId?: string | { label: string; lat: number; lon: number }[], waypoints?: { label: string; lat: number; lon: number }[]) => {
    const origin = waypoints ? waypoints[0].label : _origin;
    const destination = waypoints ? waypoints[waypoints.length - 1].label : _destination;
    const km = effectiveKm(distanceKm);
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(km, transfer.duration_hours || 0, settings, transfer.viaticos || 0);
    onChange(index, { ...transfer, origin, destination, distance_km: distanceKm, map_waypoints: waypoints, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
    setMapMode(true);
    setShowMap(false);
  };

  // Recalcular cuando cambian las tarifas locales (solo para modo ruta con km calculados)
  React.useEffect(() => {
    if (mode !== 'ruta' || !transfer.distance_km) return;
    const km = effectiveKm(transfer.distance_km);
    const { baseCostArs, finalCostArs, isFullDay } = calcTransferCosts(km, transfer.duration_hours || 0, settings, transfer.viaticos || 0);
    onChange(index, { ...transfer, base_cost_ars: baseCostArs, is_full_day: isFullDay, final_cost_usd: finalCostArs });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const modeBtn = (m: TransferMode, label: string) =>
    `px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === m ? 'bg-marga-wine text-marga-cream' : 'bg-white text-marga-dark/50 border border-marga-creamDark hover:border-marga-wine/40'}`;

  return (
    <>
      {showMap && <RouteMapModal onClose={() => setShowMap(false)} onSave={handleMapSave} saveLabel="Usar este recorrido" initialWaypoints={transfer.map_waypoints} />}

      <div className="bg-marga-cream/60 border border-marga-creamDark rounded-xl p-4 mb-3 relative">
        <button onClick={() => onRemove(index)} className="absolute top-3 right-3 p-1 text-marga-dark/30 hover:text-red-500 transition-colors">
          <X size={16} />
        </button>

        {/* Selector de tipo + Ida/Vuelta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button className={modeBtn('aeropuerto', 'Aeropuerto')} onClick={() => handleModeChange('aeropuerto')}>✈ Aeropuerto</button>
            <button className={modeBtn('tour', 'Tour')} onClick={() => handleModeChange('tour')}>🗺 Tour</button>
            <button className={modeBtn('ruta', 'Ruta')} onClick={() => handleModeChange('ruta')}>📍 Ruta</button>
          </div>
        </div>

        {/* Día / Hora / Duración */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Día</label>
            <input type="date" value={transfer.day} onChange={e => onChange(index, { ...transfer, day: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Hora</label>
            <input type="time" value={transfer.hour || ''} onChange={e => onChange(index, { ...transfer, hour: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Duración (hs)</label>
            <input type="number" min={0} step={0.5} value={transfer.duration_hours || ''} onChange={e => handleDurationChange(parseFloat(e.target.value) || 0)} className={inp} placeholder="0" />
          </div>
        </div>

        {/* ── MODO AEROPUERTO ── */}
        {mode === 'aeropuerto' && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Transfer de aeropuerto</label>
            <select onChange={e => handleAirportSelect(e.target.value)} defaultValue="" className={sel}>
              <option value="">— Seleccionar transfer —</option>
              {airportTransfers.map((t: any) => (
                <option key={t.id} value={t.id}>
                  Aeropuerto ↔ {t.zone}{t.price ? ` — $${t.price.toLocaleString('es-AR')}` : ''}{t.needs_consultation ? ' (A consultar)' : ''}
                </option>
              ))}
            </select>
            {transfer.destination && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <MapPin size={11} /> Aeropuerto Mendoza → {transfer.destination}
              </p>
            )}
          </div>
        )}

        {/* ── MODO TOUR ── */}
        {mode === 'tour' && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Tour</label>
            <select onChange={e => handleTourSelect(e.target.value)} defaultValue="" className={sel}>
              <option value="">— Seleccionar tour —</option>
              {tours.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.region ? ` — ${t.region}` : ''}{t.price ? ` — $${t.price.toLocaleString('es-AR')}` : ''}
                </option>
              ))}
            </select>
            {transfer.destination && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <Navigation size={11} /> {transfer.destination}{transfer.origin ? ` (${transfer.origin})` : ''}
              </p>
            )}
          </div>
        )}

        {/* ── MODO RUTA ── */}
        {mode === 'ruta' && (
          <div className="mb-3">
            {mapMode ? (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                    <MapPin size={11} /> Recorrido calculado con mapa
                  </span>
                  <button onClick={() => { setMapMode(false); onChange(index, { ...transfer, origin: '', destination: '', distance_km: 0, base_cost_ars: 0, final_cost_usd: 0 }); }} className="text-xs text-blue-400 hover:text-blue-600 underline">
                    Limpiar
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-800 truncate">{transfer.origin}</span>
                  <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-800 truncate">{transfer.destination}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{transfer.distance_km} km</span>
                  <button onClick={() => setShowMap(true)} className="text-xs text-blue-500 hover:text-blue-700 underline">Recalcular</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Origen</label>
                    <select value={transfer.origin} onChange={e => handleOriginChange(e.target.value)} className={sel}>
                      <option value="">— Seleccionar —</option>
                      {routeNodes.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Destino</label>
                    <select value={transfer.destination} onChange={e => handleDestinationChange(e.target.value)} className={sel} disabled={!transfer.origin}>
                      <option value="">— Seleccionar —</option>
                      {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => setShowMap(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors w-full justify-center">
                  <MapPin size={13} /> Calcular con mapa y paradas
                </button>
              </>
            )}
          </div>
        )}

        {/* Resumen de costos */}
        {transfer.destination && (transfer.final_cost_usd || 0) > 0 && (
          <div className="mb-3 p-3 bg-white rounded-xl border border-marga-creamDark space-y-2">
            {/* Tags km / tipo día */}
            <div className="flex flex-wrap items-center gap-2">
              {(transfer.distance_km || 0) > 0 && (
                <span className="text-xs text-marga-dark/50">{transfer.distance_km} km</span>
              )}
              {(transfer.distance_km || 0) > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${transfer.is_full_day ? 'bg-marga-wine/10 text-marga-wine' : 'bg-blue-100 text-blue-700'}`}>
                  {transfer.is_full_day ? 'Día completo' : 'Medio día'}
                </span>
              )}
            </div>
            {/* Viáticos */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-marga-dark/50">Viáticos</span>
              <div className="relative w-36">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-marga-dark/40 text-xs">$</span>
                <input
                  type="number"
                  min={0}
                  value={transfer.viaticos || ''}
                  onChange={e => handleViaticosChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-5 pr-2 py-1 border border-marga-creamDark rounded-lg text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-marga-wine/30"
                />
              </div>
            </div>
            {/* Precio */}
            <div className="flex items-center justify-between text-sm border-t border-marga-creamDark pt-2">
              <span className="font-bold text-marga-wine">Precio base</span>
              <span className="font-mono font-bold text-marga-wine">{fmtARS(transfer.final_cost_usd || 0)}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Notas</label>
          <input type="text" value={transfer.notes || ''} onChange={e => onChange(index, { ...transfer, notes: e.target.value })} className={inp} placeholder="Opcional..." />
        </div>
      </div>
    </>
  );
};

// ── ServiceRow ────────────────────────────────────────────────────────────────

const CATALOG_TABLE: Partial<Record<QuoteServiceType, string>> = {
  winery: 'wineries',
  hotel: 'hotels',
  restaurant: 'restaurants',
  guide: 'guides',
};

const ServiceRow: React.FC<{
  service: QuoteService;
  index: number;
  settings: TarifaSettings;
  catalogData: CatalogData;
  onChange: (index: number, updated: QuoteService) => void;
  onRemove: (index: number) => void;
  onCatalogRefresh: () => void;
}> = ({ service, index, settings, catalogData, onChange, onRemove, onCatalogRefresh }) => {

  const [showAddNew, setShowAddNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [savingNew, setSavingNew] = React.useState(false);

  const getItems = (type: QuoteServiceType) => {
    switch (type) {
      case 'winery': return catalogData.wineries;
      case 'hotel': return catalogData.hotels;
      case 'restaurant': return catalogData.restaurants;
      case 'activity': return catalogData.activities;
      case 'tour': return catalogData.tours;
      case 'guide': return catalogData.guides;
    }
  };

  const isHotel = service.service_type === 'hotel';
  const isGuide = service.service_type === 'guide';

  const calcNights = (checkin: string, checkout: string) =>
    checkin && checkout
      ? Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
      : 0;

  const nights = isHotel ? calcNights(service.day, service.checkout_day || '') : 1;

  const handleTypeChange = (type: QuoteServiceType) => {
    setShowAddNew(false);
    onChange(index, { ...service, service_type: type, service_id: '', service_name: '', checkout_day: type !== 'hotel' ? undefined : service.checkout_day });
  };

  const handleServiceSelect = (serviceId: string) => {
    const items = getItems(service.service_type);
    const item = items.find((i: any) => i.id === serviceId);
    if (!item) return;
    onChange(index, { ...service, service_id: serviceId, service_name: item.name });
  };

  const handleMostradorChange = (priceArs: number) => {
    const total = isHotel ? priceArs * nights : calcServiceFinal(priceArs, service.pax);
    onChange(index, { ...service, unit_price_usd: priceArs, final_cost_usd: total });
  };

  const handleAgenciaChange = (priceArs: number) => {
    onChange(index, { ...service, agency_price_ars: priceArs });
  };

  const handleCheckinChange = (val: string) => {
    const n = calcNights(val, service.checkout_day || '');
    onChange(index, { ...service, day: val, final_cost_usd: service.unit_price_usd * (n || 0) });
  };

  const handleCheckoutChange = (val: string) => {
    const n = calcNights(service.day, val);
    onChange(index, { ...service, checkout_day: val, final_cost_usd: service.unit_price_usd * (n || 0) });
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    const table = CATALOG_TABLE[service.service_type];
    if (!table) return;
    setSavingNew(true);
    try {
      const res = await api.from(table).insert([{ name: newName.trim(), region: '', is_active: true }]);
      const created = Array.isArray(res) ? res[0] : null;
      await onCatalogRefresh();
      if (created?.id) {
        onChange(index, { ...service, service_id: created.id, service_name: created.name });
      } else {
        onChange(index, { ...service, service_name: newName.trim() });
      }
      setNewName('');
      setShowAddNew(false);
    } finally {
      setSavingNew(false);
    }
  };

  const items = getItems(service.service_type);
  const canAddNew = !!CATALOG_TABLE[service.service_type];

  const inp = "w-full border border-marga-creamDark rounded-lg px-3 py-2 text-sm text-marga-dark focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white";
  const sel = inp + " cursor-pointer";

  return (
    <div className="bg-marga-cream/60 border border-marga-creamDark rounded-xl p-4 mb-3 relative">
      <button onClick={() => onRemove(index)} className="absolute top-3 right-3 p-1 text-marga-dark/30 hover:text-red-500 transition-colors">
        <X size={16} />
      </button>

      {/* Fila 1: fechas + tipo */}
      <div className={`grid gap-3 mb-3 ${isHotel ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {isHotel ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Llegada</label>
              <input type="date" value={service.day} onChange={e => handleCheckinChange(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-marga-dark/50 mb-1">
                Salida{nights > 0 && <span className="ml-1 text-marga-wine font-bold">{nights} {nights === 1 ? 'noche' : 'noches'}</span>}
              </label>
              <input type="date" value={service.checkout_day || ''} onChange={e => handleCheckoutChange(e.target.value)} className={inp} />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Día</label>
            <input type="date" value={service.day} onChange={e => onChange(index, { ...service, day: e.target.value })} className={inp} />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Tipo</label>
          <select value={service.service_type} onChange={e => handleTypeChange(e.target.value as QuoteServiceType)} className={sel}>
            {(Object.keys(SERVICE_LABELS) as QuoteServiceType[]).map(t => (
              <option key={t} value={t}>{SERVICE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: precios */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">{isHotel ? 'P. agencia/noche ARS' : isGuide ? 'P. agencia/servicio ARS' : 'P. agencia ARS'}</label>
          <input type="number" min={0} step={1} value={service.agency_price_ars || ''} onChange={e => handleAgenciaChange(parseFloat(e.target.value) || 0)} className={inp} placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">{isHotel ? 'P. mostrador/noche ARS' : isGuide ? 'P. mostrador/servicio ARS' : 'P. mostrador ARS'}</label>
          <input type="number" min={0} step={1} value={service.unit_price_usd || ''} onChange={e => handleMostradorChange(parseFloat(e.target.value) || 0)} className={inp} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-marga-dark/50">Servicio específico</label>
            {canAddNew && (
              <button
                type="button"
                onClick={() => setShowAddNew(v => !v)}
                className="text-xs text-marga-wine font-bold hover:underline"
              >
                {showAddNew ? 'Cancelar' : '+ Agregar nueva'}
              </button>
            )}
          </div>
          {showAddNew ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNew()}
                placeholder={`Nombre de ${SERVICE_LABELS[service.service_type].toLowerCase()}...`}
                className={inp}
              />
              <button
                type="button"
                onClick={handleAddNew}
                disabled={savingNew || !newName.trim()}
                className="px-3 py-2 bg-marga-wine text-marga-cream text-xs font-bold rounded-lg disabled:opacity-40 whitespace-nowrap"
              >
                {savingNew ? '...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <select value={service.service_id || ''} onChange={e => handleServiceSelect(e.target.value)} className={sel}>
              <option value="">— Buscar en catálogo —</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Descripción del servicio</label>
          <textarea
            rows={3}
            value={service.service_name}
            onChange={e => onChange(index, { ...service, service_name: e.target.value })}
            className={inp + " resize-y"}
            placeholder="Ej: Bodega Casarena — Almuerzo gourmet"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Notas</label>
          <input type="text" value={service.notes || ''} onChange={e => onChange(index, { ...service, notes: e.target.value })} className={inp} placeholder="Opcional..." />
        </div>
        <div className="ml-4 text-right">
          <p className="text-xs text-marga-dark/40">Total</p>
          <p className="text-base font-bold text-marga-wine">{fmtARS(service.final_cost_usd || 0)}</p>
        </div>
      </div>
    </div>
  );
};

// ── TotalsPanel ───────────────────────────────────────────────────────────────

const TotalsPanel: React.FC<{
  transfers: QuoteTransfer[];
  services: QuoteService[];
  exchangeRate: number;
  onChangeExchangeRate?: (val: number) => void;
  gananciaTransfer?: number;
  gananciaServicio?: number;
  comision?: number;
}> = ({ transfers, services, exchangeRate, onChangeExchangeRate, gananciaTransfer = 0, gananciaServicio = 0, comision = 0 }) => {
  const totalTransfersArs = transfers.reduce((acc, t) => acc + (t.final_cost_usd || 0), 0);
  const totalServicesUsd = services.reduce((acc, s) => acc + (s.final_cost_usd || 0), 0);
  const totalTransfersConGanancia = totalTransfersArs * (1 + gananciaTransfer / 100);
  const totalServiciosConGanancia = totalServicesUsd * (1 + gananciaServicio / 100);
  const subtotal = totalTransfersConGanancia + totalServiciosConGanancia;
  const montoComision = subtotal * comision / 100 * 2;
  const totalFinal = subtotal + montoComision;
  const hasItems = totalTransfersArs > 0 || totalServicesUsd > 0;

  return (
    <div className="bg-white border border-marga-creamDark rounded-xl p-4 shadow-sm">
      <h4 className="text-xs font-bold text-marga-dark/50 uppercase tracking-wider mb-3">Totales</h4>
      <div className="space-y-1.5 text-sm">
        {totalTransfersArs > 0 && (
          <div className="flex justify-between text-marga-dark/70">
            <span>Transfers</span>
            <span className="font-mono font-semibold">{fmtARS(totalTransfersArs)}</span>
          </div>
        )}
        {gananciaTransfer > 0 && totalTransfersArs > 0 && (
          <div className="flex justify-between text-marga-dark/50 text-xs">
            <span>Ganancia transfers ({gananciaTransfer}%)</span>
            <span className="font-mono">+{fmtARS(totalTransfersArs * gananciaTransfer / 100)}</span>
          </div>
        )}
        {gananciaTransfer > 0 && totalTransfersArs > 0 && (
          <div className="flex justify-between font-bold text-marga-wine border-t border-marga-creamDark pt-1.5 mt-1">
            <span>Total transfers</span>
            <span className="font-mono">{fmtARS(totalTransfersConGanancia)}</span>
          </div>
        )}
        {totalServicesUsd > 0 && (
          <div className="flex justify-between text-marga-dark/70 mt-2 pt-2 border-t border-marga-creamDark">
            <span>Servicios</span>
            <span className="font-mono font-semibold">{fmtARS(totalServicesUsd)}</span>
          </div>
        )}
        {gananciaServicio > 0 && totalServicesUsd > 0 && (
          <div className="flex justify-between text-marga-dark/50 text-xs">
            <span>Ganancia servicios ({gananciaServicio}%)</span>
            <span className="font-mono">+{fmtARS(totalServicesUsd * gananciaServicio / 100)}</span>
          </div>
        )}
        {gananciaServicio > 0 && totalServicesUsd > 0 && (
          <div className="flex justify-between font-bold text-marga-wine border-t border-marga-creamDark pt-1.5 mt-1">
            <span>Total servicios</span>
            <span className="font-mono">{fmtARS(totalServiciosConGanancia)}</span>
          </div>
        )}
        {hasItems && (
          <div className="flex justify-between font-bold text-marga-dark border-t-2 border-marga-dark/20 pt-2 mt-2 text-base">
            <span>Subtotal</span>
            <span className="font-mono">{fmtARS(subtotal)}</span>
          </div>
        )}
        {comision > 0 && hasItems && (
          <>
            <div className="flex justify-between text-xs text-amber-600 mt-1">
              <span>Comisión ({comision}% × 2)</span>
              <span className="font-mono">+{fmtARS(montoComision)}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-700 border-t border-amber-200 pt-1.5 text-base">
              <span>Total con comisión</span>
              <span className="font-mono">{fmtARS(totalFinal)}</span>
            </div>
          </>
        )}
        {onChangeExchangeRate && (
          <div className="mt-3 pt-3 border-t border-dashed border-marga-creamDark space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-marga-dark/40 flex-1">TC (ARS/USD)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={exchangeRate || ''}
                onChange={e => onChangeExchangeRate(parseFloat(e.target.value) || 0)}
                className="w-28 border border-marga-creamDark rounded-lg px-2 py-1 text-sm text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30"
                placeholder="0"
              />
            </div>
            {exchangeRate > 0 && hasItems && (
              <div className="flex justify-between text-xs text-marga-dark/50">
                <span>Total USD</span>
                <span className="font-mono font-semibold">{fmt(totalFinal / exchangeRate)}</span>
              </div>
            )}
          </div>
        )}
        {!hasItems && (
          <p className="text-xs text-marga-dark/30 text-center py-2">Sin ítems agregados</p>
        )}
      </div>
    </div>
  );
};

// ── QuoteDetailView (impresión) ───────────────────────────────────────────────

const QuoteDetailView: React.FC<{
  quote: FullQuote;
  onBack: () => void;
}> = ({ quote, onBack }) => {
  const totalTransfersArs = (quote.transfers || []).reduce((a, t) => a + (t.final_cost_usd || 0), 0);
  const totalServicesUsd = (quote.services || []).reduce((a, s) => a + (s.final_cost_usd || 0), 0);

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quote-print, #quote-print * { visibility: visible; }
          #quote-print {
            position: fixed;
            inset: 0;
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
        #quote-print {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
      `}</style>

      {/* Barra de acciones (solo pantalla) */}
      <div className="print:hidden sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-marga-creamDark px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-marga-dark/60 hover:text-marga-wine font-semibold text-sm transition-colors">
          <ChevronLeft size={18} /> Volver
        </button>
        <span className="text-xs text-marga-dark/30">Cotización #{String(quote.quote_number || 0).padStart(4, '0')} — {quote.client_name}</span>
        <button
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 bg-marga-wine hover:bg-marga-wineLight text-marga-cream font-bold py-2 px-5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Printer size={16} /> Imprimir / Exportar PDF
        </button>
      </div>

      {/* Hoja con membrete — A4 */}
      <div id="quote-print" style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '24px auto',
        position: 'relative',
        backgroundImage: 'url(/membrete.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        fontFamily: 'sans-serif',
      }}>
        {/* Contenido sobre el membrete — padding respeta logo (arriba) y footer (abajo) */}
        <div style={{ padding: '148px 56px 130px 56px' }}>

          {/* Número y fecha — arriba a la derecha */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Cotización</p>
              <p style={{ fontSize: '26px', fontWeight: 900, color: '#4a1c2d', margin: 0 }}>
                #{String(quote.quote_number || 0).padStart(4, '0')}
              </p>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{quote.date}</p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div style={{ marginBottom: '24px', borderLeft: '3px solid #4a1c2d', paddingLeft: '14px' }}>
            <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Para</p>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px 0' }}>{quote.client_name}</p>
            {quote.client_phone && <p style={{ fontSize: '13px', color: '#555', margin: '2px 0' }}>{quote.client_phone}</p>}
            {quote.client_email && <p style={{ fontSize: '13px', color: '#555', margin: '2px 0' }}>{quote.client_email}</p>}
            {quote.description && <p style={{ fontSize: '13px', color: '#777', marginTop: '6px', fontStyle: 'italic' }}>"{quote.description}"</p>}
          </div>

          {/* Itinerario agrupado por día */}
          {(() => {
            const transfers = quote.transfers || [];
            const services = quote.services || [];
            const allDays = Array.from(new Set([
              ...transfers.map(t => t.day),
              ...services.map(s => s.day),
            ])).sort();

            return allDays.map(day => {
              const dayTransfers = transfers.filter(t => t.day === day);
              const dayServices = services.filter(s => s.day === day);

              return (
                <div key={day} style={{ marginBottom: '20px' }}>
                  {/* Cabecera del día */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#4a1c2d', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                      {day}
                    </p>
                    <div style={{ flex: 1, height: '1.5px', background: '#4a1c2d', opacity: 0.3 }} />
                  </div>

                  {/* Transfers del día */}
                  {dayTransfers.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: dayServices.length > 0 ? '8px' : 0 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>Hora</th>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transfer</th>
                          <th style={{ padding: '3px 6px', textAlign: 'center', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '40px' }}>PAX</th>
                          <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayTransfers.map((t, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #ede8df' }}>
                            <td style={{ padding: '5px 6px', color: '#666' }}>{t.hour || '—'}</td>
                            <td style={{ padding: '5px 6px', fontWeight: 600, color: '#1a1a1a' }}>{t.origin} → {t.destination}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'center', color: '#555' }}>{t.pax}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{fmtARS(t.final_cost_usd || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Servicios del día */}
                  {dayServices.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Servicio</th>
                          <th style={{ padding: '3px 6px', textAlign: 'center', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '40px' }}>PAX</th>
                          <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayServices.map((s, i) => {
                          const isHotel = s.service_type === 'hotel';
                          const nights = isHotel && s.checkout_day
                            ? Math.max(0, Math.round((new Date(s.checkout_day).getTime() - new Date(s.day).getTime()) / 86400000))
                            : null;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #ede8df' }}>
                              <td style={{ padding: '5px 6px', color: '#1a1a1a' }}>
                                <span style={{ fontWeight: 600 }}>{s.service_name}</span>
                                {isHotel && nights !== null && s.checkout_day && (
                                  <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
                                    ({nights} {nights === 1 ? 'noche' : 'noches'} — salida {s.checkout_day})
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '5px 6px', textAlign: 'center', color: '#555' }}>{isHotel ? '—' : s.pax}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{fmtARS(s.final_cost_usd || 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            });
          })()}

          {/* Totales */}
          <div style={{ marginTop: '20px', borderTop: '2px solid #4a1c2d', paddingTop: '14px' }}>
            {totalTransfersArs > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '4px' }}>
                <span>Total transfers</span><span style={{ fontWeight: 600 }}>{fmtARS(totalTransfersArs)}</span>
              </div>
            )}
            {totalServicesUsd > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '4px' }}>
                <span>Total servicios</span><span style={{ fontWeight: 600 }}>{fmtARS(totalServicesUsd)}</span>
              </div>
            )}
          </div>

          {/* Notas */}
          {quote.notes && (
            <div style={{ marginTop: '20px', padding: '12px 14px', background: 'rgba(237,237,221,0.5)', borderRadius: '8px' }}>
              <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Notas</p>
              <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{quote.notes}</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CatalogData {
  wineries: any[];
  hotels: any[];
  restaurants: any[];
  activities: any[];
  tours: any[];
  experiences: any[];
  airportTransfers: any[];
  guides: any[];
}

// ── QuoteForm ─────────────────────────────────────────────────────────────────

const QuoteForm: React.FC<{
  initial?: FullQuote | null;
  settings: TarifaSettings;
  routes: Route[];
  clients: Client[];
  catalogData: CatalogData;
  onSave: (quote: FullQuote, status: QuoteStatus) => Promise<void>;
  onCancel: () => void;
  onOpenTC: () => void;
  onFetchBna: () => void;
  fetchingBna: boolean;
  bnaUpdatedAt: string | null;
  onCatalogRefresh: () => void;
}> = ({ initial, settings, routes, clients, catalogData, onSave, onCancel, onOpenTC, onFetchBna, fetchingBna, bnaUpdatedAt, onCatalogRefresh }) => {
  const exchangeRate = settings.usd_exchange_rate || 1200;

  const [form, setForm] = useState<FullQuote>(initial ? { ...initial } : emptyQuote());
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [useExistingClient, setUseExistingClient] = useState(!!initial?.client_id);

  // Tarifas editables localmente para esta cotización
  const [localSettings, setLocalSettings] = useState<TarifaSettings>({
    ...settings,
    usd_exchange_rate: initial?.exchange_rate || settings.usd_exchange_rate,
  });
  const [showTarifas, setShowTarifas] = useState(false);
  const [viaticos, setViaticos] = useState<number>(0);
  const [gananciaTransfer, setGananciaTransfer] = useState<number>(initial?.ganancia_transfer || 0);
  const [gananciaServicio, setGananciaServicio] = useState<number>(initial?.ganancia_servicio || 0);
  const [comision, setComision] = useState<number>(initial?.comision || 0);
  const [validityDate, setValidityDate] = useState<string>(initial?.validity_date || '');

  // Estado para experiencia: PAX y precio unitario en USD
  const [expPax, setExpPax] = useState<number>(() => {
    if (initial?.type === 'experience' && initial.services?.length > 0) return initial.services[0].pax || 1;
    return initial?.pax || 1;
  });
  const [expPriceUsd, setExpPriceUsd] = useState<number>(() => {
    if (initial?.type === 'experience' && initial.services?.length > 0) return initial.services[0].unit_price_usd || 0;
    return 0;
  });

  // Sincroniza PAX y precio con form.services cuando cambia cualquiera de los dos
  const syncExpService = (pax: number, priceUsd: number, experienceId?: string) => {
    const expId = experienceId ?? form.experience_id;
    const exp = catalogData.experiences.find((e: any) => e.id === expId);
    const name = exp ? exp.name : 'Experiencia';
    const finalCost = calcServiceFinal(priceUsd, pax);
    setForm(f => ({
      ...f,
      services: [{
        day: f.date,
        service_type: 'activity' as QuoteServiceType,
        service_id: expId || undefined,
        service_name: name,
        pax,
        unit_price_usd: priceUsd,
        margin_pct: 10,
        final_cost_usd: finalCost,
      }],
    }));
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    setForm(f => ({
      ...f,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone || '',
      client_email: client.email || '',
    }));
    setClientSearch(client.name);
    setShowClientDropdown(false);
    setUseExistingClient(true);
  };

  const handleTransferChange = (index: number, updated: QuoteTransfer) => {
    setForm(f => ({ ...f, transfers: f.transfers.map((t, i) => i === index ? updated : t) }));
  };

  const handleServiceChange = (index: number, updated: QuoteService) => {
    setForm(f => ({ ...f, services: f.services.map((s, i) => i === index ? updated : s) }));
  };

  const handleSave = async (status: QuoteStatus) => {
    if (!form.client_name.trim() || !form.date) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        status,
        exchange_rate: localSettings.usd_exchange_rate,
        ganancia_transfer: gananciaTransfer,
        ganancia_servicio: gananciaServicio,
        comision,
        validity_date: validityDate || undefined,
      }, status);
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full border border-marga-creamDark rounded-xl px-4 py-2.5 text-sm text-marga-dark focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 text-marga-dark/40 hover:text-marga-wine rounded-xl hover:bg-marga-creamDark transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-extrabold text-marga-wine uppercase tracking-tight">
            {initial?.id ? `Editar Cotización #${String(initial.quote_number || 0).padStart(4, '0')}` : 'Nueva Cotización'}
          </h2>
        </div>
        <div className="flex items-center border border-marga-creamDark rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            onClick={onOpenTC}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-marga-dark/60 hover:text-marga-wine transition-colors border-r border-marga-creamDark"
          >
            <DollarSign size={14} />
            TC: ${exchangeRate.toLocaleString('es-AR')}
            <Edit2 size={12} />
          </button>
          <button
            onClick={onFetchBna}
            disabled={fetchingBna}
            title="Sincronizar con dólar BNA venta"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {fetchingBna ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            BNA{bnaUpdatedAt && <span className="text-blue-400 font-normal ml-1">{bnaUpdatedAt}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Sección 1: Datos generales */}
          <div className="bg-white rounded-2xl border border-marga-creamDark p-5 shadow-sm">
            <h3 className="text-sm font-bold text-marga-wine uppercase tracking-wider mb-4">Datos generales</h3>

            {/* Cliente */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-marga-dark/50">Cliente</label>
                <button
                  type="button"
                  onClick={() => { setUseExistingClient(!useExistingClient); setClientSearch(''); setForm(f => ({ ...f, client_id: undefined })); }}
                  className="text-xs text-marga-wine font-semibold hover:underline"
                >
                  {useExistingClient ? 'Ingresar manualmente' : 'Buscar en clientes'}
                </button>
              </div>
              {useExistingClient ? (
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Buscar cliente..."
                    className={inp}
                  />
                  {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-marga-creamDark rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                      {filteredClients.slice(0, 8).map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleClientSelect(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-marga-cream text-sm transition-colors"
                        >
                          <span className="font-semibold text-marga-dark">{c.name}</span>
                          {c.phone && <span className="text-marga-dark/40 ml-2 text-xs">{c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Nombre del cliente" className={inp} />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Teléfono</label>
                <input type="text" value={form.client_phone || ''} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className={inp} placeholder="+54 261..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Email</label>
                <input type="email" value={form.client_email || ''} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className={inp} placeholder="correo@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Descripción</label>
                <input type="text" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} placeholder="Ej: Tour Valle de Uco 3 días" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Fecha</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1 flex items-center gap-1">
                  <Users size={12} /> PAX (personas)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.pax ?? ''}
                  onChange={e => {
                    const newPax = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setForm(f => ({
                      ...f,
                      pax: newPax,
                      transfers: f.transfers.map(t => ({ ...t, pax: newPax || 1 })),
                      services: f.services.map(s => ({ ...s, pax: newPax || 1 })),
                    }));
                  }}
                  className={inp}
                />
              </div>
            </div>

            {/* Tipo */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-marga-dark/50 mb-2">Tipo de cotización</label>
              <div className="flex gap-3">
                {(['custom', 'experience'] as QuoteType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${form.type === t
                      ? 'bg-marga-wine text-marga-cream border-marga-wine'
                      : 'bg-white text-marga-dark/60 border-marga-creamDark hover:border-marga-wine/30'}`}
                  >
                    {t === 'custom' ? 'A medida' : 'Experiencia'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Notas internas</label>
              <textarea
                value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={`${inp} resize-none`}
                rows={2}
                placeholder="Observaciones, condiciones especiales..."
              />
            </div>
          </div>

          {/* Sección 2A: Experiencia */}
          {form.type === 'experience' && (
            <div className="bg-white rounded-2xl border border-marga-creamDark p-5 shadow-sm">
              <h3 className="text-sm font-bold text-marga-wine uppercase tracking-wider mb-4">Experiencia</h3>

              {/* Cards de experiencias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {catalogData.experiences.map((exp: any) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => {
                      const refPrice = exp.price && exchangeRate > 0 ? Math.round(exp.price / exchangeRate) : 0;
                      setForm(f => ({ ...f, experience_id: exp.id }));
                      setExpPriceUsd(refPrice);
                      syncExpService(expPax, refPrice, exp.id);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all ${form.experience_id === exp.id
                      ? 'border-marga-wine bg-marga-wine/5 ring-2 ring-marga-wine/20'
                      : 'border-marga-creamDark hover:border-marga-wine/30'}`}
                  >
                    <p className="font-bold text-sm text-marga-dark">{exp.name}</p>
                    {exp.region && <p className="text-xs text-marga-dark/50 mt-0.5">{exp.region}</p>}
                    {exp.price && exchangeRate > 0 && (
                      <p className="text-xs text-marga-wine font-semibold mt-1">
                        Ref: USD {Math.round(exp.price / exchangeRate)} /pp
                      </p>
                    )}
                    {exp.description && <p className="text-xs text-marga-dark/40 mt-1 line-clamp-2">{exp.description}</p>}
                  </button>
                ))}
              </div>

              {/* PAX */}
              <div className="border-t border-marga-creamDark pt-4">
                <div className="flex items-end gap-4">
                  <div className="w-32">
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Cantidad de personas (PAX)</label>
                    <input
                      type="number"
                      min={1}
                      value={expPax}
                      onChange={e => {
                        const pax = parseInt(e.target.value) || 1;
                        setExpPax(pax);
                        syncExpService(pax, expPriceUsd);
                      }}
                      className={inp}
                    />
                  </div>
                  {form.experience_id && (
                    <div className="flex-1 bg-marga-cream/60 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-marga-dark/50 font-semibold">
                          {catalogData.experiences.find((e: any) => e.id === form.experience_id)?.name || ''}
                        </p>
                        <p className="text-xs text-marga-dark/40 mt-0.5">
                          {expPax} {expPax === 1 ? 'persona' : 'personas'}
                          {expPriceUsd > 0 ? ` × USD ${expPriceUsd.toFixed(2)} (+10%)` : ''}
                        </p>
                      </div>
                      <p className="text-lg font-extrabold text-marga-wine">
                        {expPriceUsd > 0 ? fmt(calcServiceFinal(expPriceUsd, expPax)) : '—'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección 2B: Transfers y Servicios */}
          {form.type === 'custom' && (
            <>
              {/* Transfers */}
              <div className="bg-white rounded-2xl border border-marga-creamDark p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-marga-wine uppercase tracking-wider">Transfers</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTarifas(v => !v)}
                      className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors ${showTarifas ? 'bg-marga-wine/10 text-marga-wine border-marga-wine/30' : 'text-marga-dark/40 border-marga-creamDark hover:border-marga-wine/30 hover:text-marga-wine'}`}
                    >
                      <DollarSign size={13} /> Tarifas
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, transfers: [...f.transfers, { ...emptyTransfer(), pax: f.pax || 1 }] }))}
                      className="flex items-center gap-1.5 text-xs font-bold text-marga-wine border border-marga-wine/30 hover:bg-marga-wine/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={14} /> Agregar transfer
                    </button>
                  </div>
                </div>

                {/* Panel de tarifas colapsable */}
                {showTarifas && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Tarifas para esta cotización</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Costo x km ($)', key: 'costo_km' },
                        { label: '+150 km / +6hs ($)', key: 'precio_full_day' },
                        { label: '-150 km / -6hs ($)', key: 'precio_medio_dia' },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-amber-700 mb-1">{label}</label>
                          <input
                            type="number"
                            min={0}
                            value={(localSettings as any)[key] || ''}
                            onChange={e => setLocalSettings(s => ({ ...s, [key]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                            placeholder="0"
                            className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-500 mt-2">Estos valores solo aplican a esta cotización. No modifican la configuración global.</p>
                  </div>
                )}

                {form.transfers.length === 0 && (
                  <p className="text-sm text-marga-dark/30 text-center py-6">Sin transfers. Hacé clic en "Agregar transfer".</p>
                )}
                {form.transfers.map((t, i) => (
                  <TransferRow
                    key={i}
                    transfer={t}
                    index={i}
                    routes={routes}
                    settings={localSettings}
                    catalogData={catalogData}
                    onChange={handleTransferChange}
                    onRemove={idx => setForm(f => ({ ...f, transfers: f.transfers.filter((_, j) => j !== idx) }))}
                  />
                ))}

                {/* Ganancia Transfer */}
                <div className="mt-4 p-4 bg-marga-wine/5 border border-marga-wine/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-marga-wine">Ganancia transfers</p>
                      <p className="text-xs text-marga-dark/40 mt-0.5">Se aplica sobre el total de transfers</p>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={gananciaTransfer || ''}
                          onChange={e => setGananciaTransfer(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="0"
                          className="w-full pr-7 pl-3 py-2 border border-marga-wine/30 rounded-lg text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-marga-wine font-bold text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  {gananciaTransfer > 0 && (() => {
                    const base = form.transfers.reduce((a, t) => a + (t.final_cost_usd || 0), 0);
                    const extra = base * gananciaTransfer / 100;
                    return (
                      <div className="flex justify-between mt-2 text-sm text-marga-wine font-bold border-t border-marga-wine/20 pt-2">
                        <span>Total con ganancia</span>
                        <span>{fmtARS(base + extra)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Servicios */}
              <div className="bg-white rounded-2xl border border-marga-creamDark p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-marga-wine uppercase tracking-wider">Servicios</h3>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, services: [...f.services, { ...emptyService(), pax: f.pax || 1 }] }))}
                    className="flex items-center gap-1.5 text-xs font-bold text-marga-wine border border-marga-wine/30 hover:bg-marga-wine/5 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Agregar servicio
                  </button>
                </div>
                {form.services.length === 0 && (
                  <p className="text-sm text-marga-dark/30 text-center py-6">Sin servicios. Hacé clic en "Agregar servicio".</p>
                )}
                {form.services.map((s, i) => (
                  <ServiceRow
                    key={i}
                    service={s}
                    index={i}
                    settings={settings}
                    catalogData={catalogData}
                    onChange={handleServiceChange}
                    onRemove={idx => setForm(f => ({ ...f, services: f.services.filter((_, j) => j !== idx) }))}
                    onCatalogRefresh={onCatalogRefresh}
                  />
                ))}

              {/* Ganancia Servicio */}
              <div className="mt-4 p-4 bg-marga-wine/5 border border-marga-wine/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-marga-wine">Ganancia servicios</p>
                    <p className="text-xs text-marga-dark/40 mt-0.5">Se aplica sobre el total de servicios</p>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gananciaServicio || ''}
                        onChange={e => setGananciaServicio(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0"
                        className="w-full pr-7 pl-3 py-2 border border-marga-wine/30 rounded-lg text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-marga-wine font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>
                {gananciaServicio > 0 && (() => {
                  const base = form.services.reduce((a, s) => a + (s.final_cost_usd || 0), 0);
                  const extra = base * gananciaServicio / 100;
                  return (
                    <div className="flex justify-between mt-2 text-sm text-marga-wine font-bold border-t border-marga-wine/20 pt-2">
                      <span>Total con ganancia</span>
                      <span>{fmtARS(base + extra)}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Comisión */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-700">Comisión</p>
                  <p className="text-xs text-amber-600/70 mt-0.5">Se suma al total × comisión × 2</p>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={comision || ''}
                      onChange={e => setComision(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full pr-7 pl-3 py-2 border border-amber-300 rounded-lg text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>
              {comision > 0 && (() => {
                const baseTransfers = form.transfers.reduce((a, t) => a + (t.final_cost_usd || 0), 0) * (1 + gananciaTransfer / 100);
                const baseServices = form.services.reduce((a, s) => a + (s.final_cost_usd || 0), 0) * (1 + gananciaServicio / 100);
                const base = baseTransfers + baseServices;
                const montoComision = base * comision / 100 * 2;
                return (
                  <div className="mt-2 border-t border-amber-200 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-amber-600">
                      <span>Monto comisión ({comision}% × 2)</span>
                      <span className="font-mono">+{fmtARS(montoComision)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-700 font-bold">
                      <span>Total con comisión</span>
                      <span className="font-mono">{fmtARS(base + montoComision)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            </>
          )}
        </div>

        {/* Columna derecha: Totales + Acciones */}
        <div className="space-y-4">
          <TotalsPanel transfers={form.transfers} services={form.services} exchangeRate={localSettings.usd_exchange_rate} onChangeExchangeRate={val => setLocalSettings(s => ({ ...s, usd_exchange_rate: val }))} gananciaTransfer={gananciaTransfer} gananciaServicio={gananciaServicio} comision={comision} />

          {/* Validez de presupuesto */}
          <div className="bg-white border border-marga-creamDark rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-marga-dark/50 uppercase tracking-wider mb-3">Validez de presupuesto</h4>
            <input
              type="date"
              value={validityDate}
              onChange={e => setValidityDate(e.target.value)}
              className="w-full border border-marga-creamDark rounded-xl px-4 py-2.5 text-sm text-marga-dark focus:outline-none focus:ring-2 focus:ring-marga-wine/30 bg-white"
            />
            {validityDate && (
              <p className="text-xs text-marga-dark/40 mt-2">
                Válido hasta el {new Date(validityDate + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-marga-creamDark p-4 shadow-sm space-y-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving || !form.client_name.trim() || !form.date}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-marga-creamDark text-marga-dark font-bold text-sm hover:bg-marga-creamDark transition-colors disabled:opacity-40"
            >
              <PenLine size={16} /> Guardar borrador
            </button>
            <button
              onClick={() => handleSave('sent')}
              disabled={saving || !form.client_name.trim() || !form.date}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-marga-wine hover:bg-marga-wineLight text-marga-cream font-bold text-sm transition-colors disabled:opacity-40"
            >
              <SendHorizontal size={16} /> Guardar y enviar
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-marga-dark/40 font-semibold text-sm hover:text-marga-dark transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── StatusChangeModal ─────────────────────────────────────────────────────────

const StatusChangeModal: React.FC<{
  quote: FullQuote;
  onSave: (status: QuoteStatus) => void;
  onClose: () => void;
}> = ({ quote, onSave, onClose }) => {
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
        <h3 className="text-base font-bold text-marga-wine mb-4">Cambiar estado</h3>
        <div className="space-y-2 mb-4">
          {(['draft', 'sent', 'approved', 'rejected'] as QuoteStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${status === s ? 'border-marga-wine bg-marga-wine/5 text-marga-wine' : 'border-marga-creamDark text-marga-dark/70 hover:bg-marga-creamDark'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-marga-creamDark text-marga-dark/60 font-semibold text-sm">Cancelar</button>
          <button onClick={() => onSave(status)} className="flex-1 py-2 rounded-xl bg-marga-wine text-marga-cream font-bold text-sm hover:bg-marga-wineLight transition-colors">Aplicar</button>
        </div>
      </div>
    </div>
  );
};

// ── QuotesView (main) ─────────────────────────────────────────────────────────

type ViewMode = 'list' | 'form' | 'detail';

export const QuotesView: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('list');
  const [quotes, setQuotes] = useState<FullQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<FullQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1200);
  const [tarifaSettings, setTarifaSettings] = useState<TarifaSettings>(DEFAULT_TARIFA);
  const [showTCModal, setShowTCModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<FullQuote | null>(null);
  const [fetchingBna, setFetchingBna] = useState(false);
  const [bnaUpdatedAt, setBnaUpdatedAt] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Catalog data
  const [routes, setRoutes] = useState<Route[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogData, setCatalogData] = useState<CatalogData>({
    wineries: [], hotels: [], restaurants: [], activities: [], tours: [], experiences: [], airportTransfers: [], guides: [],
  });

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;
      const data = await api.quotes.list(filters);
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDateFrom, filterDateTo]);

  const loadCatalog = useCallback(async () => {
    const [routesData, clientsData, rateData, wineriesData, hotelsData, restaurantsData, activitiesData, toursData, experiencesData, airportTransfersData, guidesData] = await Promise.allSettled([
      api.from('routes').select('*'),
      api.from('clients').select('*'),
      api.settings.getExchangeRate(),
      api.from('wineries').select('*'),
      api.from('hotels').select('*'),
      api.from('restaurants').select('*'),
      api.from('activities').select('*'),
      api.from('tours').select('*'),
      api.from('experiences').select('*'),
      api.from('airport_transfers').select('*'),
      api.from('guides').select('*'),
    ]);

    const get = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        const val = r.value;
        if (val && typeof val === 'object' && 'data' in val) return (val as any).data || [];
        if (Array.isArray(val)) return val;
      }
      return [];
    };

    setRoutes(get(routesData) as Route[]);
    setClients(get(clientsData) as Client[]);
    if (rateData.status === 'fulfilled' && rateData.value?.value) {
      const tc = Number(rateData.value.value);
      setExchangeRate(tc);
      setTarifaSettings(prev => ({ ...prev, usd_exchange_rate: tc }));
    }

    // Cargar tarifas de la tabla settings
    try {
      const settingsData = await api.from('settings').select('*');
      const row = Array.isArray(settingsData?.data) ? settingsData.data[0] : (settingsData as any)?.[0];
      if (row) {
        setTarifaSettings(prev => ({
          ...prev,
          costo_km: Number(row.costo_km) || prev.costo_km,
          precio_full_day: Number(row.precio_full_day) || prev.precio_full_day,
          precio_medio_dia: Number(row.precio_medio_dia) || prev.precio_medio_dia,
          precio_viaticos: Number(row.precio_viaticos) || prev.precio_viaticos,
          ganancia: Number(row.ganancia) || prev.ganancia,
          usd_exchange_rate: Number(row.usd_exchange_rate) || prev.usd_exchange_rate,
        }));
        if (row.usd_exchange_rate) setExchangeRate(Number(row.usd_exchange_rate));
      }
    } catch { /* usa defaults */ }
    setCatalogData({
      wineries: get(wineriesData),
      hotels: get(hotelsData),
      restaurants: get(restaurantsData),
      activities: get(activitiesData),
      tours: get(toursData),
      experiences: get(experiencesData),
      airportTransfers: get(airportTransfersData),
      guides: get(guidesData),
    });
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const handleNewQuote = () => {
    setSelectedQuote(null);
    setMode('form');
  };

  const handleEditQuote = async (q: FullQuote) => {
    try {
      const full = await api.quotes.get(q.id!);
      setSelectedQuote(full);
      setMode('form');
    } catch {
      setSelectedQuote(q);
      setMode('form');
    }
  };

  const handleViewQuote = async (q: FullQuote) => {
    try {
      const full = await api.quotes.get(q.id!);
      setSelectedQuote(full);
      setMode('detail');
    } catch {
      setSelectedQuote(q);
      setMode('detail');
    }
  };

  const handleSaveQuote = async (quoteData: FullQuote, _status: QuoteStatus) => {
    if (quoteData.id) {
      await api.quotes.update(quoteData.id, quoteData);
    } else {
      await api.quotes.create(quoteData);
    }
    await loadQuotes();
    setMode('list');
  };

  const handleDeleteQuote = async (q: FullQuote) => {
    if (!confirm(`¿Eliminar la cotización #${String(q.quote_number || 0).padStart(4, '0')}? Esta acción no se puede deshacer.`)) return;
    await api.quotes.delete(q.id!);
    await loadQuotes();
  };

  const handleStatusChange = async (status: QuoteStatus) => {
    if (!showStatusModal?.id) return;
    await api.quotes.updateStatus(showStatusModal.id, status);
    setShowStatusModal(null);
    await loadQuotes();
  };

  const fetchBnaRate = async () => {
    setFetchingBna(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      const venta = Number(data.venta);
      if (!venta || venta <= 0) return;
      setExchangeRate(venta);
      setTarifaSettings(prev => ({ ...prev, usd_exchange_rate: venta }));
      await api.settings.updateExchangeRate(venta);
      const now = new Date();
      setBnaUpdatedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch { /* red error silencioso */ }
    setFetchingBna(false);
  };

  const filteredQuotes = quotes.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.client_name?.toLowerCase().includes(term) ||
      q.description?.toLowerCase().includes(term) ||
      String(q.quote_number).includes(term)
    );
  });

  // ── Detail view ───────────────────────────────────────────────────────────
  if (mode === 'detail' && selectedQuote) {
    return (
      <div className="h-full overflow-y-auto">
        <QuoteDetailView quote={selectedQuote} onBack={() => setMode('list')} />
      </div>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  if (mode === 'form') {
    return (
      <div className="h-full overflow-y-auto">
        <QuoteForm
          initial={selectedQuote}
          settings={tarifaSettings}
          routes={routes}
          clients={clients}
          catalogData={catalogData}
          onSave={handleSaveQuote}
          onCancel={() => setMode('list')}
          onOpenTC={() => setShowTCModal(true)}
          onFetchBna={fetchBnaRate}
          fetchingBna={fetchingBna}
          bnaUpdatedAt={bnaUpdatedAt}
          onCatalogRefresh={loadCatalog}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-marga-wine font-display uppercase">Cotizaciones</h2>
          <p className="text-sm text-marga-dark/50 mt-0.5">Gestión de presupuestos en USD</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-marga-creamDark rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setShowTCModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-marga-dark/60 hover:text-marga-wine transition-colors border-r border-marga-creamDark"
            >
              <DollarSign size={14} />
              TC: ${exchangeRate.toLocaleString('es-AR')}
              <Edit2 size={12} />
            </button>
            <button
              onClick={fetchBnaRate}
              disabled={fetchingBna}
              title="Sincronizar con dólar BNA venta"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {fetchingBna ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              BNA{bnaUpdatedAt && <span className="text-blue-400 font-normal">{bnaUpdatedAt}</span>}
            </button>
          </div>
          <button
            onClick={handleNewQuote}
            className="flex items-center gap-2 bg-marga-wine hover:bg-marga-wineLight text-marga-cream font-bold py-2 px-4 rounded-xl text-sm shadow-sm transition-colors"
          >
            <Plus size={16} /> Nueva cotización
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-marga-dark/30" />
          <input
            type="text"
            placeholder="Buscar cliente, descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-white border border-marga-creamDark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-marga-wine/30"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[{ value: '', label: 'Todas' }, { value: 'draft', label: 'Borrador' }, { value: 'sent', label: 'Enviadas' }, { value: 'approved', label: 'Aprobadas' }, { value: 'rejected', label: 'Rechazadas' }].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === f.value ? 'bg-marga-wine text-marga-cream' : 'bg-white border border-marga-creamDark text-marga-dark/60 hover:bg-marga-creamDark'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="py-1.5 px-3 bg-white border border-marga-creamDark rounded-xl text-xs text-marga-dark/60 focus:outline-none"
          />
          <span className="text-marga-dark/30 text-xs">→</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="py-1.5 px-3 bg-white border border-marga-creamDark rounded-xl text-xs text-marga-dark/60 focus:outline-none"
          />
          <button onClick={loadQuotes} className="p-1.5 text-marga-dark/30 hover:text-marga-wine transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-marga-creamDark overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider border-b border-marga-creamDark">
            <tr>
              <th className="px-5 py-3">Nº</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3 hidden sm:table-cell">Descripción</th>
              <th className="px-5 py-3 hidden md:table-cell">Fecha</th>
              <th className="px-5 py-3 hidden lg:table-cell">Válido hasta</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-marga-dark/30 text-sm">
                  <div className="w-6 h-6 border-2 border-marga-wine/20 border-t-marga-wine rounded-full animate-spin mx-auto mb-2" />
                  Cargando...
                </td>
              </tr>
            ) : filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-marga-dark/30 text-sm">
                  <FileText size={32} className="mx-auto mb-2 opacity-20" />
                  No hay cotizaciones{filterStatus ? ` con estado "${STATUS_LABELS[filterStatus as QuoteStatus]}"` : ''}
                </td>
              </tr>
            ) : (
              filteredQuotes.map(q => {
                const subtotalArs = (q.total_transfers || 0) * (1 + (q.ganancia_transfer || 0) / 100)
                  + (q.total_services || 0) * (1 + (q.ganancia_servicio || 0) / 100);
                const totalFinalArs = subtotalArs * (1 + (q.comision || 0) * 2 / 100);
                const tc = q.exchange_rate || 0;
                const totalFinalUsd = tc > 0 ? totalFinalArs / tc : null;
                return (
                <tr key={q.id} className="hover:bg-marga-cream/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold text-marga-dark/40">
                      #{String(q.quote_number || 0).padStart(4, '0')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-marga-dark">{q.client_name}</td>
                  <td className="px-5 py-3.5 text-marga-dark/50 hidden sm:table-cell max-w-[200px] truncate">
                    {q.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-marga-dark/50 hidden md:table-cell">{q.date}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {q.validity_date ? (
                      (() => {
                        const vd = new Date(q.validity_date + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const expired = vd < today;
                        return (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {vd.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-marga-dark/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="font-mono font-bold text-marga-dark">{fmtARS(totalFinalArs)}</div>
                    {totalFinalUsd !== null && (
                      <div className="font-mono text-xs text-marga-dark/40">{fmt(totalFinalUsd)} · TC ${tc.toLocaleString('es-AR')}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={(q.status as QuoteStatus) || 'draft'} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewQuote(q)}
                        title="Ver detalle"
                        className="p-1.5 text-marga-dark/30 hover:text-marga-wine hover:bg-marga-wine/5 rounded-lg transition-colors"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={() => handleEditQuote(q)}
                        title="Editar"
                        className="p-1.5 text-marga-dark/30 hover:text-marga-wine hover:bg-marga-wine/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setShowStatusModal(q)}
                        title="Cambiar estado"
                        className="p-1.5 text-marga-dark/30 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(q)}
                        title="Eliminar"
                        className="p-1.5 text-marga-dark/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showTCModal && (
        <ExchangeRateModal
          current={exchangeRate}
          onSave={val => { setExchangeRate(val); setTarifaSettings(prev => ({ ...prev, usd_exchange_rate: val })); setShowTCModal(false); }}
          onClose={() => setShowTCModal(false)}
        />
      )}
      {showStatusModal && (
        <StatusChangeModal
          quote={showStatusModal}
          onSave={handleStatusChange}
          onClose={() => setShowStatusModal(null)}
        />
      )}
    </div>
  );
};

// Helper types for QuoteType
type QuoteType = 'experience' | 'custom';
