import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';

interface AddExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EMPTY = {
    name: '', region: 'Primera Zona (Luján + Maipú)', category: '', duration: '',
    price: '', highlight: '', includes: '', contact: '', description: '',
    image_url: '', departure_time: '', is_accessible: false, url_producto: '',
    notes: '', is_active: true,
};

export const AddExperienceModal: React.FC<AddExperienceModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });

    const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setLoading(true);
        const { error } = await api.from('experiences').insert([{
            name: form.name.trim(),
            region: form.region,
            category: form.category || null,
            duration: form.duration || null,
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
            is_active: form.is_active,
        }]);
        setLoading(false);
        if (!error) { onSuccess(); onClose(); setForm({ ...EMPTY }); }
        else alert('Error: ' + error.message);
    };

    if (!isOpen) return null;

    const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-marga-violet/10 flex items-center justify-center">
                            <Sparkles size={20} className="text-marga-violet" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nueva Experiencia</h2>
                            <p className="text-xs text-gray-500">Agregar al catálogo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                            <input type="text" required autoFocus value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Ej: Valle de Uco: SuperUco y La Azul" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Región</label>
                            <select value={form.region} onChange={e => set('region', e.target.value)} className={inputCls}>
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                            <input type="text" value={form.category} onChange={e => set('category', e.target.value)} className={inputCls} placeholder="Enológica, Trekking, Aventura..." />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Duración</label>
                            <input type="text" value={form.duration} onChange={e => set('duration', e.target.value)} className={inputCls} placeholder="7 horas aprox." />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Horario de salida</label>
                            <input type="text" value={form.departure_time} onChange={e => set('departure_time', e.target.value)} className={inputCls} placeholder="09:30" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio <span className="font-normal text-gray-400 text-xs">(texto libre)</span></label>
                            <input type="text" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} placeholder="$ 292.013 / USD 85 / Consultar" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Destacado / Highlight</label>
                            <input type="text" value={form.highlight} onChange={e => set('highlight', e.target.value)} className={inputCls} placeholder="Lo especial: Almuerzo Gourmet en Bodega X..." />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Qué incluye <span className="font-normal text-gray-400 text-xs">(separar con /)</span></label>
                            <textarea rows={2} value={form.includes} onChange={e => set('includes', e.target.value)} className={`${inputCls} resize-none`} placeholder="Traslado / Agua / Almuerzo / Guía..." />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-none`} placeholder="Descripción completa de la experiencia..." />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">URL imagen</label>
                            <input type="text" value={form.image_url} onChange={e => set('image_url', e.target.value)} className={inputCls} placeholder="https://..." />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">URL página web</label>
                            <input type="text" value={form.url_producto} onChange={e => set('url_producto', e.target.value)} className={inputCls} placeholder="https://margatour.com.ar/producto/..." />
                        </div>

                        {/* Checkboxes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Características</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { field: 'is_accessible', label: 'Accesible' },
                                    { field: 'is_active', label: 'Activa' },
                                ].map(({ field, label }) => (
                                    <label key={field} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input type="checkbox" checked={(form as any)[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 accent-marga-violet rounded" />
                                        <span className="text-sm text-gray-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading || !form.name.trim()}
                            className="px-6 py-2 bg-marga-yellow hover:bg-yellow-400 text-marga-text rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                            {loading ? <><Loader2 size={16} className="animate-spin" />Guardando...</> : 'Guardar Experiencia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
