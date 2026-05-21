import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';
import { X, Phone, Save, Clock, DollarSign, Dog, Baby, Accessibility, Loader2 } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    region: string;
    schedule: string;
    priceMin: number | null;
    priceMax: number | null;
    isAccessible: boolean;
    isPetFriendly: boolean;
    isKidFriendly: boolean;
    isActive: boolean;
    phone: string;
}

interface RestaurantDrawerProps {
    restaurant: Restaurant | null;
    onClose: () => void;
    onSave?: () => void;
}

export const RestaurantDrawer: React.FC<RestaurantDrawerProps> = ({ restaurant, onClose, onSave }) => {
    const [form, setForm] = useState<Restaurant | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (restaurant) {
            setForm({ ...restaurant });
        }
    }, [restaurant]);

    if (!restaurant || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await api.from('restaurants')
            .update({
                region: form.region,
                schedule: form.schedule,
                price_min: form.priceMin ? Number(form.priceMin) : null,
                price_max: form.priceMax ? Number(form.priceMax) : null,
                is_accessible: form.isAccessible,
                is_pet_friendly: form.isPetFriendly,
                is_kid_friendly: form.isKidFriendly,
                is_active: form.isActive,
                phone: form.phone,
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
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Drawer Content */}
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800 leading-tight">{restaurant.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-orange-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                    {form.region}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Activo</span>
                        </label>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Section A: Info */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Información General</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Horarios</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.schedule || ''} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Lun-Sáb 12:00-15:00 / 20:00-00:00" className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio Mín. / Persona</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.priceMin ?? ''} onChange={(e) => setForm({ ...form, priceMin: e.target.value ? Number(e.target.value) : null })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio Máx. / Persona</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" value={form.priceMax ?? ''} onChange={(e) => setForm({ ...form, priceMax: e.target.value ? Number(e.target.value) : null })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section B: Contact */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Contacto</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section C: Attributes */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Características</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Accessibility size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Accesible</span>
                                </div>
                                <div onClick={() => setForm({ ...form, isAccessible: !form.isAccessible })} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isAccessible ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isAccessible ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <Dog size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Pet Friendly</span>
                                </div>
                                <div onClick={() => setForm({ ...form, isPetFriendly: !form.isPetFriendly })} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isPetFriendly ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isPetFriendly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                                        <Baby size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Kid Friendly</span>
                                </div>
                                <div onClick={() => setForm({ ...form, isKidFriendly: !form.isKidFriendly })} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isKidFriendly ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isKidFriendly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

            </div>
        </div>
    );
};
