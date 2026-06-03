import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { api } from '../lib/api';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        origin: '',
        client_type: 'Particular',
        status: 'Activo',
        total_spent: 0,
        last_trip: '-',
        birthdate: '',
        document_id: '',
        emergency_phone: '',
        visit_reason: '',
        has_food_restrictions: false,
        food_restrictions_detail: '',
        has_disability: false,
        disability_detail: '',
        travels_with_pet: false,
        image_consent: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        // ID and created_at are generated automatically by the API
        const { error } = await api.from('clients').insert([{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            origin: formData.origin,
            client_type: formData.client_type,
            status: formData.status,
            total_spent: formData.total_spent,
            last_trip: formData.last_trip,
            birthdate: formData.birthdate,
            document_id: formData.document_id,
            emergency_phone: formData.emergency_phone,
            visit_reason: formData.visit_reason,
            has_food_restrictions: formData.has_food_restrictions,
            food_restrictions_detail: formData.has_food_restrictions ? formData.food_restrictions_detail : null,
            has_disability: formData.has_disability,
            disability_detail: formData.has_disability ? formData.disability_detail : null,
            travels_with_pet: formData.travels_with_pet,
            image_consent: formData.image_consent,
        }]);
        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                origin: '',
                client_type: 'Particular',
                status: 'Activo',
                total_spent: 0,
                last_trip: '-',
                birthdate: '',
                document_id: '',
                emergency_phone: '',
                visit_reason: '',
                has_food_restrictions: false,
                food_restrictions_detail: '',
                has_disability: false,
                disability_detail: '',
                travels_with_pet: false,
                image_consent: true,
            });
        } else {
            console.error('Error adding client:', error);
            alert('Hubo un error al agregar el cliente.');
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-marga-creamDark bg-gradient-to-r from-marga-wineLight/20 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-marga-wineLight flex items-center justify-center">
                            <User size={20} className="text-marga-wine" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Nuevo Cliente</h2>
                            <p className="text-xs text-gray-500">Agregar a cartera de clientes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-marga-creamDark rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        {/* Document ID */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">DNI / Pasaporte</label>
                            <input
                                type="text"
                                value={formData.document_id}
                                onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="Ej: 35.123.456"
                            />
                        </div>

                        {/* Email */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="juan@gmail.com"
                            />
                        </div>

                        {/* Phone */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="+54 9 261..."
                            />
                        </div>

                        {/* Emergency Phone */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tel. de Emergencia</label>
                            <input
                                type="tel"
                                value={formData.emergency_phone}
                                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="Contacto extra..."
                            />
                        </div>

                        {/* Birthdate */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Cumpleaños</label>
                            <input
                                type="date"
                                value={formData.birthdate}
                                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                            />
                        </div>

                        {/* Origin */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Origen (País/Ciudad)</label>
                            <input
                                type="text"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="Ej: Buenos Aires, Arg"
                            />
                        </div>

                        {/* Client Type */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Cliente</label>
                            <select
                                value={formData.client_type}
                                onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                            >
                                <option value="Particular">Particular</option>
                                <option value="Agencia">Agencia</option>
                                <option value="Corporativo">Corporativo</option>
                            </select>
                        </div>

                        {/* Visit Reason */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo de Visita</label>
                            <input
                                type="text"
                                value={formData.visit_reason}
                                onChange={(e) => setFormData({ ...formData, visit_reason: e.target.value })}
                                className="w-full px-4 py-2 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent"
                                placeholder="Ej: Turismo, Negocios, Aniversario..."
                            />
                        </div>

                        {/* Toggles */}
                        <div className="col-span-2 mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Información Adicional</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-marga-creamDark transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_food_restrictions}
                                            onChange={(e) => setFormData({ ...formData, has_food_restrictions: e.target.checked })}
                                            className="w-4 h-4 text-marga-wine rounded focus:ring-marga-wine"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Restricciones Alimentarias</span>
                                    </label>
                                    {formData.has_food_restrictions && (
                                        <input
                                            type="text"
                                            value={formData.food_restrictions_detail}
                                            onChange={(e) => setFormData({ ...formData, food_restrictions_detail: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            placeholder="Detalle (Ej: Celíaco, Vegano)..."
                                        />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-marga-creamDark transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_disability}
                                            onChange={(e) => setFormData({ ...formData, has_disability: e.target.checked })}
                                            className="w-4 h-4 text-marga-wine rounded focus:ring-marga-wine"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Discapacidad / Movilidad</span>
                                    </label>
                                    {formData.has_disability && (
                                        <input
                                            type="text"
                                            value={formData.disability_detail}
                                            onChange={(e) => setFormData({ ...formData, disability_detail: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="Detalle de asistencia requerida..."
                                        />
                                    )}
                                </div>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-marga-creamDark transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.travels_with_pet}
                                        onChange={(e) => setFormData({ ...formData, travels_with_pet: e.target.checked })}
                                        className="w-4 h-4 text-marga-wine rounded focus:ring-marga-wine"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Viaja con Mascota</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-marga-creamDark transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.image_consent}
                                        onChange={(e) => setFormData({ ...formData, image_consent: e.target.checked })}
                                        className="w-4 h-4 text-marga-wine rounded focus:ring-marga-wine"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Acepta uso de imagen</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-marga-creamDark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-marga-creamDark rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="px-6 py-2 bg-marga-wine hover:bg-marga-wineLight text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cliente'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
