import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, DollarSign, Edit2, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { FullIncome, IncomeSource, CashFlowMovement } from '../types';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { CashFlowChart } from '../components/CashFlowChart';

const fmtUSD = (n: number) =>
    `USD ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtARS = (n: number) =>
    `$${Math.round(n || 0).toLocaleString('es-AR')}`;

const fmtDate = (iso: string) => {
    if (!iso) return '-';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const SOURCE_LABELS: Record<IncomeSource, string> = {
    cotizacion: 'Cotizaciones',
    mujeres_cumbre: 'Mujeres a la Cumbre',
    celalla_experience: 'Celalla Experience',
    general: 'General',
};

const SOURCE_COLORS: Record<IncomeSource, string> = {
    cotizacion: 'bg-marga-wine/10 text-marga-wine',
    mujeres_cumbre: 'bg-blue-100 text-blue-700',
    celalla_experience: 'bg-orange-100 text-orange-700',
    general: 'bg-gray-200 text-gray-700',
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type StatusFilter = 'Todos' | 'Pagado' | 'Parcial' | 'Pendiente';

function getStatus(income: FullIncome): StatusFilter {
    const paid = income.paid_usd || 0;
    const pending = Math.max((income.amount_usd || 0) - paid, 0);
    if (paid <= 0) return 'Pendiente';
    if (pending <= 0) return 'Pagado';
    return 'Parcial';
}

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

export const AccountingView: React.FC = () => {
    const now = new Date();
    const [incomes, setIncomes] = useState<FullIncome[]>([]);
    const [movements, setMovements] = useState<CashFlowMovement[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState<IncomeSource | 'Todos'>('Todos');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);
    const [exchangeRate, setExchangeRate] = useState(1200);
    const [showTCModal, setShowTCModal] = useState(false);
    const [fetchingBna, setFetchingBna] = useState(false);
    const [bnaUpdatedAt, setBnaUpdatedAt] = useState<string | null>(null);
    const [chartYear, setChartYear] = useState(now.getFullYear());
    const [chartMonth, setChartMonth] = useState(now.getMonth() + 1);

    const fetchIncomes = () => {
        api.income.list().then((data: FullIncome[]) => setIncomes(data)).catch(() => {});
    };

    useEffect(() => { fetchIncomes(); }, []);

    useEffect(() => {
        api.settings.getExchangeRate().then(res => {
            if (res?.value) setExchangeRate(Number(res.value));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const from = `${chartYear}-${String(chartMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(chartYear, chartMonth, 0).getDate();
        const to = `${chartYear}-${String(chartMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        api.income.movements({ date_from: from, date_to: to }).then((data: CashFlowMovement[]) => setMovements(data)).catch(() => setMovements([]));
    }, [chartYear, chartMonth]);

    const fetchBnaRate = async () => {
        setFetchingBna(true);
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
            const data = await res.json();
            const venta = Number(data.venta);
            if (!venta || venta <= 0) return;
            setExchangeRate(venta);
            await api.settings.updateExchangeRate(venta);
            const now2 = new Date();
            setBnaUpdatedAt(`${now2.getHours()}:${String(now2.getMinutes()).padStart(2, '0')}`);
        } catch { /* red error silencioso */ }
        setFetchingBna(false);
    };

    const openCreate = () => { setEditingId(undefined); setShowModal(true); };
    const openEdit = (id: string) => { setEditingId(id); setShowModal(true); };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta carga? Esta acción no se puede deshacer.')) return;
        await api.income.delete(id);
        fetchIncomes();
    };

    const handleSuccess = () => {
        fetchIncomes();
        const from = `${chartYear}-${String(chartMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(chartYear, chartMonth, 0).getDate();
        const to = `${chartYear}-${String(chartMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        api.income.movements({ date_from: from, date_to: to }).then((data: CashFlowMovement[]) => setMovements(data)).catch(() => {});
    };

    const filtered = incomes.filter(i => {
        const status = getStatus(i);
        const label = `${i.client_name || ''} ${i.concept || ''} ${i.reference || ''}`;
        const matchesSearch = !searchTerm || label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = sourceFilter === 'Todos' || i.source === sourceFilter;
        const matchesStatus = statusFilter === 'Todos' || status === statusFilter;
        return matchesSearch && matchesSource && matchesStatus;
    });

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i);

    return (
        <div className="p-4 sm:p-6 h-full overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-marga-wine font-display uppercase">Flujo de Caja</h2>
                    <p className="text-sm text-gray-500 mt-1">Cotizaciones, Mujeres a la Cumbre, Celalla Experience y General.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:flex-1 sm:min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cliente, concepto o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm w-full"
                        />
                    </div>
                    <div className="flex items-center border border-marga-creamDark rounded-xl overflow-hidden bg-white shrink-0">
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
                            BNA{bnaUpdatedAt && <span className="text-blue-400 font-normal ml-1">{bnaUpdatedAt}</span>}
                        </button>
                    </div>
                    <button
                        onClick={openCreate}
                        className="bg-marga-wine hover:bg-marga-wineLight text-marga-cream font-bold py-2 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Plus size={18} />
                        Nueva Carga
                    </button>
                </div>
            </div>

            {/* Selector mes/año + gráfico */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <select
                        value={chartMonth}
                        onChange={e => setChartMonth(Number(e.target.value))}
                        className="px-3 py-1.5 border border-marga-creamDark rounded-lg text-sm font-semibold text-marga-dark bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30"
                    >
                        {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={chartYear}
                        onChange={e => setChartYear(Number(e.target.value))}
                        className="px-3 py-1.5 border border-marga-creamDark rounded-lg text-sm font-semibold text-marga-dark bg-white focus:outline-none focus:ring-2 focus:ring-marga-wine/30"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <CashFlowChart movements={movements} year={chartYear} month={chartMonth} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                {(['Todos', 'cotizacion', 'mujeres_cumbre', 'celalla_experience', 'general'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setSourceFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${sourceFilter === s ? 'bg-marga-wine text-marga-cream' : 'bg-white text-gray-600 hover:bg-marga-creamDark border border-marga-creamDark'}`}
                    >
                        {s === 'Todos' ? 'Todos' : SOURCE_LABELS[s]}
                    </button>
                ))}
                <span className="w-px h-5 bg-marga-creamDark mx-1" />
                {(['Todos', 'Pagado', 'Parcial', 'Pendiente'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${statusFilter === s ? 'bg-marga-dark text-white border-marga-dark' : 'bg-white text-gray-500 border-marga-creamDark hover:border-gray-400'}`}
                    >
                        {s}
                    </button>
                ))}
                <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} cargas</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Origen</th>
                            <th className="px-6 py-3">Cliente / Concepto</th>
                            <th className="px-6 py-3 text-right">Monto</th>
                            <th className="px-6 py-3 text-right">Ingresos</th>
                            <th className="px-6 py-3 text-right">Egresos</th>
                            <th className="px-6 py-3 text-right">Pendiente</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map(i => {
                            const status = getStatus(i);
                            const paid = i.paid_usd || 0;
                            const egresos = i.egresos_usd || 0;
                            const pending = Math.max((i.amount_usd || 0) - paid, 0);
                            return (
                                <tr key={i.id} className="hover:bg-marga-cream transition-colors cursor-pointer group" onClick={() => i.id && openEdit(i.id)}>
                                    <td className="px-6 py-4 text-gray-600">{fmtDate(i.date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${SOURCE_COLORS[i.source]}`}>{SOURCE_LABELS[i.source]}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800 group-hover:text-marga-wine transition-colors">{i.client_name || '-'}</p>
                                        {i.concept && <p className="text-xs text-gray-400">{i.concept}</p>}
                                        {i.reference && <p className="text-xs text-gray-300">Ref: {i.reference}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-mono font-bold text-gray-800">{fmtUSD(i.amount_usd)}</p>
                                        <p className="font-mono text-xs text-gray-400">{fmtARS(i.amount_ars)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-green-700">{fmtUSD(paid)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-red-600">{egresos > 0 ? fmtUSD(egresos) : '—'}</td>
                                    <td className="px-6 py-4 text-right font-mono text-red-600">{fmtUSD(pending)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${status === 'Pagado' ? 'bg-green-100 text-green-700' : status === 'Parcial' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={(e) => i.id && handleDelete(e, i.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">No hay cargas registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddIncomeModal
                isOpen={showModal}
                incomeId={editingId}
                defaultExchangeRate={exchangeRate}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
            />

            {showTCModal && (
                <ExchangeRateModal
                    current={exchangeRate}
                    onSave={val => { setExchangeRate(val); setShowTCModal(false); }}
                    onClose={() => setShowTCModal(false)}
                />
            )}
        </div>
    );
};
