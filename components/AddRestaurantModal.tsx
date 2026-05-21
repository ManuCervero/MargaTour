import React, { useState } from 'react';
import { X, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { REGION_OPTIONS } from '../constants';

interface AddRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        region: 'Primera Zona (Luján + Maipú)',
        schedule: '',
        price_min: '',
        price_max: '',
        phone: '',
        is_accessible: false,
        is_pet_friendly: false,
        is_kid_friendly: false,
        is_active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        const payload = {
            ...formData,
            price_min: formData.price_min ? Number(formData.price_min) : null,
            price_max: formData.price_max ? Number(formData.price_max) : null,
        };
        const { error } = await supabase.from('restaurants').insert([payload]);
        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            setFormData({
                name: '',
                region: 'Primera Zona (Luján + Maipú)',
                schedule: '',
                price_min: '',
                price_max: '',
                phone: '',
                is_accessible: false,
                is_pet_friendly: false,
                is_kid_friendly: false,
                is_active: true,
            });
        } else {
            console.error('Error adding restaurant:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Utensils size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nuevo Restaurante</h2>
                            <p className="text-xs text-gray-500">Agregar al catálogo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ej: 1884 Restaurante"
                            />
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Región</label>
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ej: 2614671021"
                            />
                        </div>

                        {/* Schedule */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Horarios</label>
                            <input
                                type="text"
                                value={formData.schedule}
                                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ej: Lun-Sáb 12:00-15:00 / 20:00-00:00"
                            />
                        </div>

                        {/* Price Min */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Mín. / Persona</label>
                            <input
                                type="number"
                                value={formData.price_min}
                                onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ej: 15000"
                                min="0"
                            />
                        </div>

                        {/* Price Max */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Máx. / Persona</label>
                            <input
                                type="number"
                                value={formData.price_max}
                                onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ej: 35000"
                                min="0"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Características</label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_accessible} onChange={(e) => setFormData({ ...formData, is_accessible: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                    <span className="text-sm text-gray-700">Accesible</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_pet_friendly} onChange={(e) => setFormData({ ...formData, is_pet_friendly: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                    <span className="text-sm text-gray-700">Pet Friendly</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_kid_friendly} onChange={(e) => setFormData({ ...formData, is_kid_friendly: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                    <span className="text-sm text-gray-700">Kid Friendly</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                    <span className="text-sm text-gray-700">Activo</span>
                                </label>
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
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Restaurante'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
