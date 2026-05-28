import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';
import { X, Phone, Mail, Save, Star, Dog, Accessibility, Wifi, Waves, Dumbbell, Sparkles, Utensils, Car, DollarSign, Loader2 } from 'lucide-react';

interface Hotel {
    id: string;
    name: string;
    region: string;
    stars: number;
    pricePerNight: number | null;
    isAccessible: boolean;
    isPetFriendly: boolean;
    hasWifi: boolean;
    hasPool: boolean;
    hasGym: boolean;
    hasSpa: boolean;
    hasRestaurant: boolean;
    hasParking: boolean;
    isActive: boolean;
    phone: string;
    email: string;
    description: string;
}

interface HotelDrawerProps {
    hotel: Hotel | null;
    onClose: () => void;
    onSave?: () => void;
}

export const HotelDrawer: React.FC<HotelDrawerProps> = ({ hotel, onClose, onSave }) => {
    const [form, setForm] = useState<Hotel | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (hotel) setForm({ ...hotel });
    }, [hotel]);

    if (!hotel || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await api.from('hotels')
            .update({
                name: form.name,
                region: form.region,
                stars: Number(form.stars),
                price_per_night: form.pricePerNight ? Number(form.pricePerNight) : null,
                is_accessible: form.isAccessible,
                is_pet_friendly: form.isPetFriendly,
                has_wifi: form.hasWifi,
                has_pool: form.hasPool,
                has_gym: form.hasGym,
                has_spa: form.hasSpa,
                has_restaurant: form.hasRestaurant,
                has_parking: form.hasParking,
                is_active: form.isActive,
                phone: form.phone,
                email: form.email,
                description: form.description,
            })
            .eq('id', form.id);

        setSaving(false);
        if (!error) { onSave?.(); onClose(); }
        else alert('Error al guardar: ' + error.message);
    };

    const toggle = (key: keyof Hotel) => setForm({ ...form, [key]: !form[key] } as Hotel);

    const attrs: { label: string; key: keyof Hotel; icon: any; bg: string; color: string }[] = [
        { label: 'WiFi', key: 'hasWifi', icon: Wifi, bg: 'bg-cyan-100', color: 'text-cyan-600' },
        { label: 'Piscina', key: 'hasPool', icon: Waves, bg: 'bg-blue-100', color: 'text-blue-600' },
        { label: 'Gimnasio', key: 'hasGym', icon: Dumbbell, bg: 'bg-purple-100', color: 'text-purple-600' },
        { label: 'Spa', key: 'hasSpa', icon: Sparkles, bg: 'bg-pink-100', color: 'text-pink-600' },
        { label: 'Restaurante', key: 'hasRestaurant', icon: Utensils, bg: 'bg-orange-100', color: 'text-orange-600' },
        { label: 'Estacionamiento', key: 'hasParking', icon: Car, bg: 'bg-gray-100', color: 'text-gray-600' },
        { label: 'Accesible', key: 'isAccessible', icon: Accessibility, bg: 'bg-blue-100', color: 'text-blue-600' },
        { label: 'Pet Friendly', key: 'isPetFriendly', icon: Dog, bg: 'bg-green-100', color: 'text-green-600' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
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
                                <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={11} className={s <= form.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => toggle('isActive')}>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Activo</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <DollarSign size={15} className="text-gray-400" />
                            <input
                                type="number"
                                min="0"
                                value={form.pricePerNight ?? ''}
                                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value ? Number(e.target.value) : null })}
                                placeholder="Precio/noche USD"
                                className="w-36 text-sm border-gray-300 rounded-lg px-2 py-1 border focus:ring-2 focus:ring-marga-violet focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

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
                                <label className="block text-xs font-medium text-gray-600 mb-1">Estrellas</label>
                                <select value={form.stars} onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })} className="w-full text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-marga-violet focus:outline-none">
                                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} ⭐</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción / Notas</label>
                                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-marga-violet focus:outline-none" placeholder="Detalles del hotel, ubicación, etc." />
                            </div>
                        </div>
                    </section>

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

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Servicios y Atributos</h3>
                        <div className="space-y-3">
                            {attrs.map((a) => (
                                <div key={a.label} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${a.bg} ${a.color} flex items-center justify-center`}>
                                            <a.icon size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{a.label}</span>
                                    </div>
                                    <div onClick={() => toggle(a.key)} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form[a.key] ? 'bg-marga-violet' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form[a.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            ))}
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
