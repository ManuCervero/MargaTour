import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Winery } from '../types';
import { REGION_OPTIONS } from '../constants';
import { X, MapPin, Globe, Phone, Mail, Save, Star, Baby, Dog, Accessibility, Utensils, Loader2 } from 'lucide-react';

interface WineryDrawerProps {
    winery: Winery | null;
    onClose: () => void;
    onSave?: () => void;
}

export const WineryDrawer: React.FC<WineryDrawerProps> = ({ winery, onClose, onSave }) => {
    const [form, setForm] = useState<Winery | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (winery) {
            setForm({ ...winery });
        }
    }, [winery]);

    if (!winery || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await api.from('wineries')
            .update({
                name: form.name,
                region: form.region,
                department: form.department,
                address: form.address,
                website: form.website,
                notes: form.notes,
                phone: form.phone,
                email: form.email,
                is_active: form.isActive,
                is_recommended: form.isRecommended,
                has_restaurant: form.hasRestaurant,
                is_accessible: form.isAccessible,
                is_pet_friendly: form.isPetFriendly,
                is_kid_friendly: form.isKidFriendly,
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

    const toggle = (key: keyof Winery) => {
        setForm({ ...form, [key]: !form[key] } as Winery);
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
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="text-xl font-extrabold text-gray-800 leading-tight bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-marga-violet focus:outline-none w-full"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-marga-violet text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                    {form.region}
                                </span>
                                {form.department && (
                                    <span className="text-gray-400 text-xs font-medium">
                                        • {form.department}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => toggle('isActive')}>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Activo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => toggle('isRecommended')}>
                            <button className={`p-1.5 rounded-full transition-colors ${form.isRecommended ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-100 text-gray-400 group-hover:text-yellow-400'}`}>
                                <Star size={18} fill={form.isRecommended ? "currentColor" : "none"} />
                            </button>
                            <span className="text-sm font-medium text-gray-600">Recomendado</span>
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
                                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-marga-violet focus:outline-none">
                                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                                <input type="text" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle s/n..." className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Web / Instagram</label>
                                <div className="relative">
                                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="www.bodega..." className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas Internas</label>
                                <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-marga-violet focus:outline-none" placeholder="Detalles de reserva, tips, etc."></textarea>
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
                                    <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="reservas@..." className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section C: Attributes */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Servicios y Atributos</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Utensils size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Restaurante</span>
                                </div>
                                <div onClick={() => toggle('hasRestaurant')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.hasRestaurant ? 'bg-marga-violet' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.hasRestaurant ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Accessibility size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Accesible</span>
                                </div>
                                <div onClick={() => toggle('isAccessible')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isAccessible ? 'bg-marga-violet' : 'bg-gray-300'}`}>
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
                                <div onClick={() => toggle('isPetFriendly')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isPetFriendly ? 'bg-marga-violet' : 'bg-gray-300'}`}>
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
                                <div onClick={() => toggle('isKidFriendly')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.isKidFriendly ? 'bg-marga-violet' : 'bg-gray-300'}`}>
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
