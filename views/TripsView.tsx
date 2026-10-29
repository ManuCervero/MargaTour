import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, AlertTriangle, RefreshCw, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';
import type { Trip, TripCost, TripCostCategory, TripPayment, PaymentMethod, TransferAccount } from '../types';
import { PAYMENT_METHODS, TRANSFER_ACCOUNTS } from '../components/AddIncomeModal';

// Hoja VIAJES del Excel: un viaje por cotización aprobada, en pesos, con sus costos
// previstos y los cobros/pagos que se van registrando.

const fmtARS = (n: number) => `$${Math.round(n || 0).toLocaleString('es-AR')}`;

const fmtDate = (iso: string) => {
    if (!iso) return '-';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CATEGORY_LABELS: Record<TripCostCategory, string> = {
    transfer: 'Transfer',
    viaticos: 'Viáticos',
    terceros: 'Transfer terceros',
    actividad: 'Actividad',
    comision: 'Comisión',
    extra: 'Extra',
};

const costLabel = (c: TripCost) =>
    c.category === 'actividad' || c.category === 'extra' ? `${CATEGORY_LABELS[c.category]} — ${c.description}` : c.description || CATEGORY_LABELS[c.category];

const PAYMENT_LABELS =Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label])) as Record<string, string>;
const ACCOUNT_LABELS = Object.fromEntries(TRANSFER_ACCOUNTS.map(a => [a.value, a.label])) as Record<string, string>;

const inp = "w-full px-3 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm";

interface TripTotals {
    presupuestado: number;
    transfer: number;
    viaticos: number;
    terceros: number;
    actividades: number;
    comision: number;
    costos: number;
    ganancia: number;
    cobrado: number;
    pagado: number;
}

function tripTotals(t: Trip): TripTotals {
    const c = t.costs_by_category || {};
    const transfer = c.transfer || 0;
    const viaticos = c.viaticos || 0;
    const terceros = c.terceros || 0;
    const actividades = (c.actividad || 0) + (c.extra || 0);
    const comision = c.comision || 0;
    const costos = transfer + viaticos + terceros + actividades + comision;
    const presupuestado = t.amount_ars || 0;
    return {
        presupuestado, transfer, viaticos, terceros, actividades, comision, costos,
        ganancia: presupuestado - costos,
        cobrado: t.cobrado_ars || 0,
        pagado: t.pagado_ars || 0,
    };
}

function sumTotals(list: TripTotals[]): TripTotals {
    const z: TripTotals = { presupuestado: 0, transfer: 0, viaticos: 0, terceros: 0, actividades: 0, comision: 0, costos: 0, ganancia: 0, cobrado: 0, pagado: 0 };
    for (const t of list) for (const k of Object.keys(z) as (keyof TripTotals)[]) z[k] += t[k];
    return z;
}

function collectStatus(t: TripTotals): { label: string; cls: string } {
    if (t.cobrado <= 0) return { label: 'Sin cobrar', cls: 'bg-gray-100 text-gray-500' };
    if (t.cobrado >= t.presupuestado) return { label: 'Cobrado', cls: 'bg-green-100 text-green-700' };
    return { label: 'Parcial', cls: 'bg-amber-100 text-amber-700' };
}

// ── Formulario de movimiento (cobro o pago) ───────────────────────────────────

