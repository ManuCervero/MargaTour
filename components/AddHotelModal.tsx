import React, { useState } from 'react';
import { X, Bed } from 'lucide-react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';

interface AddHotelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        region: 'Primera Zona (Luján + Maipú)',
        stars: 3,
        price_per_night: '',
        phone: '',
        email: '',
        description: '',
        has_wifi: false,
        has_pool: false,
        has_gym: false,
        has_spa: false,
        has_restaurant: false,
        has_parking: false,
        is_accessible: false,
        is_pet_friendly: false,
        is_active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        const payload = {
            ...formData,
            price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null,
        };
        const { error } = await api.from('hotels').insert([payload]);
        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            setFormData({
                name: '',
                region: 'Primera Zona (Luján + Maipú)',
                stars: 3,
                price_per_night: '',
                phone: '',
                email: '',
                description: '',
                has_wifi: false,
                has_pool: false,
                has_gym: false,
                has_spa: false,
                has_restaurant: false,
                has_parking: false,
                is_accessible: false,
                is_pet_friendly: false,
                is_active: true,
            });
        } else {
            console.error('Error adding hotel:', error);
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Bed size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nuevo Hotel</h2>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Park Hyatt Mendoza"
                            />
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Región</label>
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Stars */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Estrellas</label>
                            <select
                                value={formData.stars}
                                onChange={(e) => setFormData({ ...formData, stars: Number(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} ⭐</option>)}
                            </select>
                        </div>

                        {/* Price per night */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio por Noche (USD)</label>
                            <input
                                type="number"
                                value={formData.price_per_night}
                                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: 150"
                                min="0"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: 2614671021"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="reservas@hotel.com"
                            />
                        </div>

                        {/* Description / Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Información adicional, ubicación, servicios..."
                            />
                        </div>

                        {/* Toggles */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Servicios</label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_wifi} onChange={(e) => setFormData({ ...formData, has_wifi: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">WiFi</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_pool} onChange={(e) => setFormData({ ...formData, has_pool: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Piscina</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_gym} onChange={(e) => setFormData({ ...formData, has_gym: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Gimnasio</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_spa} onChange={(e) => setFormData({ ...formData, has_spa: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Spa</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_restaurant} onChange={(e) => setFormData({ ...formData, has_restaurant: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Restaurante</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.has_parking} onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Estacionamiento</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_accessible} onChange={(e) => setFormData({ ...formData, is_accessible: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Accesible</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_pet_friendly} onChange={(e) => setFormData({ ...formData, is_pet_friendly: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Pet Friendly</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
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
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Hotel'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
