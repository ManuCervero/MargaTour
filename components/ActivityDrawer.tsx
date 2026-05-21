import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { REGION_OPTIONS } from '../constants';
import { X, Phone, Save, Dog, Baby, Accessibility, Loader2, MapPin, User, Building2, Pencil, DollarSign, FileText, StickyNote, CheckCircle2, XCircle } from 'lucide-react';

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

// ──────────────────────────── helpers ──────────────────────────────
const BoolBadge: React.FC<{ value: boolean; label: string; icon: React.ReactNode; color: string }> = ({ value, label, icon, color }) =>
    value ? (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
            {icon} {label}
        </span>
    ) : null;

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm text-gray-800 font-medium">{value}</p>
            </div>
        </div>
    );
};

// ──────────────────────────── main component ──────────────────────
export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ activity, onClose, onSave }) => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [form, setForm] = useState<Activity | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activity) {
            setForm({ ...activity });
            setMode('view');
        }
    }, [activity]);

    if (!activity || !form) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('activities')
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
        if (!error) {
            onSave?.();
            onClose();
        } else {
            alert('Error al guardar: ' + error.message);
        }
    };

    const handleCancel = () => {
        setForm({ ...activity });
        setMode('view');
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">

                {mode === 'view' ? (
                    /* ──────── VIEW MODE ──────── */
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 pr-4">
                                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{form.name}</h2>
                                    {form.provider && (
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                                            <Building2 size={12} className="text-gray-400" />
                                            {form.provider}
                                        </p>
                                    )}
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors shrink-0">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.region && (
                                    <span className="inline-flex items-center gap-1 bg-marga-violet/10 text-marga-violet text-xs font-bold px-2.5 py-1 rounded-full">
                                        <MapPin size={10} /> {form.region}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {form.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                    {form.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                                <BoolBadge value={form.isAccessible} label="Accesible" icon={<Accessibility size={10} />} color="bg-blue-100 text-blue-700" />
                                <BoolBadge value={form.isPetFriendly} label="Pet Friendly" icon={<Dog size={10} />} color="bg-green-100 text-green-700" />
                                <BoolBadge value={form.isKidFriendly} label="Apto Chicos" icon={<Baby size={10} />} color="bg-pink-100 text-pink-700" />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {form.price && (
                                <div className="bg-marga-violet/5 border border-marga-violet/20 rounded-xl px-5 py-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-marga-violet/10 flex items-center justify-center shrink-0">
                                        <DollarSign size={16} className="text-marga-violet" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Precio</p>
                                        <p className="text-lg font-extrabold text-gray-800">{form.price}</p>
                                    </div>
                                </div>
                            )}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-2 border-b border-gray-100">Información General</h3>
                                <InfoRow icon={<MapPin size={15} />} label="Ubicación / Dirección" value={form.address} />
                                <InfoRow icon={<FileText size={15} />} label="Descripción" value={form.description} />
                                <InfoRow icon={<StickyNote size={15} />} label="Notas internas" value={form.notes} />
                            </section>
                            {(form.contact || form.phone) && (
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-2 border-b border-gray-100">Contacto</h3>
                                    <InfoRow icon={<User size={15} />} label="Nombre" value={form.contact} />
                                    <InfoRow icon={<Phone size={15} />} label="Teléfono / WhatsApp" value={form.phone} />
                                </section>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center">
                            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                Cerrar
                            </button>
                            <button
                                onClick={() => setMode('edit')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2"
                            >
                                <Pencil size={15} /> Editar
                            </button>
                        </div>
                    </>
                ) : (
                    /* ──────── EDIT MODE ──────── */
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-marga-violet uppercase tracking-wider mb-0.5">Editando</p>
                                    <h2 className="text-xl font-extrabold text-gray-800 leading-tight">{form.name}</h2>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => setForm(f => f ? { ...f, isActive: !f.isActive } : f)}>
                                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">Activo</span>
                            </label>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Información General</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la Actividad</label>
                                        <input type="text" value={form.name || ''} onChange={(e) => setForm(f => f ? { ...f, name: e.target.value } : f)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                                        <select value={form.region || ''} onChange={(e) => setForm(f => f ? { ...f, region: e.target.value } : f)}
                                            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-marga-violet focus:outline-none">
                                            <option value="">Sin región</option>
                                            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label>
                                        <div className="relative">
                                            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.provider || ''} onChange={(e) => setForm(f => f ? { ...f, provider: e.target.value } : f)}
                                                placeholder="Nombre del proveedor"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Precio <span className="text-gray-400 font-normal">(texto libre: $34.000, USD 85, consultar...)</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.price || ''} onChange={(e) => setForm(f => f ? { ...f, price: e.target.value } : f)}
                                                placeholder="Ej: $34.000 / USD 85 / consultar"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación / Dirección</label>
                                        <div className="relative">
                                            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.address || ''} onChange={(e) => setForm(f => f ? { ...f, address: e.target.value } : f)}
                                                placeholder="Dirección o punto de partida"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                        <textarea value={form.description || ''} onChange={(e) => setForm(f => f ? { ...f, description: e.target.value } : f)}
                                            rows={3} placeholder="Descripción de la actividad..."
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas internas</label>
                                        <textarea value={form.notes || ''} onChange={(e) => setForm(f => f ? { ...f, notes: e.target.value } : f)}
                                            rows={2} placeholder="Notas adicionales..."
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none resize-none" />
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
                                            <input type="text" value={form.contact || ''} onChange={(e) => setForm(f => f ? { ...f, contact: e.target.value } : f)}
                                                placeholder="Nombre y apellido"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
                                        <div className="relative">
                                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.phone || ''} onChange={(e) => setForm(f => f ? { ...f, phone: e.target.value } : f)}
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Características</h3>
                                <div className="space-y-3">
                                    {([
                                        { key: 'isAccessible' as const, label: 'Accesible', icon: <Accessibility size={16} />, bg: 'bg-blue-100', color: 'text-blue-600' },
                                        { key: 'isPetFriendly' as const, label: 'Pet Friendly', icon: <Dog size={16} />, bg: 'bg-green-100', color: 'text-green-600' },
                                        { key: 'isKidFriendly' as const, label: 'Apto para chicos', icon: <Baby size={16} />, bg: 'bg-pink-100', color: 'text-pink-600' },
                                    ] as const).map(({ key, label, icon, bg, color }) => (
                                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center`}>{icon}</div>
                                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                            </div>
                                            <div
                                                onClick={() => setForm(f => f ? { ...f, [key]: !f[key] } : f)}
                                                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form[key] ? 'bg-marga-violet' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
