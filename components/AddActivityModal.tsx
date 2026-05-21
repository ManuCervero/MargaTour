import React, { useState } from 'react';
import { X, Compass, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EMPTY_FORM = {
    name: '',
    region: 'Primera Zona (Luján + Maipú)',
    provider: '',
    contact: '',
    phone: '',
    address: '',
    price: '',
    description: '',
    notes: '',
    is_accessible: false,
    is_pet_friendly: false,
    is_kid_friendly: false,
    is_active: true,
};

export const AddActivityModal: React.FC<AddActivityModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const set = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        const { error } = await api.from('activities').insert([{
            name: formData.name.trim(),
            region: formData.region,
            provider: formData.provider || null,
            contact: formData.contact || null,
            phone: formData.phone || null,
            address: formData.address || null,
            price: formData.price || null,
            description: formData.description || null,
            notes: formData.notes || null,
            is_accessible: formData.is_accessible,
            is_pet_friendly: formData.is_pet_friendly,
            is_kid_friendly: formData.is_kid_friendly,
            is_active: formData.is_active,
        }]);
        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            setFormData({ ...EMPTY_FORM });
        } else {
            alert('Error al guardar: ' + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-marga-violet/10 flex items-center justify-center">
                            <Compass size={20} className="text-marga-violet" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nueva Actividad</h2>
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

                        {/* Nombre */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                            <input
                                type="text" required autoFocus
                                value={formData.name}
                                onChange={(e) => set('name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: Rafting Potrerillos intermedio"
                            />
                        </div>

                        {/* Región */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Región</label>
                            <select
                                value={formData.region}
                                onChange={(e) => set('region', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                            >
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Proveedor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Proveedor</label>
                            <input
                                type="text"
                                value={formData.provider}
                                onChange={(e) => set('provider', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: Xnoccio Rafting"
                            />
                        </div>

                        {/* Contacto */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre contacto</label>
                            <input
                                type="text"
                                value={formData.contact}
                                onChange={(e) => set('contact', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: Jessica Beranegui"
                            />
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono / WhatsApp</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => set('phone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: 2614188601"
                            />
                        </div>

                        {/* Precio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Precio <span className="text-gray-400 font-normal text-xs">(texto libre)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.price}
                                onChange={(e) => set('price', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: $34.000 / USD 85 / consultar"
                            />
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Ubicación / Dirección</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => set('address', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                placeholder="Ej: Ruta 7 Km 52, Potrerillos"
                            />
                        </div>

                        {/* Descripción */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                            <textarea
                                rows={2}
                                value={formData.description}
                                onChange={(e) => set('description', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent resize-none"
                                placeholder="Descripción breve de la actividad..."
                            />
                        </div>

                        {/* Notas */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Notas internas</label>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => set('notes', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent resize-none"
                                placeholder="Notas adicionales para uso interno..."
                            />
                        </div>

                        {/* Características */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Características</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { field: 'is_accessible', label: 'Accesible' },
                                    { field: 'is_pet_friendly', label: 'Pet Friendly' },
                                    { field: 'is_kid_friendly', label: 'Apto chicos' },
                                    { field: 'is_active', label: 'Activo' },
                                ].map(({ field, label }) => (
                                    <label key={field} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={(formData as any)[field]}
                                            onChange={(e) => set(field, e.target.checked)}
                                            className="w-4 h-4 text-marga-violet rounded focus:ring-marga-violet accent-marga-violet"
                                        />
                                        <span className="text-sm text-gray-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="px-6 py-2 bg-marga-yellow hover:bg-yellow-400 text-marga-text rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar Actividad'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