const MovementForm: React.FC<{
    type: 'ingreso' | 'egreso';
    costs: TripCost[];
    defaultCostId?: string;
    suggestedAmount: (costId?: string) => number;
    onSave: (p: Partial<TripPayment>) => Promise<void>;
    onCancel: () => void;
}> = ({ type, costs, defaultCostId, suggestedAmount, onSave, onCancel }) => {
    const [costId, setCostId] = useState<string | undefined>(defaultCostId);
    const [amount, setAmount] = useState<number>(Math.max(suggestedAmount(defaultCostId), 0));
    const [date, setDate] = useState(todayISO());
    const [method, setMethod] = useState<PaymentMethod>('transferencia');
    const [account, setAccount] = useState<TransferAccount | ''>('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const isEgreso = type === 'egreso';

    const submit = async () => {
        if (!amount || amount <= 0) return;
        setSaving(true);
        try {
            await onSave({
                type, amount_ars: amount, date, payment_method: method,
                transfer_account: method === 'transferencia' && account ? account : undefined,
                notes: notes || undefined, cost_id: isEgreso ? costId || null : null,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`border rounded-xl p-4 mt-3 ${isEgreso ? 'bg-red-50/60 border-red-200' : 'bg-green-50/60 border-green-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isEgreso ? 'text-red-700' : 'text-green-700'}`}>
                {isEgreso ? 'Registrar pago' : 'Registrar cobro del cliente'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {isEgreso && (
                    <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Costo</label>
                        <select
                            value={costId || ''}
                            onChange={e => { const v = e.target.value || undefined; setCostId(v); setAmount(Math.max(suggestedAmount(v), 0)); }}
                            className={inp}
                        >
                            <option value="">Otro gasto del viaje</option>
                            {costs.map(c => <option key={c.id} value={c.id}>{costLabel(c)}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Monto $</label>
                    <input type="number" min={0} value={amount || ''} onChange={e => setAmount(Math.ceil(parseFloat(e.target.value) || 0))} className={inp} autoFocus />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Fecha</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Forma de pago</label>
                    <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className={inp}>
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                {method === 'transferencia' && (
                    <div>
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Cuenta</label>
                        <select value={account} onChange={e => setAccount(e.target.value as TransferAccount)} className={inp}>
                            <option value="">Seleccionar...</option>
                            {TRANSFER_ACCOUNTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                    </div>
                )}
                <div className={method === 'transferencia' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Observación</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder={isEgreso ? 'Ej: pagado a Fer' : 'Ej: seña 30%'} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-marga-creamDark rounded-lg">Cancelar</button>
                <button
                    onClick={submit}
                    disabled={saving || !amount}
                    className={`px-4 py-1.5 text-sm font-bold text-white rounded-lg disabled:opacity-50 ${isEgreso ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`}
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};

// ── Detalle de un viaje ───────────────────────────────────────────────────────

const TripModal: React.FC<{ tripId: string; onClose: () => void; onChanged: () => void }> = ({ tripId, onClose, onChanged }) => {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [form, setForm] = useState<{ type: 'ingreso' | 'egreso'; costId?: string } | null>(null);
    const [editing, setEditing] = useState(false);
    const [draftCosts, setDraftCosts] = useState<TripCost[]>([]);
    const [draftAmount, setDraftAmount] = useState(0);
    const [busy, setBusy] = useState(false);

    const load = () => api.trips.get(tripId).then((t: Trip) => setTrip(t)).catch(() => {});
    useEffect(() => { load(); }, [tripId]);

    if (!trip) {
        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const costs = trip.costs || [];
    const payments = trip.payments || [];
    const cobros = payments.filter(p => p.type === 'ingreso');
    const egresos = payments.filter(p => p.type === 'egreso');
    const paidByCost = (id?: string) => egresos.filter(p => (p.cost_id || undefined) === id).reduce((s, p) => s + (p.amount_ars || 0), 0);
    const totalCostos = costs.reduce((s, c) => s + (c.amount_ars || 0), 0);
    const cobrado = cobros.reduce((s, p) => s + (p.amount_ars || 0), 0);
    const pagado = egresos.reduce((s, p) => s + (p.amount_ars || 0), 0);
    const porCobrar = Math.max(trip.amount_ars - cobrado, 0);
    const porPagar = costs.reduce((s, c) => s + Math.max((c.amount_ars || 0) - paidByCost(c.id), 0), 0);
    const ganancia = trip.amount_ars - totalCostos;
    const sinAsignar = egresos.filter(p => !p.cost_id || !costs.some(c => c.id === p.cost_id));

    const refresh = async () => { await load(); onChanged(); };

    const savePayment = async (p: Partial<TripPayment>) => {
        await api.trips.addPayment(trip.id, p);
        setForm(null);
        await refresh();
    };

    const deletePayment = async (p: TripPayment) => {
        if (!p.id || !confirm(`¿Borrar el ${p.type === 'ingreso' ? 'cobro' : 'pago'} de ${fmtARS(p.amount_ars)}?`)) return;
        await api.trips.deletePayment(trip.id, p.id);
        await refresh();
    };

    const resync = async () => {
        if (!confirm('Se van a traer de nuevo los montos de la cotización. Los cobros y pagos registrados se mantienen. ¿Continuar?')) return;
        setBusy(true);
        try { await api.trips.resync(trip.id); await refresh(); } finally { setBusy(false); }
    };

    const startEdit = () => {
        setDraftCosts(costs.map(c => ({ ...c })));
        setDraftAmount(trip.amount_ars);
        setEditing(true);
        setForm(null);
    };

    const saveEdit = async () => {
        setBusy(true);
        try {
            await api.trips.saveCosts(trip.id, { costs: draftCosts, amount_ars: draftAmount });
            setEditing(false);
            await refresh();
        } finally { setBusy(false); }
    };

    const movementLine = (p: TripPayment) => (
        <div key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm group">
            <div className="min-w-0">
                <span className="text-gray-500 mr-2">{fmtDate(p.date)}</span>
                <span className="text-gray-700">{PAYMENT_LABELS[p.payment_method] || p.payment_method}</span>
                {p.transfer_account && <span className="text-gray-400"> · {ACCOUNT_LABELS[p.transfer_account] || p.transfer_account}</span>}
                {p.notes && <span className="text-gray-400"> · {p.notes}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className={`font-mono font-semibold ${p.type === 'ingreso' ? 'text-green-700' : 'text-red-600'}`}>{fmtARS(p.amount_ars)}</span>
                <button onClick={() => deletePayment(p)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Borrar">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    const stat = (label: string, value: number, cls = 'text-marga-dark') => (
        <div>
            <p className="text-[11px] text-marga-dark/40 uppercase font-semibold">{label}</p>
            <p className={`font-mono font-bold ${cls}`}>{fmtARS(value)}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-marga-creamDark px-6 py-4 flex items-start justify-between gap-4 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-marga-wine">{trip.client_name || 'Sin nombre'}</h3>
                        <p className="text-sm text-gray-500">
                            {fmtDate(trip.date)} · {trip.reference || 'Sin cotización'}{trip.concept && trip.concept !== `Cotización ${trip.reference}` ? ` · ${trip.concept}` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-marga-dark"><X size={20} /></button>
                </div>

                <div className="p-6">
                    {(!!trip.quote_changed || (trip.quote_status && trip.quote_status !== 'approved')) && (
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                            <p className="text-sm text-amber-800 flex items-center gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                {trip.quote_status && trip.quote_status !== 'approved'
                                    ? 'La cotización ya no está aprobada, pero este viaje tiene movimientos registrados.'
                                    : 'La cotización cambió después de registrar movimientos o editar los costos.'}
                            </p>
                            {trip.quote_status === 'approved' && (
                                <button onClick={resync} disabled={busy} className="flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline disabled:opacity-50">
                                    <RefreshCw size={13} /> Actualizar desde la cotización
                                </button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-marga-cream/60 border border-marga-creamDark rounded-xl p-4 mb-6">
                        {stat('Presupuestado', trip.amount_ars)}
                        {stat('Costos', totalCostos)}
                        {stat('Ganancia', ganancia, ganancia >= 0 ? 'text-marga-wine' : 'text-red-600')}
                        {stat('Por cobrar', porCobrar, porCobrar > 0 ? 'text-amber-700' : 'text-green-700')}
                        {stat('Cobrado', cobrado, 'text-green-700')}
                        {stat('Pagado', pagado, 'text-red-600')}
                        {stat('Por pagar', porPagar, porPagar > 0 ? 'text-amber-700' : 'text-green-700')}
                    </div>

                    {/* Cobros */}
                    <section className="mb-7">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-marga-wine uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={15} /> Cobros del cliente</h4>
                            {!editing && (
                                <button onClick={() => setForm({ type: 'ingreso' })} className="flex items-center gap-1 text-xs font-bold text-green-700 hover:underline">
                                    <Plus size={14} /> Registrar cobro
                                </button>
                            )}
                        </div>
                        {cobros.length === 0 && form?.type !== 'ingreso' && (
                            <p className="text-sm text-gray-400 py-3">Todavía no se registró ningún cobro.</p>
                        )}
                        <div className="divide-y divide-gray-100">{cobros.map(movementLine)}</div>
                        {form?.type === 'ingreso' && (
                            <MovementForm type="ingreso" costs={costs} suggestedAmount={() => porCobrar} onSave={savePayment} onCancel={() => setForm(null)} />
                        )}
                    </section>

                    {/* Costos */}
                    <section>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-marga-wine uppercase tracking-wider flex items-center gap-1.5"><TrendingDown size={15} /> Costos</h4>
                            {!editing ? (
                                <div className="flex gap-4">
                                    <button onClick={startEdit} className="flex items-center gap-1 text-xs font-bold text-marga-dark/60 hover:underline">
                                        <Edit2 size={13} /> Editar costos
                                    </button>
                                    <button onClick={() => setForm({ type: 'egreso' })} className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                                        <Plus size={14} /> Registrar pago
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {editing ? (
                            <div className="border border-marga-creamDark rounded-xl p-4">
                                <div className="mb-4 max-w-xs">
                                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Presupuestado $</label>
                                    <input type="number" min={0} value={draftAmount || ''} onChange={e => setDraftAmount(Math.ceil(parseFloat(e.target.value) || 0))} className={inp} />
                                </div>
                                {draftCosts.map((c, i) => (
                                    <div key={c.id || `new-${i}`} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                        <select
                                            value={c.category}
                                            onChange={e => setDraftCosts(d => d.map((x, j) => j === i ? { ...x, category: e.target.value as TripCostCategory } : x))}
                                            className={inp + ' col-span-4 sm:col-span-3'}
                                        >
                                            {(Object.keys(CATEGORY_LABELS) as TripCostCategory[]).map(k => <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>)}
                                        </select>
                                        <input
                                            value={c.description}
                                            onChange={e => setDraftCosts(d => d.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                                            className={inp + ' col-span-8 sm:col-span-5'} placeholder="Descripción"
                                        />
                                        <input
                                            type="number" min={0} value={c.amount_ars || ''}
                                            onChange={e => setDraftCosts(d => d.map((x, j) => j === i ? { ...x, amount_ars: Math.ceil(parseFloat(e.target.value) || 0) } : x))}
                                            className={inp + ' col-span-10 sm:col-span-3'} placeholder="0"
                                        />
                                        <button
                                            onClick={() => setDraftCosts(d => d.filter((_, j) => j !== i))}
                                            className="col-span-2 sm:col-span-1 flex justify-center text-gray-300 hover:text-red-500"
                                            title="Quitar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setDraftCosts(d => [...d, { category: 'actividad', description: '', amount_ars: 0 }])}
                                    className="flex items-center gap-1 text-xs font-bold text-marga-wine hover:underline mt-2"
                                >
                                    <Plus size={14} /> Agregar costo
                                </button>
                                <p className="text-xs text-gray-400 mt-3">Después de editar a mano, los cambios en la cotización ya no pisan estos montos (se avisa y se pueden traer con "Actualizar desde la cotización").</p>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-marga-creamDark rounded-lg">Cancelar</button>
                                    <button onClick={saveEdit} disabled={busy} className="px-4 py-1.5 text-sm font-bold text-white bg-marga-wine hover:bg-marga-wineLight rounded-lg disabled:opacity-50">
                                        {busy ? 'Guardando...' : 'Guardar costos'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="border border-marga-creamDark rounded-xl overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Costo</th>
                                                <th className="px-4 py-2 text-right">Previsto</th>
                                                <th className="px-4 py-2 text-right">Pagado</th>
                                                <th className="px-4 py-2 text-right">Falta</th>
                                                <th className="px-4 py-2" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {costs.map(c => {
                                                const paid = paidByCost(c.id);
                                                const falta = Math.max((c.amount_ars || 0) - paid, 0);
                                                const costPayments = egresos.filter(p => p.cost_id === c.id);
                                                return (
                                                    <React.Fragment key={c.id}>
                                                        <tr>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-[11px] font-semibold uppercase text-marga-dark/40 mr-2">{CATEGORY_LABELS[c.category]}</span>
                                                                <span className="text-gray-800">{c.category === 'actividad' || c.category === 'extra' ? c.description : ''}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono">{fmtARS(c.amount_ars)}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono text-red-600">{paid > 0 ? fmtARS(paid) : '—'}</td>
                                                            <td className={`px-4 py-2.5 text-right font-mono ${falta > 0 ? 'text-amber-700 font-semibold' : 'text-green-700'}`}>{falta > 0 ? fmtARS(falta) : 'Pagado'}</td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                {falta > 0 && (
                                                                    <button onClick={() => setForm({ type: 'egreso', costId: c.id })} className="text-xs font-bold text-red-600 hover:underline">Pagar</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {costPayments.length > 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 pb-2 pt-0">
                                                                    <div className="pl-3 border-l-2 border-red-100 divide-y divide-gray-50">{costPayments.map(movementLine)}</div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {costs.length === 0 && (
                                                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sin costos cargados.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {sinAsignar.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-marga-dark/50 uppercase mb-1">Otros gastos del viaje</p>
                                        <div className="divide-y divide-gray-100">{sinAsignar.map(movementLine)}</div>
                                    </div>
                                )}
                                {form?.type === 'egreso' && (
                                    <MovementForm
                                        key={form.costId || 'otro'}
                                        type="egreso"
                                        costs={costs}
                                        defaultCostId={form.costId}
                                        suggestedAmount={id => {
                                            const c = costs.find(x => x.id === id);
                                            return c ? (c.amount_ars || 0) - paidByCost(c.id) : 0;
                                        }}
                                        onSave={savePayment}
                                        onCancel={() => setForm(null)}
                                    />
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

// ── Lista de viajes (agrupada por mes, como la hoja VIAJES) ─────────────────

export const TripsView: React.FC = () => {
    const now = new Date();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState<number | 0>(0);
    const [search, setSearch] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);

    const fetchTrips = () => {
        const from = month ? `${year}-${String(month).padStart(2, '0')}-01` : `${year}-01-01`;
        const to = month ? `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}` : `${year}-12-31`;
        return api.trips.list({ date_from: from, date_to: to })
            .then((data: Trip[]) => setTrips(data))
            .catch(() => setTrips([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { setLoading(true); fetchTrips(); }, [year, month]);

    const filtered = useMemo(() => trips.filter(t => {
        if (!search) return true;
        const label = `${t.client_name || ''} ${t.concept || ''} ${t.reference || ''}`.toLowerCase();
        return label.includes(search.toLowerCase());
    }), [trips, search]);

    const groups = useMemo(() => {
        const map = new Map<string, Trip[]>();
        for (const t of filtered) {
            const key = (t.date || '').slice(0, 7);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(t);
        }
        return [...map.entries()];
    }, [filtered]);

    const periodTotals = sumTotals(filtered.map(tripTotals));
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i);

    const numCell = (n: number, cls = 'text-gray-700') => (
        <td className={`px-3 py-3 text-right font-mono whitespace-nowrap ${cls}`}>{n ? fmtARS(n) : <span className="text-gray-300">—</span>}</td>
    );

    const card = (label: string, value: number, sub?: string, cls = 'text-marga-dark') => (
        <div className="bg-white rounded-xl border border-marga-creamDark px-4 py-3">
            <p className="text-[11px] text-marga-dark/40 uppercase font-semibold">{label}</p>
            <p className={`text-lg font-bold font-mono ${cls}`}>{fmtARS(value)}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    );

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-1.5 border border-marga-creamDark rounded-lg text-sm font-semibold text-marga-dark bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30">
                    <option value={0}>Todo el año</option>
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-1.5 border border-marga-creamDark rounded-lg text-sm font-semibold text-marga-dark bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="relative flex-1 min-w-[200px] sm:max-w-xs ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" placeholder="Buscar cliente o cotización..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine text-sm w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                {card('Ingreso', periodTotals.presupuestado, `${filtered.length} viajes`)}
                {card('Costos', periodTotals.costos)}
                {card('Ganancia', periodTotals.ganancia, undefined, periodTotals.ganancia >= 0 ? 'text-marga-wine' : 'text-red-600')}
                {card('Por cobrar', Math.max(periodTotals.presupuestado - periodTotals.cobrado, 0), `Cobrado ${fmtARS(periodTotals.cobrado)}`, 'text-amber-700')}
                {card('Por pagar', Math.max(periodTotals.costos - periodTotals.pagado, 0), `Pagado ${fmtARS(periodTotals.pagado)}`, 'text-amber-700')}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-3 py-3">Fecha</th>
                            <th className="px-3 py-3">Cliente</th>
                            <th className="px-3 py-3 text-right">Presupuestado</th>
                            <th className="px-3 py-3 text-right">Transfer</th>
                            <th className="px-3 py-3 text-right">Viáticos</th>
                            <th className="px-3 py-3 text-right">Terceros</th>
                            <th className="px-3 py-3 text-right">Actividades</th>
                            <th className="px-3 py-3 text-right">Comisión</th>
                            <th className="px-3 py-3 text-right">Ganancia</th>
                            <th className="px-3 py-3 text-center">Cobro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(([key, list]) => {
                            const [y, m] = key.split('-');
                            const totals = sumTotals(list.map(tripTotals));
                            return (
                                <React.Fragment key={key}>
                                    <tr className="bg-marga-cream/70 border-t border-marga-creamDark">
                                        <td colSpan={10} className="px-3 py-2 text-xs font-bold text-marga-wine uppercase tracking-wider">{MONTH_NAMES[Number(m) - 1]} {y}</td>
                                    </tr>
                                    {list.map(t => {
                                        const tt = tripTotals(t);
                                        const st = collectStatus(tt);
                                        return (
                                            <tr key={t.id} onClick={() => setOpenId(t.id)} className="border-t border-gray-100 hover:bg-marga-cream cursor-pointer group">
                                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{fmtDate(t.date)}</td>
                                                <td className="px-3 py-3">
                                                    <p className="font-bold text-gray-800 group-hover:text-marga-wine flex items-center gap-1.5">
                                                        {t.client_name || '-'}
                                                        {(!!t.quote_changed || (t.quote_status && t.quote_status !== 'approved')) && (
                                                            <span title="La cotización cambió: revisar"><AlertTriangle size={14} className="text-amber-500" /></span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{t.reference}</p>
                                                </td>
                                                {numCell(tt.presupuestado, 'text-gray-900 font-semibold')}
                                                {numCell(tt.transfer)}
                                                {numCell(tt.viaticos)}
                                                {numCell(tt.terceros)}
                                                {numCell(tt.actividades)}
                                                {numCell(tt.comision)}
                                                {numCell(tt.ganancia, tt.ganancia >= 0 ? 'text-marga-wine font-bold' : 'text-red-600 font-bold')}
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${st.cls}`}>{st.label}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t border-gray-200 bg-gray-50/70 text-xs">
                                        <td colSpan={2} className="px-3 py-2 font-bold text-gray-500 uppercase">Total {MONTH_NAMES[Number(m) - 1].toLowerCase()}</td>
                                        {numCell(totals.presupuestado, 'text-gray-900 font-bold')}
                                        {numCell(totals.transfer, 'text-gray-600 font-semibold')}
                                        {numCell(totals.viaticos, 'text-gray-600 font-semibold')}
                                        {numCell(totals.terceros, 'text-gray-600 font-semibold')}
                                        {numCell(totals.actividades, 'text-gray-600 font-semibold')}
                                        {numCell(totals.comision, 'text-gray-600 font-semibold')}
                                        {numCell(totals.ganancia, 'text-marga-wine font-bold')}
                                        <td />
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        {!loading && groups.length === 0 && (
                            <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">No hay viajes en este período. Se cargan solos al aprobar una cotización.</td></tr>
                        )}
                        {loading && (
                            <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">Cargando...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {openId && <TripModal tripId={openId} onClose={() => setOpenId(null)} onChanged={fetchTrips} />}
        </div>
    );
};
