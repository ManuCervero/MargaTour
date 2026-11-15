import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, AlertTriangle, Plus, Edit2, Truck, User, Clock, Users, Phone, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import type { CalendarEvent, CalendarAssignment, FleetVehicle, Driver, QuoteVehicleType, FleetVehicleStatus } from '../types';

// Calendario de operación: cada transfer de una cotización aprobada aparece en su día
// y se le asigna vehículo y conductor (o proveedor, si el vehículo es contratado).

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const VEHICLE_TYPE_LABELS: Record<QuoteVehicleType, string> = {
    auto: 'Auto',
    rav: 'Camioneta RAV',
    van: 'Camioneta tipo VAN',
    van_rampa: 'VAN con rampa',
    minibus: 'Minibus',
};

const VEHICLE_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
    operativo: 'Operativo',
    taller: 'En taller',
    fuera_de_servicio: 'Fuera de servicio',
};

const inp = "w-full px-3 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm bg-white";
const sel = "px-3 py-1.5 border border-marga-creamDark rounded-lg text-sm font-semibold text-marga-dark bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30";

// Fechas en hora local (toISOString corre el día por la zona horaria)
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDayLong = (s: string) => { const d = parseISO(s); return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`; };
const quoteRef = (n: number) => `#${String(n || 0).padStart(4, '0')}`;

const driverName = (d?: Driver | null) => (d ? `${d.first_name}${d.last_name ? ` ${d.last_name}` : ''}` : '');
const vehicleName = (v?: FleetVehicle | null) => (v ? `${[v.brand, v.model].filter(Boolean).join(' ') || 'Vehículo'} (${v.plate})` : '');

// ── Estado de asignación y superposiciones ────────────────────────────────────

type AssignStatus = 'none' | 'partial' | 'done';

const slotComplete = (contracted: boolean, a?: CalendarAssignment) =>
    contracted ? !!a?.external_provider : !!(a?.vehicle_id && a?.driver_id);

function assignStatus(ev: CalendarEvent): AssignStatus {
    const done = ev.vehicles.filter((v, i) => slotComplete(v.contracted, ev.assignments.find(a => a.slot === i))).length;
    if (done === ev.vehicles.length) return 'done';
    const any = ev.assignments.some(a => a.vehicle_id || a.driver_id || a.external_provider);
    return any || done > 0 ? 'partial' : 'none';
}

const STATUS_STYLES: Record<AssignStatus, { chip: string; label: string; dot: string }> = {
    none: { chip: 'bg-marga-roseLight/70 text-marga-wine border-marga-rose', label: 'Sin asignar', dot: 'bg-marga-rose' },
    partial: { chip: 'bg-amber-50 text-amber-800 border-amber-300', label: 'Incompleto', dot: 'bg-amber-400' },
    done: { chip: 'bg-marga-oliveLight/50 text-marga-dark border-marga-olive', label: 'Asignado', dot: 'bg-marga-olive' },
};

// Rango horario del transfer en minutos; null si no tiene hora cargada
function timeRange(ev: CalendarEvent): [number, number] | null {
    if (!ev.hour || !/^\d{1,2}:\d{2}/.test(ev.hour)) return null;
    const [h, m] = ev.hour.split(':').map(Number);
    const start = h * 60 + m;
    const hours = ev.duration_hours > 0 ? ev.duration_hours : ev.is_full_day ? 9 : 2;
    return [start, start + hours * 60];
}

// Dos transfers del mismo día se pisan si los horarios se cruzan o si a alguno le falta la hora
function overlaps(a: CalendarEvent, b: CalendarEvent) {
    if (a.day !== b.day) return false;
    const ra = timeRange(a), rb = timeRange(b);
    if (!ra || !rb) return true;
    return ra[0] < rb[1] && rb[0] < ra[1];
}

interface Clash { kind: 'vehicle' | 'driver'; id: string; other: CalendarEvent }

function findClashes(ev: CalendarEvent, slots: CalendarAssignment[], all: CalendarEvent[]): Clash[] {
    const out: Clash[] = [];
    // El mismo vehículo o conductor en dos lugares del mismo transfer
    const seenV = new Set<string>(), seenD = new Set<string>();
    for (const s of slots) {
        if (s.vehicle_id) { if (seenV.has(s.vehicle_id)) out.push({ kind: 'vehicle', id: s.vehicle_id, other: ev }); seenV.add(s.vehicle_id); }
        if (s.driver_id) { if (seenD.has(s.driver_id)) out.push({ kind: 'driver', id: s.driver_id, other: ev }); seenD.add(s.driver_id); }
    }
    for (const other of all) {
        if (other.id === ev.id || !overlaps(ev, other)) continue;
        for (const s of slots) {
            if (s.vehicle_id && other.assignments.some(a => a.vehicle_id === s.vehicle_id)) out.push({ kind: 'vehicle', id: s.vehicle_id, other });
            if (s.driver_id && other.assignments.some(a => a.driver_id === s.driver_id)) out.push({ kind: 'driver', id: s.driver_id, other });
        }
    }
    return out;
}

// ── Vista principal ───────────────────────────────────────────────────────────

type CalendarTab = 'calendario' | 'vehiculos' | 'conductores';

export const CalendarView: React.FC = () => {
    const [tab, setTab] = useState<CalendarTab>('calendario');
    const [fleet, setFleet] = useState<FleetVehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const loadCatalogs = () => Promise.all([
        api.fleet.list().then(setFleet).catch(() => setFleet([])),
        api.drivers.list().then(setDrivers).catch(() => setDrivers([])),
    ]);
    useEffect(() => { loadCatalogs(); }, []);

    return (
        <div className="p-4 sm:p-6 h-full overflow-y-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-2xl font-bold text-marga-wine font-display uppercase">Calendario</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {tab === 'calendario'
                            ? 'Los transfers de cada cotización aprobada aparecen solos. Tocá uno para asignarle vehículo y conductor.'
                            : tab === 'vehiculos' ? 'La flota propia que se asigna a los transfers.' : 'Los conductores que se asignan a los transfers.'}
                    </p>
                </div>
                <div className="flex bg-white border border-marga-creamDark rounded-xl p-1">
                    {([['calendario', 'Calendario'], ['vehiculos', 'Vehículos'], ['conductores', 'Conductores']] as const).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setTab(value)}
                            className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${tab === value ? 'bg-marga-wine text-marga-cream' : 'text-marga-dark/60 hover:text-marga-wine'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {tab === 'calendario' && <MonthCalendar fleet={fleet} drivers={drivers} onGoToCatalog={setTab} />}
            {tab === 'vehiculos' && <VehiclesPanel fleet={fleet} onChanged={loadCatalogs} />}
            {tab === 'conductores' && <DriversPanel drivers={drivers} onChanged={loadCatalogs} />}
        </div>
    );
};

// ── Calendario mensual ────────────────────────────────────────────────────────

const MonthCalendar: React.FC<{ fleet: FleetVehicle[]; drivers: Driver[]; onGoToCatalog: (t: CalendarTab) => void }> = ({ fleet, drivers, onGoToCatalog }) => {
    const today = iso(new Date());
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [filterDriver, setFilterDriver] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [onlyPending, setOnlyPending] = useState(false);

    // La grilla arranca el lunes de la semana del día 1 y termina el domingo de la última semana
    const days = useMemo(() => {
        const first = new Date(cursor);
        const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
        const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const end = new Date(last); end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
        const out: string[] = [];
        for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(iso(d));
        return out;
    }, [cursor]);

    const fetchEvents = () => {
        setError('');
        return api.calendar.list(days[0], days[days.length - 1])
            .then((data: CalendarEvent[]) => setEvents(data))
            .catch((e: Error) => { setEvents([]); setError(e.message || 'No se pudo cargar el calendario'); })
            .finally(() => setLoading(false));
    };
    useEffect(() => { setLoading(true); fetchEvents(); }, [days]);

        const driverById = useMemo(() => new Map<string, Driver>(drivers.map(d => [d.id, d])), [drivers]);

    const clashIds = useMemo(() => {
        const ids = new Set<string>();
        for (const ev of events) if (findClashes(ev, ev.assignments, events).length) ids.add(ev.id);
        return ids;
    }, [events]);

    const visible = useMemo(() => events.filter(ev => {
        if (filterDriver && !ev.assignments.some(a => a.driver_id === filterDriver)) return false;
        if (filterVehicle && !ev.assignments.some(a => a.vehicle_id === filterVehicle)) return false;
        if (onlyPending && assignStatus(ev) === 'done') return false;
        return true;
    }), [events, filterDriver, filterVehicle, onlyPending]);

    const byDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of visible) { if (!map.has(ev.day)) map.set(ev.day, []); map.get(ev.day)!.push(ev); }
        return map;
    }, [visible]);

    const monthPrefix = iso(cursor).slice(0, 7);
    const monthEvents = events.filter(e => e.day.startsWith(monthPrefix));
    const pendingCount = monthEvents.filter(e => assignStatus(e) !== 'done').length;
    const openEvent = events.find(e => e.id === openId) || null;
    const move = (delta: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));

    const chip = (ev: CalendarEvent, compact: boolean) => {
        const st = STATUS_STYLES[assignStatus(ev)];
        const clash = clashIds.has(ev.id);
        const who = ev.assignments.map(a => driverName(driverById.get(a.driver_id || '')) || a.external_provider).filter(Boolean).join(', ');
        return (
            <button
                key={ev.id}
                onClick={() => setOpenId(ev.id)}
                title={`${ev.hour || 'Sin hora'} · ${ev.origin} → ${ev.destination} · ${ev.client_name} (${ev.pax} pax)`}
                className={`w-full text-left rounded-md border px-1.5 py-1 text-[11px] leading-tight hover:brightness-95 transition ${st.chip} ${clash ? 'ring-2 ring-red-500' : ''}`}
            >
                <span className="flex items-center gap-1 font-bold truncate">
                    {clash && <AlertTriangle size={11} className="text-red-600 shrink-0" />}
                    {ev.hour && <span className="font-mono shrink-0">{ev.hour.slice(0, 5)}</span>}
                    <span className="truncate">{ev.destination || ev.origin}</span>
                </span>
                {!compact && <span className="block truncate opacity-75">{ev.client_name}{who ? ` · ${who}` : ''}</span>}
            </button>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                    <button onClick={() => move(-1)} className="p-1.5 rounded-lg hover:bg-white text-marga-wine" aria-label="Mes anterior"><ChevronLeft size={20} /></button>
                    <h3 className="text-lg font-bold text-marga-dark w-40 text-center">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</h3>
                    <button onClick={() => move(1)} className="p-1.5 rounded-lg hover:bg-white text-marga-wine" aria-label="Mes siguiente"><ChevronRight size={20} /></button>
                </div>
                <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-marga-creamDark bg-white text-marga-wine hover:bg-marga-cream">Hoy</button>
                {pendingCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-marga-roseLight text-marga-wine">{pendingCount} sin asignar este mes</span>
                )}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)} className={sel}>
                        <option value="">Todos los conductores</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{driverName(d)}</option>)}
                    </select>
                    <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className={sel}>
                        <option value="">Todos los vehículos</option>
                        {fleet.map(v => <option key={v.id} value={v.id}>{vehicleName(v)}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-marga-dark/70 cursor-pointer select-none">
                        <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} className="accent-marga-wine" />
                        Solo sin asignar
                    </label>
                </div>
            </div>

            {(fleet.length === 0 || drivers.length === 0) && (
                <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800 flex flex-wrap items-center gap-2">
                    <AlertTriangle size={16} />
                    Para asignar transfers primero cargá
                    {fleet.length === 0 && <button onClick={() => onGoToCatalog('vehiculos')} className="font-bold underline">los vehículos</button>}
                    {fleet.length === 0 && drivers.length === 0 && 'y'}
                    {drivers.length === 0 && <button onClick={() => onGoToCatalog('conductores')} className="font-bold underline">los conductores</button>}.
                </div>
            )}
            {error && <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

            {/* Grilla mensual (tablet y escritorio) */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b border-marga-creamDark">
                    {WEEKDAYS.map(d => <div key={d} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((day, i) => {
                        const inMonth = day.startsWith(monthPrefix);
                        const list = byDay.get(day) || [];
                        return (
                            <div key={day} className={`min-h-[112px] p-1.5 border-marga-creamDark/70 ${i % 7 !== 6 ? 'border-r' : ''} ${i < days.length - 7 ? 'border-b' : ''} ${inMonth ? '' : 'bg-gray-50/60'} ${day === today ? 'bg-marga-cream/60' : ''}`}>
                                <div className="flex justify-end mb-1">
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${day === today ? 'bg-marga-wine text-marga-cream' : inMonth ? 'text-marga-dark/70' : 'text-gray-300'}`}>{parseISO(day).getDate()}</span>
                                </div>
                                <div className="space-y-1">{list.map(ev => chip(ev, list.length > 3))}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Agenda (celular) */}
            <div className="md:hidden space-y-3">
                {days.filter(d => d.startsWith(monthPrefix) && byDay.has(d)).map(day => (
                    <div key={day} className="bg-white rounded-xl border border-marga-creamDark p-3">
                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${day === today ? 'text-marga-wine' : 'text-gray-500'}`}>{fmtDayLong(day)}{day === today ? ' · Hoy' : ''}</p>
                        <div className="space-y-1.5">{byDay.get(day)!.map(ev => chip(ev, false))}</div>
                    </div>
                ))}
                {!loading && !days.some(d => d.startsWith(monthPrefix) && byDay.has(d)) && (
                    <p className="text-center text-sm text-gray-400 py-10">No hay transfers este mes.</p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                {(['none', 'partial', 'done'] as AssignStatus[]).map(s => (
                    <span key={s} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />{STATUS_STYLES[s].label}</span>
                ))}
                <span className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-600" />Vehículo o conductor superpuesto</span>
                {loading && <span className="ml-auto">Cargando...</span>}
                {!loading && monthEvents.length === 0 && !error && <span className="ml-auto hidden md:inline">No hay transfers aprobados este mes.</span>}
            </div>

            {openEvent && (
                <AssignModal
                    event={openEvent}
                    allEvents={events}
                    fleet={fleet}
                    drivers={drivers}
                    onClose={() => setOpenId(null)}
                    onSaved={() => { setOpenId(null); fetchEvents(); }}
                />
            )}
        </div>
    );
};

// ── Asignar vehículo y conductor ──────────────────────────────────────────────

const AssignModal: React.FC<{
    event: CalendarEvent;
    allEvents: CalendarEvent[];
    fleet: FleetVehicle[];
    drivers: Driver[];
    onClose: () => void;
    onSaved: () => void;
}> = ({ event: ev, allEvents, fleet, drivers, onClose, onSaved }) => {
    const [slots, setSlots] = useState<CalendarAssignment[]>(() =>
        ev.vehicles.map((_, i) => {
            const a = ev.assignments.find(x => x.slot === i);
            return { slot: i, vehicle_id: a?.vehicle_id || '', driver_id: a?.driver_id || '', external_provider: a?.external_provider || '', notes: a?.notes || '' };
        })
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fleetById = new Map<string, FleetVehicle>(fleet.map(v => [v.id, v]));
    const driverById = new Map<string, Driver>(drivers.map(d => [d.id, d]));
    const clashes = findClashes(ev, slots, allEvents);
    const clashFor = (kind: 'vehicle' | 'driver', id?: string | null) => (id ? clashes.filter(c => c.kind === kind && c.id === id) : []);

    const ownSlots = ev.vehicles.map((v, i) => ({ v, s: slots[i] })).filter(x => !x.v.contracted);
    const assignedCapacity = ownSlots.reduce((sum, x) => sum + (fleetById.get(x.s.vehicle_id || '')?.capacity || 0), 0);
    const capacityShort = ev.vehicles.every(v => !v.contracted) && ownSlots.every(x => x.s.vehicle_id) && assignedCapacity > 0 && assignedCapacity < ev.pax;

    const update = (i: number, patch: Partial<CalendarAssignment>) => setSlots(prev => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

    const save = async () => {
        setSaving(true); setError('');
        try {
            await api.calendar.assign({ quote_id: ev.quote_id, transfer_key: ev.transfer_key, slots });
            onSaved();
        } catch (e) {
            setError((e as Error).message || 'No se pudo guardar');
            setSaving(false);
        }
    };

    // Vehículos activos, primero los del tipo pedido; se mantiene el ya elegido aunque esté dado de baja
    const vehicleOptions = (type: QuoteVehicleType, current?: string | null) =>
        fleet
            .filter(v => v.is_active !== 0 || v.id === current)
            .sort((a, b) => Number(b.vehicle_type === type) - Number(a.vehicle_type === type) || a.plate.localeCompare(b.plate));
    const driverOptions = (current?: string | null) => drivers.filter(d => d.is_active !== 0 || d.id === current);

    const clashText = (c: Clash) =>
        c.other.id === ev.id ? 'está elegido dos veces en este transfer'
            : `ya tiene ${c.other.hour ? `a las ${c.other.hour.slice(0, 5)} ` : 'ese día '}${c.other.origin} → ${c.other.destination} (${c.other.client_name})`;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-marga-creamDark px-6 py-4 flex items-start justify-between gap-4 z-10">
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-marga-dark/40">{fmtDayLong(ev.day)}</p>
                        <h3 className="text-xl font-bold text-marga-wine leading-tight">{ev.origin} → {ev.destination}</h3>
                        <p className="text-sm text-gray-500">{ev.client_name || 'Sin cliente'} · Cotización {quoteRef(ev.quote_number)}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Cerrar"><X size={20} /></button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <Info icon={Clock} label="Hora" value={ev.hour ? ev.hour.slice(0, 5) : 'Sin hora'} />
                        <Info icon={Users} label="Pasajeros" value={`${ev.pax} pax`} />
                        <Info icon={Truck} label="Servicio" value={ev.is_full_day ? 'Día completo' : ev.duration_hours ? `${ev.duration_hours} h` : 'Traslado'} />
                        <Info icon={Phone} label="Teléfono" value={ev.client_phone || '-'} />
                    </div>
                    {(ev.notes || ev.quote_description) && (
                        <div className="text-sm bg-marga-cream/60 rounded-xl px-4 py-3 text-marga-dark/80 space-y-1">
                            {ev.quote_description && <p>{ev.quote_description}</p>}
                            {ev.notes && <p><span className="font-semibold">Notas del transfer:</span> {ev.notes}</p>}
                        </div>
                    )}

                    <div className="space-y-3">
                        {ev.vehicles.map((req, i) => {
                            const s = slots[i];
                            const vClash = clashFor('vehicle', s.vehicle_id);
                            const dClash = clashFor('driver', s.driver_id);
                            const chosen = fleetById.get(s.vehicle_id || '');
                            return (
                                <div key={i} className="border border-marga-creamDark rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <p className="text-sm font-bold text-marga-dark">
                                            {ev.vehicles.length > 1 ? `Vehículo ${i + 1}: ` : 'Pedido: '}{VEHICLE_TYPE_LABELS[req.type] || req.type}
                                        </p>
                                        {req.contracted && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Contratado</span>}
                                        {!req.contracted && slotComplete(false, s) && <CheckCircle2 size={18} className="text-marga-olive" />}
                                    </div>
                                    {req.contracted ? (
                                        <label className="block">
                                            <span className="text-xs font-semibold text-gray-500">Proveedor / chofer contratado</span>
                                            <input className={inp} value={s.external_provider || ''} onChange={e => update(i, { external_provider: e.target.value })} placeholder="Ej: Remises Cuyo – Juan, 261 555-1234" />
                                        </label>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <label className="block">
                                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Truck size={12} />Vehículo</span>
                                                <select className={inp} value={s.vehicle_id || ''} onChange={e => update(i, { vehicle_id: e.target.value })}>
                                                    <option value="">Sin asignar</option>
                                                    {vehicleOptions(req.type, s.vehicle_id).map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.plate} · {[v.brand, v.model].filter(Boolean).join(' ')}{v.capacity ? ` (${v.capacity} pax)` : ''}
                                                            {v.status && v.status !== 'operativo' ? ` – ${VEHICLE_STATUS_LABELS[v.status]}` : ''}{v.is_active === 0 ? ' – dado de baja' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="block">
                                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><User size={12} />Conductor</span>
                                                <select className={inp} value={s.driver_id || ''} onChange={e => update(i, { driver_id: e.target.value })}>
                                                    <option value="">Sin asignar</option>
                                                    {driverOptions(s.driver_id).map(d => <option key={d.id} value={d.id}>{driverName(d)}{d.is_active === 0 ? ' – dado de baja' : ''}</option>)}
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                    {chosen && chosen.status && chosen.status !== 'operativo' && (
                                        <Warn>{vehicleName(chosen)} figura como {VEHICLE_STATUS_LABELS[chosen.status].toLowerCase()}.</Warn>
                                    )}
                                    {chosen && chosen.vehicle_type && chosen.vehicle_type !== req.type && (
                                        <p className="mt-2 text-xs text-gray-500">Se pidió {VEHICLE_TYPE_LABELS[req.type].toLowerCase()} y elegiste {VEHICLE_TYPE_LABELS[chosen.vehicle_type].toLowerCase()}.</p>
                                    )}
                                    {vClash.map((c, k) => <Warn key={`v${k}`}>{vehicleName(fleetById.get(c.id))} {clashText(c)}.</Warn>)}
                                    {dClash.map((c, k) => <Warn key={`d${k}`}>{driverName(driverById.get(c.id))} {clashText(c)}.</Warn>)}
                                </div>
                            );
                        })}
                    </div>

                    {capacityShort && <Warn>Los vehículos elegidos suman {assignedCapacity} lugares y el transfer es de {ev.pax} pax.</Warn>}
                    {error && <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-marga-creamDark px-6 py-4 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar asignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Info: React.FC<{ icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="bg-gray-50 rounded-xl px-3 py-2">
        <p className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1"><Icon size={11} />{label}</p>
        <p className="font-bold text-marga-dark truncate">{value}</p>
    </div>
);

const Warn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="mt-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
        <AlertTriangle size={13} className="shrink-0 mt-px" /><span>{children}</span>
    </p>
);

// ── Vehículos ─────────────────────────────────────────────────────────────────

const emptyVehicle: Partial<FleetVehicle> = { plate: '', brand: '', model: '', year: null, capacity: null, vehicle_type: 'van', accessible: 0, status: 'operativo', notes: '', is_active: 1 };

const VehiclesPanel: React.FC<{ fleet: FleetVehicle[]; onChanged: () => void }> = ({ fleet, onChanged }) => {
    const [editing, setEditing] = useState<Partial<FleetVehicle> | null>(null);
    return (
        <div>
            <div className="flex justify-end mb-3">
                <button onClick={() => setEditing({ ...emptyVehicle })} className="px-4 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight flex items-center gap-1.5"><Plus size={16} />Agregar vehículo</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Patente</th>
                            <th className="px-4 py-3">Vehículo</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3 text-center">Capacidad</th>
                            <th className="px-4 py-3 text-center">Accesible</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Observaciones</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {fleet.map(v => (
                            <tr key={v.id} className={`border-t border-gray-100 ${v.is_active === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3 font-mono font-bold text-marga-dark whitespace-nowrap">{v.plate}</td>
                                <td className="px-4 py-3">{[v.brand, v.model, v.year].filter(Boolean).join(' ') || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{v.vehicle_type ? VEHICLE_TYPE_LABELS[v.vehicle_type] : '-'}</td>
                                <td className="px-4 py-3 text-center">{v.capacity || '-'}</td>
                                <td className="px-4 py-3 text-center">{v.accessible ? 'Sí' : 'No'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {v.is_active === 0 ? <span className="text-gray-400">Dado de baja</span>
                                        : <span className={`px-2 py-1 rounded-full text-xs font-bold ${v.status === 'operativo' || !v.status ? 'bg-marga-oliveLight/60 text-marga-dark' : 'bg-amber-100 text-amber-800'}`}>{VEHICLE_STATUS_LABELS[v.status || 'operativo']}</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{v.notes || '-'}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(v)} className="p-1.5 rounded-lg hover:bg-marga-cream text-marga-wine" aria-label="Editar"><Edit2 size={15} /></button></td>
                            </tr>
                        ))}
                        {fleet.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Todavía no hay vehículos cargados.</td></tr>}
                    </tbody>
                </table>
            </div>
            {editing && <VehicleForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
        </div>
    );
};

const VehicleForm: React.FC<{ initial: Partial<FleetVehicle>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const [f, setF] = useState<Partial<FleetVehicle>>(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (patch: Partial<FleetVehicle>) => setF(prev => ({ ...prev, ...patch }));

    const save = async () => {
        if (!f.plate?.trim()) { setError('La patente es obligatoria'); return; }
        setSaving(true); setError('');
        const data = {
            plate: f.plate.trim().toUpperCase(), brand: f.brand || '', model: f.model || '',
            year: f.year ? Number(f.year) : null, capacity: f.capacity ? Number(f.capacity) : null,
            vehicle_type: f.vehicle_type || 'van', accessible: f.accessible ? 1 : 0,
            status: f.status || 'operativo', notes: f.notes || '', is_active: f.is_active === 0 ? 0 : 1,
        };
        try {
            if (f.id) await api.fleet.update(f.id, data); else await api.fleet.create(data);
            onSaved();
        } catch (e) { setError((e as Error).message || 'No se pudo guardar'); setSaving(false); }
    };

    return (
        <FormModal title={f.id ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={onClose} onSave={save} saving={saving} error={error}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Patente *"><input className={inp} value={f.plate || ''} onChange={e => set({ plate: e.target.value })} placeholder="AF711JJ" /></Field>
                <Field label="Tipo">
                    <select className={inp} value={f.vehicle_type || 'van'} onChange={e => set({ vehicle_type: e.target.value as QuoteVehicleType })}>
                        {Object.entries(VEHICLE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </Field>
                <Field label="Marca"><input className={inp} value={f.brand || ''} onChange={e => set({ brand: e.target.value })} placeholder="Mercedes-Benz" /></Field>
                <Field label="Modelo"><input className={inp} value={f.model || ''} onChange={e => set({ model: e.target.value })} placeholder="Sprinter 516" /></Field>
                <Field label="Año"><input type="number" className={inp} value={f.year ?? ''} onChange={e => set({ year: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Capacidad (pax)"><input type="number" className={inp} value={f.capacity ?? ''} onChange={e => set({ capacity: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Estado">
                    <select className={inp} value={f.status || 'operativo'} onChange={e => set({ status: e.target.value as FleetVehicleStatus })}>
                        {Object.entries(VEHICLE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold text-marga-dark/80 mt-5">
                    <input type="checkbox" className="accent-marga-wine" checked={!!f.accessible} onChange={e => set({ accessible: e.target.checked ? 1 : 0 })} />
                    Apto para personas con discapacidad
                </label>
            </div>
            <Field label="Observaciones"><textarea className={inp} rows={2} value={f.notes || ''} onChange={e => set({ notes: e.target.value })} /></Field>
            {f.id && (
                <label className="flex items-center gap-2 text-sm font-semibold text-marga-dark/80">
                    <input type="checkbox" className="accent-marga-wine" checked={f.is_active === 0} onChange={e => set({ is_active: e.target.checked ? 0 : 1 })} />
                    Dado de baja (deja de aparecer para asignar)
                </label>
            )}
        </FormModal>
    );
};

// ── Conductores ───────────────────────────────────────────────────────────────

const DriversPanel: React.FC<{ drivers: Driver[]; onChanged: () => void }> = ({ drivers, onChanged }) => {
    const [editing, setEditing] = useState<Partial<Driver> | null>(null);
    return (
        <div>
            <div className="flex justify-end mb-3">
                <button onClick={() => setEditing({ first_name: '', last_name: '', phone: '', email: '', notes: '', is_active: 1 })} className="px-4 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight flex items-center gap-1.5"><Plus size={16} />Agregar conductor</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Observaciones</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(d => (
                            <tr key={d.id} className={`border-t border-gray-100 ${d.is_active === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3 font-bold text-marga-dark whitespace-nowrap">{driverName(d)}{d.is_active === 0 && <span className="ml-2 text-xs font-semibold text-gray-400">Dado de baja</span>}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{d.phone || '-'}</td>
                                <td className="px-4 py-3">{d.email || '-'}</td>
                                <td className="px-4 py-3 text-gray-500">{d.notes || '-'}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(d)} className="p-1.5 rounded-lg hover:bg-marga-cream text-marga-wine" aria-label="Editar"><Edit2 size={15} /></button></td>
                            </tr>
                        ))}
                        {drivers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Todavía no hay conductores cargados.</td></tr>}
                    </tbody>
                </table>
            </div>
            {editing && <DriverForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
        </div>
    );
};

const DriverForm: React.FC<{ initial: Partial<Driver>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const [f, setF] = useState<Partial<Driver>>(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (patch: Partial<Driver>) => setF(prev => ({ ...prev, ...patch }));

    const save = async () => {
        if (!f.first_name?.trim()) { setError('El nombre es obligatorio'); return; }
        setSaving(true); setError('');
        const data = { first_name: f.first_name.trim(), last_name: f.last_name || '', phone: f.phone || '', email: f.email || '', notes: f.notes || '', is_active: f.is_active === 0 ? 0 : 1 };
        try {
            if (f.id) await api.drivers.update(f.id, data); else await api.drivers.create(data);
            onSaved();
        } catch (e) { setError((e as Error).message || 'No se pudo guardar'); setSaving(false); }
    };

    return (
        <FormModal title={f.id ? 'Editar conductor' : 'Nuevo conductor'} onClose={onClose} onSave={save} saving={saving} error={error}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *"><input className={inp} value={f.first_name || ''} onChange={e => set({ first_name: e.target.value })} /></Field>
                <Field label="Apellido"><input className={inp} value={f.last_name || ''} onChange={e => set({ last_name: e.target.value })} /></Field>
                <Field label="Teléfono"><input className={inp} value={f.phone || ''} onChange={e => set({ phone: e.target.value })} /></Field>
                <Field label="Email"><input type="email" className={inp} value={f.email || ''} onChange={e => set({ email: e.target.value })} /></Field>
            </div>
            <Field label="Observaciones"><textarea className={inp} rows={2} value={f.notes || ''} onChange={e => set({ notes: e.target.value })} /></Field>
            {f.id && (
                <label className="flex items-center gap-2 text-sm font-semibold text-marga-dark/80">
                    <input type="checkbox" className="accent-marga-wine" checked={f.is_active === 0} onChange={e => set({ is_active: e.target.checked ? 0 : 1 })} />
                    Dado de baja (deja de aparecer para asignar)
                </label>
            )}
        </FormModal>
    );
};

// ── Piezas comunes de formulario ──────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-gray-500">{label}</span>{children}</label>
);

const FormModal: React.FC<{ title: string; onClose: () => void; onSave: () => void; saving: boolean; error: string; children: React.ReactNode }> = ({ title, onClose, onSave, saving, error, children }) => (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="border-b border-marga-creamDark px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-marga-wine">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Cerrar"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
                {children}
                {error && <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}
            </div>
            <div className="border-t border-marga-creamDark px-6 py-4 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                <button onClick={onSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </div>
    </div>
);
