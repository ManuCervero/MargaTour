import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';
import { X, Phone, Save, Dog, Baby, Accessibility, Loader2, MapPin, User, Building2, DollarSign } from 'lucide-react';

export interface Activity {
    id: string;
    name: string;
    region: string;
    contact: string;
    phone: string;
    address: string;
    price: string;
    provider: string;
    isAccessible: boolean;
    isPetFriendly: boolean;
    isKidFriendly: boolean;
    isActive: boolean;
    description: string;
    notes: string;
}

interface ActivityDrawerProps {
    activity: Activity | null;
    onClose: () => void;
    onSave?: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ activity, onClose, onSave }) => {
    const [form, setForm] = useState<Activity | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activity) setForm({ ...activity });
    }, [activity]);

    if (!activity || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await api.from('activities')
            .update({
                name: form.name,
                region: form.region,
                contact: form.contact,
                phone: form.phone,
                address: form.address,
                price: form.price || null,
                provider: form.provider,
                is_accessible: form.isAccessible,
                is_pet_friendly: form.isPetFriendly,
                is_kid_friendly: form.isKidFriendly,
                is_active: form.isActive,
                description: form.description,
                notes: form.notes,
            })
            .eq('id', form.id);

        setSaving(false);
        if (!error) { onSave?.(); onClose(); }
        else alert('Error al guardar: ' + error.message);
    };

    const set = (key: keyof Activity, value: any) => setForm(f => f ? { ...f, [key]: value } : f);
    const toggle = (key: keyof Activity) => setForm(f => f ? { ...f, [key]: !f[key] } : f);

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
                                onChange={(e) => set('name', e.target.value)}
                                className="text-xl font-extrabold text-gray-800 leading-tight bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-marga-violet focus:outline-none w-full"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                {form.region && (
                                    <span className="bg-marga-violet text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                        {form.region}
                                    </span>
                                )}
                                {form.provider && (
                                    <span className="text-gray-400 text-xs font-medium">• {form.provider}</span>
                                )}
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
                                type="text"
                                value={form.price}
                                onChange={(e) => set('price', e.target.value)}
                                placeholder="Precio USD p/p"
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
                                <select value={form.region || ''} onChange={(e) => set('region', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-marga-violet focus:outline-none">
                                    <option value="">Sin región</option>
                                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label>
                                <div className="relative">
                                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.provider || ''} onChange={(e) => set('provider', e.target.value)} placeholder="Nombre del proveedor" className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección / Punto de partida</label>
                                <div className="relative">
                                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Dirección o punto de partida" className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Descripción de la actividad..." className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas Internas</label>
                                <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Notas adicionales..." className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Contacto</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Contacto</label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.contact || ''} onChange={(e) => set('contact', e.target.value)} placeholder="Nombre y apellido" className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Atributos</h3>
                        <div className="space-y-3">
                            {([
                                { key: 'isAccessible' as const, label: 'Accesible', icon: Accessibility, bg: 'bg-blue-100', color: 'text-blue-600' },
                                { key: 'isPetFriendly' as const, label: 'Pet Friendly', icon: Dog, bg: 'bg-green-100', color: 'text-green-600' },
                                { key: 'isKidFriendly' as const, label: 'Apto para chicos', icon: Baby, bg: 'bg-pink-100', color: 'text-pink-600' },
                            ]).map((a) => (
                                <div key={a.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
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
