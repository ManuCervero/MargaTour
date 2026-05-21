import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, MapPin, DollarSign, Clock, Users, Luggage, AlertCircle, Loader2 } from 'lucide-react';

interface AirportTransferDrawerProps {
    transfer: any | null;
    onClose: () => void;
    onSave?: () => void;
}

export const AirportTransferDrawer: React.FC<AirportTransferDrawerProps> = ({ transfer, onClose, onSave }) => {
    const [form, setForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (transfer) {
            setForm({ ...transfer });
        }
    }, [transfer]);

    if (!transfer || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('airport_transfers')
            .update({
                zone: form.zone,
                price: form.price ? Number(form.price) : null,
                is_active: form.is_active,
                needs_consultation: form.needs_consultation,
            })
            .eq('id', form.id);

        setSaving(false);
        if (!error) {
            onSave?.();
            onClose();
        } else {
            alert('Error al guardar: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800 leading-tight">Aeropuerto ↔ {form.zone}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                    {form.zone}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Activo</span>
                        </label>
                        {form.needs_consultation && (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                <AlertCircle size={12} /> A CONSULTAR
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Información del Transfer</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Zona</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.zone || ''} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="number" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Pax Máximo</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.max_pax ?? 19} onChange={(e) => setForm({ ...form, max_pax: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Pax Valijas</label>
                                    <div className="relative">
                                        <Luggage size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.max_luggage_pax ?? 15} onChange={(e) => setForm({ ...form, max_luggage_pax: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Opciones</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                        <AlertCircle size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Requiere Consulta</span>
                                </div>
                                <div
                                    onClick={() => setForm({ ...form, needs_consultation: !form.needs_consultation })}
                                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.needs_consultation ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.needs_consultation ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface TourDrawerProps {
    tour: any | null;
    onClose: () => void;
    onSave?: () => void;
}

export const TourDrawer: React.FC<TourDrawerProps> = ({ tour, onClose, onSave }) => {
    const [form, setForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (tour) {
            setForm({ ...tour });
        }
    }, [tour]);

    if (!tour || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('tours')
            .update({
                name: form.name,
                tour_type: form.tour_type,
                region: form.region,
                duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
                price: form.price ? Number(form.price) : null,
                extra_hour_price: form.extra_hour_price ? Number(form.extra_hour_price) : null,
                is_active: form.is_active,
                needs_consultation: form.needs_consultation,
            })
            .eq('id', form.id);

        setSaving(false);
        if (!error) {
            onSave?.();
            onClose();
        } else {
            alert('Error al guardar: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800 leading-tight">{form.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-purple-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                    {form.region || '—'}
                                </span>
                                {form.tour_type && (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                        {form.tour_type}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Activo</span>
                        </label>
                        {form.needs_consultation && (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                <AlertCircle size={12} /> A CONSULTAR
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Información del Tour</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                                <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                                    <input type="text" value={form.tour_type || ''} onChange={(e) => setForm({ ...form, tour_type: e.target.value })} className="w-full px-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Duración (horas)</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="number" value={form.duration_hours ?? ''} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Hora Extra</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.extra_hour_price ?? ''} onChange={(e) => setForm({ ...form, extra_hour_price: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Opciones</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                        <AlertCircle size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Requiere Consulta</span>
                                </div>
                                <div
                                    onClick={() => setForm({ ...form, needs_consultation: !form.needs_consultation })}
                                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.needs_consultation ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.needs_consultation ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
