import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { REGION_OPTIONS } from '../constants';
import {
    X, Save, Loader2, MapPin, Pencil, DollarSign, FileText, StickyNote,
    Clock, Tag, Accessibility, ExternalLink, CheckCircle2, XCircle,
    List, Image, Sparkles
} from 'lucide-react';

export interface Experience {
    id: string;
    name: string;
    region: string;
    category: string;
    duration: string;
    price: string;
    highlight: string;
    includes: string;
    contact: string;
    description: string;
    image_url: string;
    departure_time: string;
    is_accessible: boolean;
    url_producto: string;
    notes: string;
    provider: string;
    phone: string;
    is_active: boolean;
}

interface ExperienceDrawerProps {
    experience: Experience | null;
    onClose: () => void;
    onSave?: () => void;
}

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

const CATEGORY_COLORS: Record<string, string> = {
    'Enológica': 'bg-purple-100 text-purple-700',
    'Aventura': 'bg-orange-100 text-orange-700',
    'Trekking': 'bg-green-100 text-green-700',
    'Cabalgata': 'bg-amber-100 text-amber-700',
    'City Tour': 'bg-blue-100 text-blue-700',
    'Cultural': 'bg-pink-100 text-pink-700',
    'Gastronomía': 'bg-red-100 text-red-700',
};

