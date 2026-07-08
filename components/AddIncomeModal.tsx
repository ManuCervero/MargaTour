import React, { useState, useEffect } from 'react';
import { X, Wallet, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { FullIncome, IncomePayment, IncomeSource, PaymentMethod, TransferAccount, FullQuote } from '../types';

const fmtUSD = (n: number) =>
    `USD ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtARS = (n: number) =>
    `$${Math.round(n || 0).toLocaleString('es-AR')}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

const roundUp = (n: number) => Math.ceil(n || 0);

// Replica el cálculo del total final de QuotesView.tsx: total_gross es un subtotal en ARS
// sin ganancia ni comisión aplicada — no es el monto real que paga el cliente.
function getQuoteFinalTotals(q: FullQuote): { totalArs: number; totalUsd: number } {
    const subtotalArs = (q.total_transfers || 0) * (1 + (q.ganancia_transfer || 0) / 100)
        + (q.total_services || 0) * (1 + (q.ganancia_servicio || 0) / 100)
        + ((q as any).total_extras || 0);
    const r = (q.comision || 0) / 100;
    const totalArs = subtotalArs * (1 + r * (1 + r));
    const tc = q.exchange_rate || 0;
    const totalUsd = tc > 0 ? totalArs / tc : 0;
    return { totalArs: roundUp(totalArs), totalUsd: roundUp(totalUsd) };
}

const SOURCE_OPTIONS: { value: IncomeSource; label: string }[] = [
    { value: 'cotizacion', label: 'Cotizaciones' },
    { value: 'mujeres_cumbre', label: 'Mujeres a la Cumbre' },
    { value: 'celalla_experience', label: 'Celalla Experience' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'link_pago', label: 'Link de Pago' },
    { value: 'we_travel', label: 'We Travel' },
    { value: 'viator', label: 'Viator' },
    { value: 'mercado_pago', label: 'Mercado Pago' },
];

const TRANSFER_ACCOUNTS: { value: TransferAccount; label: string }[] = [
    { value: 'marga', label: 'Marga' },
    { value: 'fer', label: 'Fer' },
    { value: 'galicia_belen', label: 'Galicia Belen' },
];

const emptyIncome = (): FullIncome => ({
    source: 'cotizacion',
    quote_id: undefined,
    client_name: '',
    concept: '',
    amount_usd: 0,
    amount_ars: 0,
    exchange_rate: 1200,
    date: todayISO(),
    notes: '',
    payments: [],
});

const emptyPayment = (exchangeRate?: number): IncomePayment => ({
    amount_usd: 0,
    amount_ars: 0,
    exchange_rate: exchangeRate || 1200,
    payment_method: 'efectivo',
    transfer_account: undefined,
    invoice_number: '',
    date: todayISO(),
    notes: '',
});

const inp = "w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm";

// ── PaymentRow ────────────────────────────────────────────────────────────────

const PaymentRow: React.FC<{
    payment: IncomePayment;
    index: number;
    onChange: (index: number, updated: IncomePayment) => void;
    onRemove: (index: number) => void;
}> = ({ payment, index, onChange, onRemove }) => {
    const isEfectivo = payment.payment_method === 'efectivo';
    const isTransferencia = payment.payment_method === 'transferencia';

    return (
        <div className="bg-marga-cream/60 border border-marga-creamDark rounded-xl p-4 mb-3 relative">
            <button type="button" onClick={() => onRemove(index)} className="absolute top-3 right-3 p-1 text-marga-dark/30 hover:text-red-500 transition-colors">
                <X size={16} />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Monto USD</label>
                    <input
                        type="number" min={0} value={payment.amount_usd || ''}
                        onChange={e => {
                            const usd = roundUp(parseFloat(e.target.value));
                            onChange(index, { ...payment, amount_usd: usd, amount_ars: payment.exchange_rate ? roundUp(usd * payment.exchange_rate) : payment.amount_ars });
                        }}
                        className={inp} placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Monto ARS</label>
                    <input
                        type="number" min={0} value={payment.amount_ars || ''}
                        onChange={e => onChange(index, { ...payment, amount_ars: roundUp(parseFloat(e.target.value)) })}
                        className={inp} placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Tipo de cambio</label>
                    <input
                        type="number" min={0} value={payment.exchange_rate || ''}
                        onChange={e => {
                            const tc = parseFloat(e.target.value) || 0;
                            onChange(index, { ...payment, exchange_rate: tc, amount_ars: payment.amount_usd ? roundUp(payment.amount_usd * tc) : payment.amount_ars });
                        }}
                        className={inp} placeholder="0"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Modo de pago</label>
                    <select
                        value={payment.payment_method}
                        onChange={e => onChange(index, { ...payment, payment_method: e.target.value as PaymentMethod, transfer_account: e.target.value === 'transferencia' ? payment.transfer_account : undefined })}
                        className={inp}
                    >
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                {isTransferencia && (
                    <div>
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Cuenta</label>
                        <select
                            value={payment.transfer_account || ''}
                            onChange={e => onChange(index, { ...payment, transfer_account: e.target.value as TransferAccount })}
                            className={inp}
                        >
                            <option value="">Seleccionar...</option>
                            {TRANSFER_ACCOUNTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Fecha</label>
                    <input
                        type="date" value={payment.date}
                        onChange={e => onChange(index, { ...payment, date: e.target.value })}
                        className={inp}
                    />
                </div>
                {!isEfectivo && (
                    <div>
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-1">N° de Factura</label>
                        <input
                            type="text" value={payment.invoice_number || ''}
                            onChange={e => onChange(index, { ...payment, invoice_number: e.target.value })}
                            className={inp} placeholder="Ej: 0001-00001234"
                        />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Notas / Observaciones</label>
                <input
                    type="text" value={payment.notes || ''}
                    onChange={e => onChange(index, { ...payment, notes: e.target.value })}
                    className={inp} placeholder="Observaciones del pago..."
                />
            </div>
        </div>
    );
};

// ── AddIncomeModal ──────────────────────────────────────────────────────────

interface AddIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    incomeId?: string;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose, onSuccess, incomeId }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FullIncome>(emptyIncome());
    const [quotes, setQuotes] = useState<FullQuote[]>([]);
    const [quoteSearch, setQuoteSearch] = useState('');
    const [showQuoteDropdown, setShowQuoteDropdown] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (incomeId) {
            api.income.get(incomeId).then((data: FullIncome) => setForm(data));
        } else {
            setForm(emptyIncome());
        }
        setQuoteSearch('');
    }, [isOpen, incomeId]);

    useEffect(() => {
        if (isOpen && form.source === 'cotizacion' && quotes.length === 0) {
            api.quotes.list().then((data: FullQuote[]) => setQuotes(data)).catch(() => {});
        }
    }, [isOpen, form.source]);

    if (!isOpen) return null;

    const filteredQuotes = quotes.filter(q =>
        !quoteSearch ||
        q.client_name?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
        String(q.quote_number || '').includes(quoteSearch)
    );

    const handleQuoteSelect = (q: FullQuote) => {
        const { totalArs, totalUsd } = getQuoteFinalTotals(q);
        setForm(f => ({
            ...f,
            quote_id: q.id,
            client_name: q.client_name,
            amount_usd: totalUsd,
            amount_ars: totalArs,
            exchange_rate: q.exchange_rate || f.exchange_rate,
        }));
        setQuoteSearch(`${q.quote_number ? `#${q.quote_number} ` : ''}${q.client_name}`);
        setShowQuoteDropdown(false);
    };

    const payments = form.payments || [];
    const paidUsd = payments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    const pendingUsd = Math.max((form.amount_usd || 0) - paidUsd, 0);
    const status = paidUsd <= 0 ? 'Pendiente' : pendingUsd <= 0 ? 'Pagado' : 'Parcial';

    const handleAddPayment = () => {
        setForm(f => ({ ...f, payments: [...(f.payments || []), emptyPayment(f.exchange_rate)] }));
    };

    const handleChangePayment = (index: number, updated: IncomePayment) => {
        setForm(f => ({ ...f, payments: (f.payments || []).map((p, i) => i === index ? updated : p) }));
    };

    const handleRemovePayment = (index: number) => {
        setForm(f => ({ ...f, payments: (f.payments || []).filter((_, i) => i !== index) }));
    };

    const isValid = form.date &&
        (form.source === 'cotizacion' ? !!form.quote_id : !!form.client_name?.trim() && !!form.concept?.trim());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            if (incomeId) {
                await api.income.update(incomeId, form);
            } else {
                await api.income.create(form);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error guardando ingreso:', err);
            alert('Hubo un error al guardar el ingreso.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-marga-creamDark bg-gradient-to-r from-marga-wineLight/20 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-marga-wineLight flex items-center justify-center">
                            <Wallet size={20} className="text-marga-wine" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{incomeId ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h2>
                            <p className="text-xs text-gray-500">Contable · Ingresos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-marga-creamDark rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    {/* Origen */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-2">Origen del ingreso</label>
                        <div className="flex flex-wrap gap-2">
                            {SOURCE_OPTIONS.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, source: s.value, quote_id: undefined }))}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${form.source === s.value ? 'bg-marga-wine text-marga-cream' : 'bg-white text-gray-600 hover:bg-marga-creamDark border border-marga-creamDark'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.source === 'cotizacion' ? (
                        <div className="mb-4 relative">
                            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Cotización</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={quoteSearch}
                                    onChange={e => { setQuoteSearch(e.target.value); setShowQuoteDropdown(true); }}
                                    onFocus={() => setShowQuoteDropdown(true)}
                                    placeholder="Buscar por N° o cliente..."
                                    className={inp + " pl-9"}
                                />
                            </div>
                            {showQuoteDropdown && quoteSearch && filteredQuotes.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-20 bg-white border border-marga-creamDark rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                                    {filteredQuotes.slice(0, 8).map(q => {
                                        const { totalUsd } = getQuoteFinalTotals(q);
                                        return (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => handleQuoteSelect(q)}
                                                className="w-full text-left px-4 py-2.5 hover:bg-marga-cream text-sm transition-colors"
                                            >
                                                <span className="font-semibold text-marga-dark">{q.quote_number ? `#${q.quote_number} — ` : ''}{q.client_name}</span>
                                                {totalUsd ? <span className="text-marga-dark/40 ml-2 text-xs">{fmtUSD(totalUsd)}</span> : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Cliente</label>
                                <input type="text" value={form.client_name || ''} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inp} placeholder="Nombre del cliente" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Concepto</label>
                                <input type="text" value={form.concept || ''} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} className={inp} placeholder="Descripción del servicio" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Monto USD</label>
                            <input
                                type="number" min={0} value={form.amount_usd || ''}
                                onChange={e => {
                                    const usd = roundUp(parseFloat(e.target.value));
                                    setForm(f => ({ ...f, amount_usd: usd, amount_ars: f.exchange_rate ? roundUp(usd * f.exchange_rate) : f.amount_ars }));
                                }}
                                className={inp} placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Monto ARS</label>
                            <input
                                type="number" min={0} value={form.amount_ars || ''}
                                onChange={e => setForm(f => ({ ...f, amount_ars: roundUp(parseFloat(e.target.value)) }))}
                                className={inp} placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Tipo de cambio</label>
                            <input
                                type="number" min={0} value={form.exchange_rate || ''}
                                onChange={e => {
                                    const tc = parseFloat(e.target.value) || 0;
                                    setForm(f => ({ ...f, exchange_rate: tc, amount_ars: f.amount_usd ? roundUp(f.amount_usd * tc) : f.amount_ars }));
                                }}
                                className={inp} placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-marga-dark/50 mb-1">Notas / Observaciones</label>
                        <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp + " resize-y"} placeholder="Observaciones generales..." />
                    </div>

                    {/* Pagos */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-marga-wine uppercase tracking-wider">Pagos</h3>
                            <button type="button" onClick={handleAddPayment} className="flex items-center gap-1 text-xs font-bold text-marga-wine hover:underline">
                                <Plus size={14} /> Agregar pago
                            </button>
                        </div>
                        {payments.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-marga-creamDark rounded-xl">Sin pagos cargados todavía.</p>
                        )}
                        {payments.map((p, i) => (
                            <PaymentRow key={i} payment={p} index={i} onChange={handleChangePayment} onRemove={handleRemovePayment} />
                        ))}
                    </div>

                    {/* Resumen */}
                    <div className="bg-marga-cream/60 border border-marga-creamDark rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                                <p className="text-xs text-marga-dark/40 uppercase font-semibold">Total</p>
                                <p className="font-bold text-marga-dark">{fmtUSD(form.amount_usd || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-marga-dark/40 uppercase font-semibold">Pagado</p>
                                <p className="font-bold text-green-700">{fmtUSD(paidUsd)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-marga-dark/40 uppercase font-semibold">Pendiente</p>
                                <p className="font-bold text-red-600">{fmtUSD(pendingUsd)}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Pagado' ? 'bg-green-100 text-green-700' : status === 'Parcial' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {status}
                        </span>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-marga-creamDark">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-marga-creamDark rounded-lg font-medium transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="px-6 py-2 bg-marga-wine hover:bg-marga-wineLight text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Ingreso'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
