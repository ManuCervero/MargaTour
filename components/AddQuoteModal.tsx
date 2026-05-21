import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, GripVertical, MapPin, Wine, Bed, Utensils, Compass, Star, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceItem {
    id: string;
    category: 'bodega' | 'restaurante' | 'hotel' | 'actividad' | 'experiencia';
    name: string;
}

interface RouteStop {
    id: string;
    name: string;
}

interface AddQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SERVICE_CATEGORIES = [
    { value: 'bodega' as const, label: 'Bodega', icon: Wine, color: 'bg-purple-100 text-purple-600' },
    { value: 'restaurante' as const, label: 'Restaurante', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { value: 'hotel' as const, label: 'Hotel', icon: Bed, color: 'bg-blue-100 text-blue-600' },
    { value: 'actividad' as const, label: 'Actividad', icon: Compass, color: 'bg-green-100 text-green-600' },
    { value: 'experiencia' as const, label: 'Experiencia', icon: Star, color: 'bg-amber-100 text-amber-600' },
];

let idCounter = 0;
const genId = () => `item_${++idCounter}_${Date.now()}`;

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        leadName: '',
        type: 'Transfer',
        origin: '',
        destination: '',
        pax: 1,
        price: 0,
        status: 'Enviada' as 'Enviada' | 'Aprobada' | 'Cancelada' | 'Sin respuesta',
        date: new Date().toISOString().split('T')[0],
    });

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [stops, setStops] = useState<RouteStop[]>([]);

    // Catalog data for autocomplete
    const [catalogData, setCatalogData] = useState<{ [key: string]: string[] }>({
        bodega: [],
        restaurante: [],
        hotel: [],
        actividad: [],
        experiencia: [],
    });

    useEffect(() => {
        if (!isOpen) return;
        // Fetch catalog items for autocomplete
        const fetchCatalog = async () => {
            const [wineries, hotels, restaurants, activities] = await Promise.all([
                supabase.from('wineries').select('name').eq('is_active', true),
                supabase.from('hotels').select('name').eq('is_active', true),
                supabase.from('restaurants').select('name').eq('is_active', true),
                supabase.from('activities').select('name').eq('is_active', true),
            ]);
            setCatalogData({
                bodega: (wineries.data || []).map((w: any) => w.name),
                restaurante: (restaurants.data || []).map((r: any) => r.name),
                hotel: (hotels.data || []).map((h: any) => h.name),
                actividad: (activities.data || []).map((a: any) => a.name),
                experiencia: [], // No separate table yet
            });
        };
        fetchCatalog();
    }, [isOpen]);

    if (!isOpen) return null;

    // Services
    const addService = (category: ServiceItem['category']) => {
        setServices([...services, { id: genId(), category, name: '' }]);
    };

    const updateService = (id: string, name: string) => {
        setServices(services.map(s => s.id === id ? { ...s, name } : s));
    };

    const removeService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
    };

    // Stops
    const addStop = () => {
        setStops([...stops, { id: genId(), name: '' }]);
    };

    const updateStop = (id: string, name: string) => {
        setStops(stops.map(s => s.id === id ? { ...s, name } : s));
    };

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.leadName.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('quotes').insert([{
                leadName: form.leadName,
                type: form.type,
                origin: form.origin || null,
                destination: form.destination || null,
                pax: form.pax,
                price: form.price,
                status: form.status,
                date: form.date,
                services: services.filter(s => s.name.trim()).map(s => ({ category: s.category, name: s.name })),
                stops: stops.filter(s => s.name.trim()).map(s => s.name),
            }]);

            if (!error) {
                onSuccess();
                onClose();
                setForm({
                    leadName: '',
                    type: 'Transfer',
                    origin: '',
                    destination: '',
                    pax: 1,
                    price: 0,
                    status: 'Enviada',
                    date: new Date().toISOString().split('T')[0],
                });
                setServices([]);
                setStops([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryInfo = (cat: ServiceItem['category']) =>
        SERVICE_CATEGORIES.find(c => c.value === cat)!;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <FileText size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Nueva Cotización</h3>
                            <p className="text-xs text-gray-500">Crear una nueva cotización con servicios</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cliente *</label>
                        <input
                            type="text"
                            required
                            value={form.leadName}
                            onChange={(e) => setForm({ ...form, leadName: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                            placeholder="Nombre del cliente"
                        />
                    </div>

                    {/* Tipo y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm bg-white"
                            >
                                <option value="Transfer">Transfer</option>
                                <option value="Tour">Tour</option>
                                <option value="Ruta">Ruta</option>
                                <option value="Experiencia">Experiencia</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm bg-white"
                            >
                                <option value="Enviada">Enviada</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Cancelada">Cancelada</option>
                                <option value="Sin respuesta">Sin respuesta</option>
                            </select>
                        </div>
                    </div>

                    {/* ═══ RECORRIDO: Origen → Paradas → Destino ═══ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Recorrido</label>
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-0">
                            {/* Origen */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                                    <div className="w-0.5 h-6 bg-gray-300"></div>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={form.origin}
                                        onChange={(e) => setForm({ ...form, origin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                                        placeholder="Origen (ej: Aeropuerto)"
                                    />
                                </div>
                            </div>

                            {/* Paradas intermedias */}
                            {stops.map((stop, idx) => (
                                <div key={stop.id} className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-50 border-2 border-amber-500"></div>
                                        <div className="w-0.5 h-6 bg-gray-300"></div>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={stop.name}
                                            onChange={(e) => updateStop(stop.id, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none text-sm"
                                            placeholder={`Parada ${idx + 1}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStop(stop.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Botón agregar parada */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    <div className="w-0.5 h-6 bg-gray-300"></div>
                                </div>
                                <button
                                    type="button"
                                    onClick={addStop}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={14} />
                                    Agregar parada
                                </button>
                            </div>

                            {/* Destino */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={form.destination}
                                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent focus:outline-none text-sm"
                                        placeholder="Destino (ej: Hotel Hilton)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ SERVICIOS ═══ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Servicios incluidos</label>

                        {/* Lista de servicios agregados */}
                        {services.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {services.map((service) => {
                                    const catInfo = getCategoryInfo(service.category);
                                    const Icon = catInfo.icon;
                                    const suggestions = catalogData[service.category] || [];

                                    return (
                                        <div key={service.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catInfo.color}`}>
                                                <Icon size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 uppercase w-20 flex-shrink-0">{catInfo.label}</span>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={service.name}
                                                    onChange={(e) => updateService(service.id, e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                                                    placeholder={`Nombre de ${catInfo.label.toLowerCase()}...`}
                                                    list={`suggestions-${service.id}`}
                                                />
                                                {suggestions.length > 0 && (
                                                    <datalist id={`suggestions-${service.id}`}>
                                                        {suggestions.map((s, i) => (
                                                            <option key={i} value={s} />
                                                        ))}
                                                    </datalist>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeService(service.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botones para agregar servicios */}
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => addService(cat.value)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors`}
                                    >
                                        <Icon size={14} />
                                        + {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PAX, Precio, Fecha */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">PAX</label>
                            <input
                                type="number"
                                min={1}
                                value={form.pax}
                                onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio (USD)</label>
                            <input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !form.leadName.trim()}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-marga-yellow text-marga-text shadow-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Guardando...' : 'Crear Cotización'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