export const ExperienceDrawer: React.FC<ExperienceDrawerProps> = ({ experience, onClose, onSave }) => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [form, setForm] = useState<Experience | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (experience) {
            setForm({ ...experience });
            setMode('view');
        }
    }, [experience]);

    if (!experience || !form) return null;

    const set = (field: keyof Experience, value: any) =>
        setForm(f => f ? { ...f, [field]: value } : f);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('experiences')
            .update({
                name: form.name,
                region: form.region,
                category: form.category,
                duration: form.duration,
                price: form.price || null,
                highlight: form.highlight || null,
                includes: form.includes || null,
                contact: form.contact || null,
                description: form.description || null,
                image_url: form.image_url || null,
                departure_time: form.departure_time || null,
                is_accessible: form.is_accessible,
                url_producto: form.url_producto || null,
                notes: form.notes || null,
                provider: form.provider || null,
                phone: form.phone || null,
                is_active: form.is_active,
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
        setForm({ ...experience });
        setMode('view');
    };

    const catColor = CATEGORY_COLORS[form.category] || 'bg-gray-100 text-gray-700';

    const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marga-violet focus:outline-none";

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">

                {mode === 'view' ? (
                    /* ──── VIEW MODE ──── */
                    <>
                        {/* Hero image */}
                        {form.image_url && (
                            <div className="h-44 overflow-hidden shrink-0 relative">
                                <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <button onClick={onClose} className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-white/40 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {/* Header */}
                        <div className={`p-5 border-b border-gray-100 ${!form.image_url ? 'bg-gradient-to-br from-gray-50 to-white' : ''} shrink-0`}>
                            {!form.image_url && (
                                <div className="flex justify-end mb-2">
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                            <h2 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">{form.name}</h2>
                            <div className="flex flex-wrap gap-2">
                                {form.region && (
                                    <span className="inline-flex items-center gap-1 bg-marga-violet/10 text-marga-violet text-xs font-bold px-2.5 py-1 rounded-full">
                                        <MapPin size={10} /> {form.region}
                                    </span>
                                )}
                                {form.category && (
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${catColor}`}>
                                        <Tag size={10} /> {form.category}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {form.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                    {form.is_active ? 'Activa' : 'Inactiva'}
                                </span>
                                {form.is_accessible && (
                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                        <Accessibility size={10} /> Accesible
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* Precio + duración */}
                            <div className="grid grid-cols-2 gap-3">
                                {form.price && (
                                    <div className="bg-marga-violet/5 border border-marga-violet/20 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <DollarSign size={16} className="text-marga-violet shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Precio</p>
                                            <p className="text-sm font-extrabold text-gray-800">{form.price}</p>
                                        </div>
                                    </div>
                                )}
                                {(form.duration || form.departure_time) && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <Clock size={16} className="text-amber-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Duración / Salida</p>
                                            <p className="text-sm font-extrabold text-gray-800">
                                                {[form.duration, form.departure_time].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Highlight */}
                            {form.highlight && (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex gap-2">
                                    <Sparkles size={15} className="text-yellow-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-700 font-medium">{form.highlight}</p>
                                </div>
                            )}

                            {/* Descripción */}
                            {form.description && (
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">Descripción</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{form.description}</p>
                                </section>
                            )}

                            {/* Incluye */}
                            {form.includes && (
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">Qué incluye</h3>
                                    <ul className="space-y-1.5">
                                        {form.includes.split('/').map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                {item.trim()}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* Extras */}
                            <section>
                                <InfoRow icon={<FileText size={15} />} label="Contacto" value={form.contact} />
                                <InfoRow icon={<StickyNote size={15} />} label="Notas internas" value={form.notes} />
                                {form.url_producto && (
                                    <div className="flex gap-3 py-3">
                                        <div className="mt-0.5 text-gray-400 shrink-0"><ExternalLink size={15} /></div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Ver en web</p>
                                            <a href={form.url_producto} target="_blank" rel="noopener noreferrer" className="text-sm text-marga-violet font-medium hover:underline">
                                                {form.url_producto}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                Cerrar
                            </button>
                            <button onClick={() => setMode('edit')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors flex items-center gap-2">
                                <Pencil size={15} /> Editar
                            </button>
                        </div>
                    </>
                ) : (
                    /* ──── EDIT MODE ──── */
                    <>
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-3 shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-marga-violet uppercase tracking-wider mb-0.5">Editando</p>
                                    <h2 className="text-lg font-extrabold text-gray-800 leading-tight">{form.name}</h2>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            {/* Active toggle */}
                            <label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => set('is_active', !form.is_active)}>
                                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Activa</span>
                            </label>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">

                            {/* Info principal */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Información Principal</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                                        <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                                            <select value={form.region || ''} onChange={e => set('region', e.target.value)} className={inputCls}>
                                                <option value="">Sin región</option>
                                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                                            <input type="text" value={form.category || ''} onChange={e => set('category', e.target.value)} className={inputCls} placeholder="Enológica, Trekking..." />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Duración</label>
                                            <input type="text" value={form.duration || ''} onChange={e => set('duration', e.target.value)} className={inputCls} placeholder="7 horas aprox." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Horario salida</label>
                                            <input type="text" value={form.departure_time || ''} onChange={e => set('departure_time', e.target.value)} className={inputCls} placeholder="09:30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Precio <span className="text-gray-400 font-normal">(texto libre)</span></label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.price || ''} onChange={e => set('price', e.target.value)} className={`${inputCls} pl-8`} placeholder="$ 292.013 / USD 85 / Consultar" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Destacado / Highlight</label>
                                        <input type="text" value={form.highlight || ''} onChange={e => set('highlight', e.target.value)} className={inputCls} placeholder="Lo más especial de la experiencia" />
                                    </div>
                                </div>
                            </section>

                            {/* Contenido */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Contenido</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                        <textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-none`} placeholder="Descripción de la experiencia..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Qué incluye <span className="text-gray-400 font-normal">(separar con /)</span></label>
                                        <textarea rows={3} value={form.includes || ''} onChange={e => set('includes', e.target.value)} className={`${inputCls} resize-none`} placeholder="Traslado / Almuerzo / Guía..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Imagen (URL)</label>
                                        <div className="relative">
                                            <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} className={`${inputCls} pl-8`} placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">URL página web</label>
                                        <div className="relative">
                                            <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.url_producto || ''} onChange={e => set('url_producto', e.target.value)} className={`${inputCls} pl-8`} placeholder="https://margatour.com.ar/producto/..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas internas</label>
                                        <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} placeholder="Notas adicionales..." />
                                    </div>
                                </div>
                            </section>

                            {/* Accesibilidad */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Características</h3>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Accessibility size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Accesible (movilidad reducida)</span>
                                    </div>
                                    <div onClick={() => set('is_accessible', !form.is_accessible)}
                                        className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${form.is_accessible ? 'bg-marga-violet' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.is_accessible ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
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
