import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, AlertTriangle, Plus, Edit2, Truck, User, Clock, Users, Phone, CheckCircle2, Copy, Handshake, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import type { CalendarEvent, CalendarAssignment, FleetVehicle, Driver, ThirdParty, ThirdPartyJob, QuoteVehicleType, FleetVehicleStatus } from '../types';

// Calendario de operación: cada cotización aprobada es una barra que va del primer al
// último día con transfers, dividida por día. Cada transfer se asigna a un vehículo
// propio con su conductor, o a un tercero que pone vehículo y chofer.

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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
const addDays = (s: string, n: number) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const fmtDayLong = (s: string) => { const d = parseISO(s); return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`; };
const fmtDayShort = (s: string) => { const d = parseISO(s); return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; };
const fmtRange = (a: string, b: string) => (a === b ? fmtDayShort(a) : `${fmtDayShort(a)} → ${fmtDayShort(b)}`);
const daysBetween = (a: string, b: string) => { const out: string[] = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
const quoteRef = (n: number) => `#${String(n || 0).padStart(4, '0')}`;

const driverName = (d?: Driver | null) => (d ? `${d.first_name}${d.last_name ? ` ${d.last_name}` : ''}` : '');
const vehicleName = (v?: FleetVehicle | null) => (v ? `${[v.brand, v.model].filter(Boolean).join(' ') || 'Vehículo'} (${v.plate})` : '');
const hasRamp = (v?: FleetVehicle | null) => !!v && (v.vehicle_type === 'van_rampa' || v.accessible === 1);

interface Catalogs {
    fleetById: Map<string, FleetVehicle>;
    driverById: Map<string, Driver>;
    tpById: Map<string, ThirdParty>;
}

// ── Estado de asignación y superposiciones ────────────────────────────────────

const slotDone = (a?: CalendarAssignment) => !!(a && (a.third_party_id || (a.vehicle_id && a.driver_id) || a.external_provider));

const eventDone = (ev: CalendarEvent) => ev.vehicles.every((_, i) => slotDone(ev.assignments.find(a => a.slot === i)));

const eventTouched = (ev: CalendarEvent) => ev.assignments.some(a => a.vehicle_id || a.driver_id || a.third_party_id || a.external_provider);

// Estado de un día de una cotización (todos sus transfers de ese día).
// Asignado: naranja si va un vehículo propio con rampa, celeste si lo hace un tercero, verde si no.
type DayStatus = 'empty' | 'none' | 'partial' | 'propio' | 'rampa' | 'tercero';

function dayStatus(events: CalendarEvent[], cat: Catalogs): DayStatus {
    if (events.length === 0) return 'empty';
    if (!events.every(eventDone)) return events.some(eventTouched) ? 'partial' : 'none';
    const all = events.flatMap(e => e.assignments);
    if (all.some(a => !a.third_party_id && hasRamp(cat.fleetById.get(a.vehicle_id || '')))) return 'rampa';
    if (all.some(a => a.third_party_id || a.external_provider)) return 'tercero';
    return 'propio';
}

const STATUS_STYLES: Record<DayStatus, { seg: string; label: string; dot: string }> = {
    empty: { seg: 'bg-gray-50 text-gray-300', label: 'Sin transfer', dot: 'bg-gray-200' },
    none: { seg: 'bg-marga-roseLight/80 text-marga-wine', label: 'Sin asignar', dot: 'bg-marga-rose' },
    partial: { seg: 'bg-yellow-100 text-yellow-900', label: 'Incompleto', dot: 'bg-yellow-400' },
    propio: { seg: 'bg-green-100 text-green-900', label: 'Asignado', dot: 'bg-green-500' },
    rampa: { seg: 'bg-orange-200 text-orange-900', label: 'Asignado con rampa', dot: 'bg-orange-500' },
    tercero: { seg: 'bg-sky-100 text-sky-900', label: 'Asignado a tercero', dot: 'bg-sky-400' },
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

// Quién hace el transfer, para mostrar en el calendario
const whoDoesIt = (ev: CalendarEvent, cat: Catalogs) =>
    ev.assignments
        .map(a => (a.third_party_id ? cat.tpById.get(a.third_party_id)?.name : driverName(cat.driverById.get(a.driver_id || '')) || a.external_provider))
        .filter(Boolean)
        .join(', ');

// ── Cotizaciones como barras de varios días ───────────────────────────────────

interface QuoteGroup {
    quote_id: string;
    quote_number: number;
    client_name: string;
    client_phone?: string | null;
    description?: string | null;
    pax: number;
    start: string;
    end: string;
    events: CalendarEvent[];
    byDay: Map<string, CalendarEvent[]>;
}

function groupByQuote(events: CalendarEvent[]): QuoteGroup[] {
    const map = new Map<string, QuoteGroup>();
    for (const ev of events) {
        let g = map.get(ev.quote_id);
        if (!g) {
            g = {
                quote_id: ev.quote_id, quote_number: ev.quote_number, client_name: ev.client_name, client_phone: ev.client_phone,
                description: ev.quote_description, pax: ev.pax, start: ev.day, end: ev.day, events: [], byDay: new Map(),
            };
            map.set(ev.quote_id, g);
        }
        g.events.push(ev);
        g.pax = Math.max(g.pax, ev.pax);
        if (ev.day < g.start) g.start = ev.day;
        if (ev.day > g.end) g.end = ev.day;
        if (!g.byDay.has(ev.day)) g.byDay.set(ev.day, []);
        g.byDay.get(ev.day)!.push(ev);
    }
    return [...map.values()].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
}

interface WeekBar { group: QuoteGroup; from: string; to: string; col: number; span: number; lane: number }

// Reparte las barras de una semana en carriles para que no se encimen
function layoutWeek(week: string[], groups: QuoteGroup[]): { bars: WeekBar[]; lanes: number } {
    const ws = week[0], we = week[6];
    const segs = groups
        .filter(g => g.start <= we && g.end >= ws)
        .map(g => {
            const from = g.start < ws ? ws : g.start;
            const to = g.end > we ? we : g.end;
            return { group: g, from, to, col: week.indexOf(from), span: week.indexOf(to) - week.indexOf(from) + 1 };
        })
        .sort((a, b) => a.col - b.col || b.span - a.span);
    const laneEnds: number[] = [];
    const bars: WeekBar[] = segs.map(s => {
        let lane = laneEnds.findIndex(end => end < s.col);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(-1); }
        laneEnds[lane] = s.col + s.span - 1;
        return { ...s, lane };
    });
    return { bars, lanes: laneEnds.length };
}

// ── Vista principal ───────────────────────────────────────────────────────────

type CalendarTab = 'calendario' | 'vehiculos' | 'conductores' | 'terceros';

const TAB_HINTS: Record<CalendarTab, string> = {
    calendario: 'Cada cotización aprobada aparece como una barra del primer al último día. Tocá un día para asignar vehículo y conductor, o un tercero.',
    vehiculos: 'La flota propia que se asigna a los transfers.',
    conductores: 'Los conductores que se asignan a los transfers.',
    terceros: 'Las empresas o choferes que contratamos: ponen su vehículo y su conductor.',
};

export const CalendarView: React.FC = () => {
    const [tab, setTab] = useState<CalendarTab>('calendario');
    const [fleet, setFleet] = useState<FleetVehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);

    const loadCatalogs = () => Promise.all([
        api.fleet.list().then(setFleet).catch(() => setFleet([])),
        api.drivers.list().then(setDrivers).catch(() => setDrivers([])),
        api.thirdParties.list().then(setThirdParties).catch(() => setThirdParties([])),
    ]);
    useEffect(() => { loadCatalogs(); }, []);

    return (
        <div className="p-4 sm:p-6 h-full overflow-y-auto">
            {/* Las pestañas van en su propia fila para que no se muevan según el largo del texto de ayuda */}
            <div className="mb-5 space-y-3">
                <div>
                    <h2 className="text-2xl font-bold text-marga-wine font-display uppercase">Calendario</h2>
                    <p className="text-sm text-gray-500 mt-1">{TAB_HINTS[tab]}</p>
                </div>
                <div className="inline-flex max-w-full overflow-x-auto bg-white border border-marga-creamDark rounded-xl p-1">
                    {([['calendario', 'Calendario'], ['vehiculos', 'Vehículos'], ['conductores', 'Conductores'], ['terceros', 'Terceros']] as const).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => { setTab(value); if (value !== 'calendario') loadCatalogs(); }}
                            className={`shrink-0 whitespace-nowrap px-2.5 sm:px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${tab === value ? 'bg-marga-wine text-marga-cream' : 'text-marga-dark/60 hover:text-marga-wine'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {tab === 'calendario' && <MonthCalendar fleet={fleet} drivers={drivers} thirdParties={thirdParties} onCatalogsChanged={loadCatalogs} onGoToCatalog={setTab} />}
            {tab === 'vehiculos' && <VehiclesPanel fleet={fleet} onChanged={loadCatalogs} />}
            {tab === 'conductores' && <DriversPanel drivers={drivers} onChanged={loadCatalogs} />}
            {tab === 'terceros' && <ThirdPartiesPanel thirdParties={thirdParties} onChanged={loadCatalogs} />}
        </div>
    );
};

// ── Calendario mensual ────────────────────────────────────────────────────────

const MonthCalendar: React.FC<{
    fleet: FleetVehicle[];
    drivers: Driver[];
    thirdParties: ThirdParty[];
    onCatalogsChanged: () => Promise<unknown>;
    onGoToCatalog: (t: CalendarTab) => void;
}> = ({ fleet, drivers, thirdParties, onCatalogsChanged, onGoToCatalog }) => {
    const today = iso(new Date());
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState<{ quoteId: string; day: string } | null>(null);
    const [filterDriver, setFilterDriver] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterThird, setFilterThird] = useState('');
    const [onlyPending, setOnlyPending] = useState(false);

    // La grilla arranca el lunes de la semana del día 1 y termina el domingo de la última semana
    const days = useMemo(() => {
        const first = new Date(cursor);
        const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
        const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const end = new Date(last); end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
        return daysBetween(iso(start), iso(end));
    }, [cursor]);
    const weeks = useMemo(() => Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7)), [days]);

    // Se pide un margen de 2 semanas a cada lado para que las cotizaciones que cruzan
    // el borde del mes muestren todos sus días al abrirlas.
    const fetchEvents = () => {
        setError('');
        return api.calendar.list(addDays(days[0], -14), addDays(days[days.length - 1], 14))
            .then((data: CalendarEvent[]) => setEvents(data))
            .catch((e: Error) => { setEvents([]); setError(e.message || 'No se pudo cargar el calendario'); })
            .finally(() => setLoading(false));
    };
    useEffect(() => { setLoading(true); fetchEvents(); }, [days]);

    const cat: Catalogs = useMemo(() => ({
        fleetById: new Map<string, FleetVehicle>(fleet.map(v => [v.id, v])),
        driverById: new Map<string, Driver>(drivers.map(d => [d.id, d])),
        tpById: new Map<string, ThirdParty>(thirdParties.map(t => [t.id, t])),
    }), [fleet, drivers, thirdParties]);

    const clashIds = useMemo(() => {
        const ids = new Set<string>();
        for (const ev of events) if (findClashes(ev, ev.assignments, events).length) ids.add(ev.id);
        return ids;
    }, [events]);

    const allGroups = useMemo(() => groupByQuote(events), [events]);
    const groups = useMemo(() => allGroups.filter(g => {
        const evs = g.events;
        if (filterDriver && !evs.some(ev => ev.assignments.some(a => a.driver_id === filterDriver))) return false;
        if (filterVehicle && !evs.some(ev => ev.assignments.some(a => a.vehicle_id === filterVehicle))) return false;
        if (filterThird && !evs.some(ev => ev.assignments.some(a => a.third_party_id === filterThird))) return false;
        if (onlyPending && evs.every(eventDone)) return false;
        return true;
    }), [allGroups, filterDriver, filterVehicle, filterThird, onlyPending]);

    const monthPrefix = iso(cursor).slice(0, 7);
    const monthEvents = events.filter(e => e.day.startsWith(monthPrefix));
    const pendingCount = monthEvents.filter(e => !eventDone(e)).length;
    const monthGroups = groups.filter(g => g.start.slice(0, 7) <= monthPrefix && g.end.slice(0, 7) >= monthPrefix);
    const openGroup = open ? allGroups.find(g => g.quote_id === open.quoteId) || null : null;
    const move = (delta: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));

    // Un día de una cotización dentro de la barra
    const segment = (g: QuoteGroup, day: string, first: boolean, compact: boolean) => {
        const evs = g.byDay.get(day) || [];
        const st = dayStatus(evs, cat);
        const clash = evs.some(e => clashIds.has(e.id));
        return (
            <button
                key={day}
                onClick={() => setOpen({ quoteId: g.quote_id, day })}
                title={evs.length ? evs.map(e => `${e.hour || 'Sin hora'} · ${e.origin} → ${e.destination}`).join('\n') : 'Sin transfer este día'}
                className={`flex-1 min-w-0 text-left px-1.5 py-1 text-[11px] leading-tight hover:brightness-95 transition ${STATUS_STYLES[st].seg} ${first ? '' : 'border-l border-white/80'} ${clash ? 'outline outline-2 -outline-offset-2 outline-red-500' : ''}`}
            >
                {evs.length === 0 ? <span className="block text-center">—</span> : (
                    <>
                        {evs.slice(0, compact ? 1 : 2).map(ev => (
                            <span key={ev.id} className="flex items-center gap-1 font-bold truncate">
                                {clashIds.has(ev.id) && <AlertTriangle size={11} className="text-red-600 shrink-0" />}
                                {ev.hour && <span className="font-mono shrink-0">{ev.hour.slice(0, 5)}</span>}
                                <span className="truncate">{ev.destination || ev.origin}</span>
                            </span>
                        ))}
                        {evs.length > (compact ? 1 : 2) && <span className="block opacity-70">+{evs.length - (compact ? 1 : 2)} más</span>}
                        {!compact && evs.length === 1 && whoDoesIt(evs[0], cat) && <span className="block truncate opacity-75">{whoDoesIt(evs[0], cat)}</span>}
                    </>
                )}
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
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-marga-roseLight text-marga-wine">{pendingCount} transfer{pendingCount > 1 ? 's' : ''} sin asignar este mes</span>
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
                    <select value={filterThird} onChange={e => setFilterThird(e.target.value)} className={sel}>
                        <option value="">Todos los terceros</option>
                        {thirdParties.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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

            {/* Grilla mensual (tablet y escritorio): una fila por semana, una barra por cotización */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b border-marga-creamDark">
                    {WEEKDAYS.map(d => <div key={d} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">{d}</div>)}
                </div>
                {weeks.map((week, wi) => {
                    const { bars, lanes } = layoutWeek(week, groups);
                    return (
                        <div key={week[0]} className={`relative ${wi < weeks.length - 1 ? 'border-b border-marga-creamDark/70' : ''}`}>
                            {/* Fondo de los días */}
                            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                {week.map((day, i) => (
                                    <div key={day} className={`${i < 6 ? 'border-r border-marga-creamDark/70' : ''} ${day.startsWith(monthPrefix) ? '' : 'bg-gray-50/70'} ${day === today ? 'bg-marga-cream/60' : ''}`} />
                                ))}
                            </div>
                            <div className="relative grid grid-cols-7 min-h-[112px] pb-1.5" style={{ gridTemplateRows: `auto repeat(${Math.max(lanes, 1)}, auto)`, alignContent: 'start' }}>
                                {week.map((day, i) => (
                                    <div key={day} className="flex justify-end px-1.5 pt-1.5 pb-1" style={{ gridColumn: i + 1, gridRow: 1 }}>
                                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${day === today ? 'bg-marga-wine text-marga-cream' : day.startsWith(monthPrefix) ? 'text-marga-dark/70' : 'text-gray-300'}`}>{parseISO(day).getDate()}</span>
                                    </div>
                                ))}
                                {bars.map(b => {
                                    const startsHere = b.from === b.group.start;
                                    const endsHere = b.to === b.group.end;
                                    return (
                                        <div
                                            key={b.group.quote_id}
                                            style={{ gridColumn: `${b.col + 1} / span ${b.span}`, gridRow: b.lane + 2 }}
                                            className={`mb-1 border border-marga-creamDark bg-white overflow-hidden shadow-sm ${startsHere ? 'ml-1 rounded-l-lg' : 'border-l-0'} ${endsHere ? 'mr-1 rounded-r-lg' : 'border-r-0'}`}
                                        >
                                            <button
                                                onClick={() => setOpen({ quoteId: b.group.quote_id, day: b.from })}
                                                className="w-full text-left px-1.5 py-0.5 text-[11px] font-bold text-marga-wine truncate bg-white hover:bg-marga-cream"
                                                title={`${b.group.client_name} · ${quoteRef(b.group.quote_number)} · ${fmtRange(b.group.start, b.group.end)}`}
                                            >
                                                {!startsHere && '‹ '}{b.group.client_name || 'Sin cliente'} <span className="font-normal text-gray-400">{quoteRef(b.group.quote_number)} · {b.group.pax} pax</span>{!endsHere && ' ›'}
                                            </button>
                                            <div className="flex">
                                                {daysBetween(b.from, b.to).map((day, i) => segment(b.group, day, i === 0, false))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Agenda (celular): una tarjeta por cotización con sus días */}
            <div className="md:hidden space-y-3">
                {monthGroups.map(g => (
                    <div key={g.quote_id} className="bg-white rounded-xl border border-marga-creamDark overflow-hidden">
                        <button onClick={() => setOpen({ quoteId: g.quote_id, day: g.start })} className="w-full text-left px-3 py-2 border-b border-marga-creamDark">
                            <p className="font-bold text-marga-wine truncate">{g.client_name || 'Sin cliente'}</p>
                            <p className="text-xs text-gray-500">{fmtRange(g.start, g.end)} · {quoteRef(g.quote_number)} · {g.pax} pax</p>
                        </button>
                        <div className="divide-y divide-white">
                            {daysBetween(g.start, g.end).map(day => {
                                const evs = g.byDay.get(day) || [];
                                const st = dayStatus(evs, cat);
                                return (
                                    <button key={day} onClick={() => setOpen({ quoteId: g.quote_id, day })} className={`w-full text-left px-3 py-2 text-xs ${STATUS_STYLES[st].seg}`}>
                                        <span className="font-bold uppercase tracking-wide">{fmtDayLong(day)}</span>
                                        {evs.length === 0 && <span className="block">Sin transfer</span>}
                                        {evs.map(ev => (
                                            <span key={ev.id} className="block truncate">
                                                {clashIds.has(ev.id) && '⚠ '}{ev.hour ? `${ev.hour.slice(0, 5)} ` : ''}{ev.origin} → {ev.destination}{whoDoesIt(ev, cat) ? ` · ${whoDoesIt(ev, cat)}` : ''}
                                            </span>
                                        ))}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {!loading && monthGroups.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No hay transfers este mes.</p>}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                {(['none', 'partial', 'propio', 'rampa', 'tercero'] as DayStatus[]).map(s => (
                    <span key={s} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />{STATUS_STYLES[s].label}</span>
                ))}
                <span className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-600" />Vehículo o conductor superpuesto</span>
                {loading && <span className="ml-auto">Cargando...</span>}
                {!loading && monthEvents.length === 0 && !error && <span className="ml-auto hidden md:inline">No hay transfers aprobados este mes.</span>}
            </div>

            {openGroup && open && (
                <QuoteAssignModal
                    group={openGroup}
                    focusDay={open.day}
                    allEvents={events}
                    fleet={fleet}
                    drivers={drivers}
                    thirdParties={thirdParties}
                    cat={cat}
                    onCatalogsChanged={onCatalogsChanged}
                    onClose={() => setOpen(null)}
                    onSaved={() => { setOpen(null); fetchEvents(); }}
                />
            )}
        </div>
    );
};

// ── Asignar una cotización completa, día por día ──────────────────────────────

type SlotMode = 'propio' | 'tercero';
interface SlotState { slot: number; mode: SlotMode; vehicle_id: string; driver_id: string; third_party_id: string; external_provider: string }

const toAssignments = (slots: SlotState[]): CalendarAssignment[] =>
    slots.map(s => (s.mode === 'tercero'
        ? { slot: s.slot, third_party_id: s.third_party_id || null, external_provider: s.third_party_id ? null : s.external_provider || null }
        : { slot: s.slot, vehicle_id: s.vehicle_id || null, driver_id: s.driver_id || null }));

const initialSlots = (ev: CalendarEvent): SlotState[] =>
    ev.vehicles.map((req, i) => {
        const a = ev.assignments.find(x => x.slot === i);
        const isThird = !!(a?.third_party_id || a?.external_provider || (req.contracted && !a?.vehicle_id && !a?.driver_id));
        return {
            slot: i, mode: isThird ? 'tercero' : 'propio',
            vehicle_id: a?.vehicle_id || '', driver_id: a?.driver_id || '',
            third_party_id: a?.third_party_id || '', external_provider: a?.external_provider || '',
        };
    });

const QuoteAssignModal: React.FC<{
    group: QuoteGroup;
    focusDay: string;
    allEvents: CalendarEvent[];
    fleet: FleetVehicle[];
    drivers: Driver[];
    thirdParties: ThirdParty[];
    cat: Catalogs;
    onCatalogsChanged: () => Promise<unknown>;
    onClose: () => void;
    onSaved: () => void;
}> = ({ group, focusDay, allEvents, fleet, drivers, thirdParties, cat, onCatalogsChanged, onClose, onSaved }) => {
    const [slotsByEvent, setSlotsByEvent] = useState<Record<string, SlotState[]>>(() =>
        Object.fromEntries(group.events.map(ev => [ev.id, initialSlots(ev)])));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const multiDay = group.start !== group.end;

    useEffect(() => { dayRefs.current[focusDay]?.scrollIntoView({ block: 'start' }); }, []);

    // Las superposiciones se calculan con lo que se está editando, no con lo guardado
    const effectiveAll = useMemo(() => allEvents.map(e =>
        slotsByEvent[e.id] ? { ...e, assignments: toAssignments(slotsByEvent[e.id]) } : e), [allEvents, slotsByEvent]);

    const update = (evId: string, i: number, patch: Partial<SlotState>) =>
        setSlotsByEvent(prev => ({ ...prev, [evId]: prev[evId].map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

    // Copia la asignación de un transfer a los demás transfers de la cotización
    const copyToAll = (fromId: string) => setSlotsByEvent(prev => {
        const source = prev[fromId];
        const next = { ...prev };
        for (const ev of group.events) {
            if (ev.id === fromId) continue;
            next[ev.id] = prev[ev.id].map((s, i) => (source[i] ? { ...source[i], slot: s.slot } : s));
        }
        return next;
    });

    const save = async () => {
        setSaving(true); setError('');
        try {
            await api.calendar.assign(group.events.map(ev => ({
                quote_id: ev.quote_id, transfer_key: ev.transfer_key, origin: ev.origin, destination: ev.destination,
                slots: toAssignments(slotsByEvent[ev.id]),
            })));
            onSaved();
        } catch (e) {
            setError((e as Error).message || 'No se pudo guardar');
            setSaving(false);
        }
    };

    // Vehículos activos, primero los del tipo pedido; se mantiene el ya elegido aunque esté dado de baja
    const vehicleOptions = (type: QuoteVehicleType, current: string) =>
        fleet
            .filter(v => v.is_active !== 0 || v.id === current)
            .sort((a, b) => Number(b.vehicle_type === type) - Number(a.vehicle_type === type) || a.plate.localeCompare(b.plate));
    const driverOptions = (current: string) => drivers.filter(d => d.is_active !== 0 || d.id === current);

    const clashText = (ev: CalendarEvent, c: Clash) =>
        c.other.id === ev.id ? 'está elegido dos veces en este transfer'
            : `ya tiene ${c.other.hour ? `a las ${c.other.hour.slice(0, 5)} ` : 'ese día '}${c.other.origin} → ${c.other.destination} (${c.other.client_name})`;

    const dayList = daysBetween(group.start, group.end);

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="border-b border-marga-creamDark px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-marga-dark/40">
                            {multiDay ? `${fmtDayLong(group.start)} → ${fmtDayLong(group.end)}` : fmtDayLong(group.start)}
                        </p>
                        <h3 className="text-xl font-bold text-marga-wine leading-tight truncate">{group.client_name || 'Sin cliente'}</h3>
                        <p className="text-sm text-gray-500 flex flex-wrap gap-x-3">
                            <span>Cotización {quoteRef(group.quote_number)}</span>
                            <span className="flex items-center gap-1"><Users size={13} />{group.pax} pax</span>
                            {group.client_phone && <span className="flex items-center gap-1"><Phone size={13} />{group.client_phone}</span>}
                        </p>
                        {group.description && <p className="text-sm text-marga-dark/70 mt-1">{group.description}</p>}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Cerrar"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto px-6 py-5 space-y-6">
                    {dayList.map(day => {
                        const evs = group.byDay.get(day) || [];
                        return (
                            <div key={day} ref={el => { dayRefs.current[day] = el; }} className="scroll-mt-2">
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${day === focusDay ? 'text-marga-wine' : 'text-gray-500'}`}>{fmtDayLong(day)}</p>
                                {evs.length === 0 && <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">Sin transfers este día.</p>}
                                <div className="space-y-3">
                                    {evs.map(ev => (
                                        <TransferCard
                                            key={ev.id}
                                            ev={ev}
                                            slots={slotsByEvent[ev.id]}
                                            canCopy={group.events.length > 1}
                                            clashes={findClashes(ev, toAssignments(slotsByEvent[ev.id]), effectiveAll)}
                                            clashText={c => clashText(ev, c)}
                                            cat={cat}
                                            thirdParties={thirdParties}
                                            vehicleOptions={vehicleOptions}
                                            driverOptions={driverOptions}
                                            onUpdate={(i, patch) => update(ev.id, i, patch)}
                                            onCopy={() => copyToAll(ev.id)}
                                            onCatalogsChanged={onCatalogsChanged}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {error && <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}
                </div>

                <div className="border-t border-marga-creamDark px-6 py-4 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar asignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransferCard: React.FC<{
    ev: CalendarEvent;
    slots: SlotState[];
    canCopy: boolean;
    clashes: Clash[];
    clashText: (c: Clash) => string;
    cat: Catalogs;
    thirdParties: ThirdParty[];
    vehicleOptions: (type: QuoteVehicleType, current: string) => FleetVehicle[];
    driverOptions: (current: string) => Driver[];
    onUpdate: (i: number, patch: Partial<SlotState>) => void;
    onCopy: () => void;
    onCatalogsChanged: () => Promise<unknown>;
}> = ({ ev, slots, canCopy, clashes, clashText, cat, thirdParties, vehicleOptions, driverOptions, onUpdate, onCopy, onCatalogsChanged }) => {
    const own = ev.vehicles.map((v, i) => ({ v, s: slots[i] })).filter(x => x.s.mode === 'propio');
    const assignedCapacity = own.reduce((sum, x) => sum + (cat.fleetById.get(x.s.vehicle_id)?.capacity || 0), 0);
    const capacityShort = own.length === slots.length && own.every(x => x.s.vehicle_id) && assignedCapacity > 0 && assignedCapacity < ev.pax;

    return (
        <div className="border border-marga-creamDark rounded-xl overflow-hidden">
            <div className="bg-marga-cream/50 px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-marga-dark">{ev.origin} → {ev.destination}</span>
                <span className="flex items-center gap-1 text-gray-500"><Clock size={13} />{ev.hour ? ev.hour.slice(0, 5) : 'Sin hora'}</span>
                <span className="flex items-center gap-1 text-gray-500"><Users size={13} />{ev.pax} pax</span>
                <span className="text-gray-500">{ev.is_full_day ? 'Día completo' : ev.duration_hours ? `${ev.duration_hours} h` : 'Traslado'}</span>
                {canCopy && (
                    <button onClick={onCopy} className="ml-auto text-xs font-bold text-marga-wine hover:underline flex items-center gap-1" title="Usar esta misma asignación en los demás transfers de la cotización">
                        <Copy size={12} />Copiar a todos los días
                    </button>
                )}
            </div>
            {ev.notes && <p className="px-4 pt-2 text-xs text-marga-dark/70"><span className="font-semibold">Notas:</span> {ev.notes}</p>}

            <div className="p-4 space-y-4">
                {ev.vehicles.map((req, i) => {
                    const s = slots[i];
                    const chosen = cat.fleetById.get(s.vehicle_id);
                    const vClash = s.mode === 'propio' && s.vehicle_id ? clashes.filter(c => c.kind === 'vehicle' && c.id === s.vehicle_id) : [];
                    const dClash = s.mode === 'propio' && s.driver_id ? clashes.filter(c => c.kind === 'driver' && c.id === s.driver_id) : [];
                    const done = slotDone(toAssignments([s])[0]);
                    return (
                        <div key={i}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="text-sm font-bold text-marga-dark">
                                    {ev.vehicles.length > 1 ? `Vehículo ${i + 1}: ` : 'Pedido: '}{VEHICLE_TYPE_LABELS[req.type] || req.type}
                                </p>
                                {req.contracted && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Cotizado como contratado</span>}
                                {done && <CheckCircle2 size={16} className="text-green-600" />}
                                <div className="ml-auto flex bg-gray-100 rounded-lg p-0.5">
                                    {(['propio', 'tercero'] as SlotMode[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => onUpdate(i, { mode: m })}
                                            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${s.mode === m ? (m === 'tercero' ? 'bg-sky-500 text-white' : 'bg-marga-wine text-marga-cream') : 'text-gray-500'}`}
                                        >
                                            {m === 'propio' ? <><Truck size={12} />Propio</> : <><Handshake size={12} />Tercero</>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {s.mode === 'tercero' ? (
                                <ThirdPartyPicker
                                    value={s.third_party_id}
                                    legacy={s.external_provider}
                                    thirdParties={thirdParties}
                                    onChange={id => onUpdate(i, { third_party_id: id })}
                                    onCatalogsChanged={onCatalogsChanged}
                                />
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <label className="block">
                                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Truck size={12} />Vehículo</span>
                                        <select className={inp} value={s.vehicle_id} onChange={e => onUpdate(i, { vehicle_id: e.target.value })}>
                                            <option value="">Sin asignar</option>
                                            {vehicleOptions(req.type, s.vehicle_id).map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.plate} · {[v.brand, v.model].filter(Boolean).join(' ')}{v.capacity ? ` (${v.capacity} pax)` : ''}{hasRamp(v) ? ' · rampa' : ''}
                                                    {v.status && v.status !== 'operativo' ? ` – ${VEHICLE_STATUS_LABELS[v.status]}` : ''}{v.is_active === 0 ? ' – dado de baja' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><User size={12} />Conductor</span>
                                        <select className={inp} value={s.driver_id} onChange={e => onUpdate(i, { driver_id: e.target.value })}>
                                            <option value="">Sin asignar</option>
                                            {driverOptions(s.driver_id).map(d => <option key={d.id} value={d.id}>{driverName(d)}{d.is_active === 0 ? ' – dado de baja' : ''}</option>)}
                                        </select>
                                    </label>
                                </div>
                            )}
                            {s.mode === 'propio' && chosen && chosen.status && chosen.status !== 'operativo' && (
                                <Warn>{vehicleName(chosen)} figura como {VEHICLE_STATUS_LABELS[chosen.status].toLowerCase()}.</Warn>
                            )}
                            {s.mode === 'propio' && chosen && chosen.vehicle_type && chosen.vehicle_type !== req.type && (
                                <p className="mt-2 text-xs text-gray-500">Se pidió {VEHICLE_TYPE_LABELS[req.type].toLowerCase()} y elegiste {VEHICLE_TYPE_LABELS[chosen.vehicle_type].toLowerCase()}.</p>
                            )}
                            {vClash.map((c, k) => <Warn key={`v${k}`}>{vehicleName(cat.fleetById.get(c.id))} {clashText(c)}.</Warn>)}
                            {dClash.map((c, k) => <Warn key={`d${k}`}>{driverName(cat.driverById.get(c.id))} {clashText(c)}.</Warn>)}
                        </div>
                    );
                })}
                {capacityShort && <Warn>Los vehículos elegidos suman {assignedCapacity} lugares y el transfer es de {ev.pax} pax.</Warn>}
            </div>
        </div>
    );
};

// Selector de tercero con alta rápida (nombre y teléfono) sin salir del calendario
const ThirdPartyPicker: React.FC<{
    value: string;
    legacy: string;
    thirdParties: ThirdParty[];
    onChange: (id: string) => void;
    onCatalogsChanged: () => Promise<unknown>;
}> = ({ value, legacy, thirdParties, onChange, onCatalogsChanged }) => {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const create = async () => {
        if (!name.trim()) { setError('Poné el nombre'); return; }
        setSaving(true); setError('');
        try {
            const res = await api.thirdParties.create({ name: name.trim(), phone: phone.trim() });
            await onCatalogsChanged();
            onChange(res.id);
            setAdding(false); setName(''); setPhone('');
        } catch (e) { setError((e as Error).message || 'No se pudo guardar'); }
        setSaving(false);
    };

    const options = thirdParties.filter(t => t.is_active !== 0 || t.id === value);
    const current = thirdParties.find(t => t.id === value);

    return (
        <div>
            <div className="flex gap-2">
                <select className={inp} value={value} onChange={e => onChange(e.target.value)}>
                    <option value="">Elegí el tercero</option>
                    {options.map(t => <option key={t.id} value={t.id}>{t.name}{t.phone ? ` · ${t.phone}` : ''}</option>)}
                </select>
                <button onClick={() => setAdding(a => !a)} className="shrink-0 px-3 rounded-lg text-xs font-bold border border-sky-300 text-sky-700 hover:bg-sky-50 flex items-center gap-1"><Plus size={13} />Nuevo</button>
            </div>
            {current?.phone && <p className="mt-1 text-xs text-gray-500 flex items-center gap-1"><Phone size={11} />{current.phone}</p>}
            {!value && legacy && <p className="mt-1 text-xs text-gray-500">Anotado antes como: {legacy}</p>}
            {adding && (
                <div className="mt-2 p-3 rounded-lg bg-sky-50 border border-sky-200 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                    <input className={inp} placeholder="Nombre del tercero" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    <input className={inp} placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
                    <button onClick={create} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50">{saving ? '...' : 'Agregar'}</button>
                    {error && <p className="sm:col-span-3 text-xs text-red-600">{error}</p>}
                </div>
            )}
        </div>
    );
};

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

// ── Terceros ──────────────────────────────────────────────────────────────────

const fmtDate = (s?: string | null) => { if (!s) return '-'; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };

const ThirdPartiesPanel: React.FC<{ thirdParties: ThirdParty[]; onChanged: () => void }> = ({ thirdParties, onChanged }) => {
    const [editing, setEditing] = useState<Partial<ThirdParty> | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const totalJobs = thirdParties.reduce((s, t) => s + (t.jobs || 0), 0);
    const top = [...thirdParties].sort((a, b) => (b.jobs || 0) - (a.jobs || 0))[0];

    return (
        <div>
            <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="bg-white rounded-xl border border-marga-creamDark px-4 py-3">
                    <p className="text-[11px] text-marga-dark/40 uppercase font-semibold">Trabajos tercerizados</p>
                    <p className="text-lg font-bold text-marga-dark">{totalJobs}</p>
                </div>
                {top && (top.jobs || 0) > 0 && (
                    <div className="bg-white rounded-xl border border-marga-creamDark px-4 py-3">
                        <p className="text-[11px] text-marga-dark/40 uppercase font-semibold">Más contratado</p>
                        <p className="text-lg font-bold text-sky-700">{top.name} <span className="text-sm font-semibold text-gray-400">· {top.jobs} trabajos</span></p>
                    </div>
                )}
                <button onClick={() => setEditing({ name: '', phone: '', notes: '', is_active: 1 })} className="ml-auto px-4 py-2 rounded-lg text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight flex items-center gap-1.5"><Plus size={16} />Agregar tercero</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3 text-center">Trabajos</th>
                            <th className="px-4 py-3">Último</th>
                            <th className="px-4 py-3">Próximo</th>
                            <th className="px-4 py-3">Observaciones</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {thirdParties.map(t => (
                            <React.Fragment key={t.id}>
                                <tr onClick={() => setExpanded(e => (e === t.id ? null : t.id))} className={`border-t border-gray-100 cursor-pointer hover:bg-marga-cream/60 ${t.is_active === 0 ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3 font-bold text-marga-dark whitespace-nowrap">
                                        <span className="flex items-center gap-1.5">
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded === t.id ? '' : '-rotate-90'}`} />
                                            {t.name}{t.is_active === 0 && <span className="text-xs font-semibold text-gray-400">Dado de baja</span>}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">{t.phone || '-'}</td>
                                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">{t.jobs || 0}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(t.last_job_day)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(t.next_job_day)}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.notes || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={e => { e.stopPropagation(); setEditing(t); }} className="p-1.5 rounded-lg hover:bg-marga-cream text-marga-wine" aria-label="Editar"><Edit2 size={15} /></button>
                                    </td>
                                </tr>
                                {expanded === t.id && (
                                    <tr className="bg-gray-50/60"><td colSpan={7} className="px-4 py-3"><ThirdPartyJobs id={t.id} /></td></tr>
                                )}
                            </React.Fragment>
                        ))}
                        {thirdParties.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Todavía no hay terceros cargados. También se pueden agregar desde el calendario al asignar un transfer.</td></tr>}
                    </tbody>
                </table>
            </div>
            {editing && <ThirdPartyForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
        </div>
    );
};

const ThirdPartyJobs: React.FC<{ id: string }> = ({ id }) => {
    const [jobs, setJobs] = useState<ThirdPartyJob[] | null>(null);
    useEffect(() => { api.thirdParties.jobs(id).then(setJobs).catch(() => setJobs([])); }, [id]);
    if (!jobs) return <p className="text-xs text-gray-400">Cargando...</p>;
    if (jobs.length === 0) return <p className="text-xs text-gray-400">Todavía no tiene trabajos asignados.</p>;
    return (
        <table className="w-full text-xs">
            <thead className="text-gray-400 uppercase text-[10px] tracking-wider">
                <tr><th className="text-left py-1 pr-3">Fecha</th><th className="text-left py-1 pr-3">Recorrido</th><th className="text-left py-1 pr-3">Cliente</th><th className="text-center py-1 pr-3">Pax</th><th className="text-center py-1">Vehículos</th></tr>
            </thead>
            <tbody>
                {jobs.map(j => (
                    <tr key={`${j.quote_id}-${j.transfer_key}`} className="border-t border-gray-200/70">
                        <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(j.day)}</td>
                        <td className="py-1.5 pr-3">{j.origin || '?'} → {j.destination || '?'}</td>
                        <td className="py-1.5 pr-3">{j.client_name || '-'} <span className="text-gray-400">{quoteRef(j.quote_number)}</span></td>
                        <td className="py-1.5 pr-3 text-center">{j.pax || '-'}</td>
                        <td className="py-1.5 text-center">{j.vehicles}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ThirdPartyForm: React.FC<{ initial: Partial<ThirdParty>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const [f, setF] = useState<Partial<ThirdParty>>(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (patch: Partial<ThirdParty>) => setF(prev => ({ ...prev, ...patch }));

    const save = async () => {
        if (!f.name?.trim()) { setError('El nombre es obligatorio'); return; }
        setSaving(true); setError('');
        const data = { name: f.name.trim(), phone: f.phone || '', notes: f.notes || '', is_active: f.is_active === 0 ? 0 : 1 };
        try {
            if (f.id) await api.thirdParties.update(f.id, data); else await api.thirdParties.create(data);
            onSaved();
        } catch (e) { setError((e as Error).message || 'No se pudo guardar'); setSaving(false); }
    };

    return (
        <FormModal title={f.id ? 'Editar tercero' : 'Nuevo tercero'} onClose={onClose} onSave={save} saving={saving} error={error}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *"><input className={inp} value={f.name || ''} onChange={e => set({ name: e.target.value })} placeholder="Remises Cuyo" /></Field>
                <Field label="Teléfono"><input className={inp} value={f.phone || ''} onChange={e => set({ phone: e.target.value })} /></Field>
            </div>
            <Field label="Observaciones"><textarea className={inp} rows={2} value={f.notes || ''} onChange={e => set({ notes: e.target.value })} placeholder="Qué vehículos tiene, tarifas, contacto..." /></Field>
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
