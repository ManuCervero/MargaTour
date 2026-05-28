import React, { useState } from 'react';
import { X, Wine } from 'lucide-react';
import { api } from '../lib/api';
import { REGION_OPTIONS } from '../constants';

interface AddWineryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddWineryModal: React.FC<AddWineryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        region: 'Primera Zona (Luján + Maipú)',
        department: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
        menu_price: '' as number | '',
        degustation_price: '' as number | '',
        has_restaurant: false,
        has_degustation: false,
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
            menu_price: formData.menu_price === '' ? null : formData.menu_price,
            degustation_price: formData.degustation_price === '' ? null : formData.degustation_price,
        };
        const { error } = await api.from('wineries').insert([payload]);
        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '',
                region: 'Primera Zona (Luján + Maipú)',
                department: '',
                address: '',
                phone: '',
                email: '',
                website: '',
                notes: '',
                menu_price: '',
                degustation_price: '',
                has_restaurant: false,
                has_degustation: false,
                is_accessible: false,
                is_pet_friendly: false,
                is_kid_friendly: false,
                is_active: true,
            });
        } else {
            console.error('Error adding winery:', error);
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Wine size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nueva Bodega</h2>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Bodega Catena Zapata"
                            />
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Región</label>
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Departamento</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Luján de Cuyo"
                            />
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Cobos 4400, Perdriel"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="reservas@bodega.com"
                            />
                        </div>

                        {/* Website */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sitio Web</label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Menu Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Menú (USD)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.menu_price}
                                    onChange={(e) => setFormData({ ...formData, menu_price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Degustation Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Degustación (USD)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.degustation_price}
                                    onChange={(e) => setFormData({ ...formData, degustation_price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="Información adicional, horarios..."
                            />
                        </div>

                        {/* Toggles */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Características</label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_restaurant}
                                        onChange={(e) => setFormData({ ...formData, has_restaurant: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Restaurante</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_accessible}
                                        onChange={(e) => setFormData({ ...formData, is_accessible: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Accesible</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_pet_friendly}
                                        onChange={(e) => setFormData({ ...formData, is_pet_friendly: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Pet Friendly</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_kid_friendly}
                                        onChange={(e) => setFormData({ ...formData, is_kid_friendly: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Kid Friendly</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_degustation}
                                        onChange={(e) => setFormData({ ...formData, has_degustation: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Degustación</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Activa</span>
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
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Bodega'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
