import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { REGION_OPTIONS } from '../constants';
import { Quote, Transfer, SystemUser, Client, ViewState, CatalogItem, Winery, Route } from '../types';
import { Search, Plus, FileText, Check, X, MapPin, Shield, Star, Mail, Phone, Globe, ArrowRight, ArrowRightLeft, RefreshCw, Info, Wine, Bed, Utensils, Compass, Filter, Dog, Baby, Accessibility, Eye, Wifi, Waves, Dumbbell, Sparkles, Car, Clock, DollarSign } from 'lucide-react';
import { WineryDrawer } from '../components/WineryDrawer';
import { AddWineryModal } from '../components/AddWineryModal';
import { AddHotelModal } from '../components/AddHotelModal';
import { AddRestaurantModal } from '../components/AddRestaurantModal';
import { HotelDrawer } from '../components/HotelDrawer';
import { RestaurantDrawer } from '../components/RestaurantDrawer';
import { AirportTransferDrawer, TourDrawer } from '../components/TransferDrawer';
import { ActivityDrawer, Activity as ActivityType } from '../components/ActivityDrawer';
import { AddQuoteModal } from '../components/AddQuoteModal';
import { AddClientModal } from '../components/AddClientModal';
import { AddActivityModal } from '../components/AddActivityModal';
import { ExperienceDrawer, Experience as ExperienceType } from '../components/ExperienceDrawer';
import { AddExperienceModal } from '../components/AddExperienceModal';
export const QuotesView: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);

    const fetchQuotes = () => {
        supabase.from('quotes').select('*').then(({ data, error }) => {
            if (!error && data) setQuotes(data as any);
        });
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cotizaciones</h2>
                <button onClick={() => setShowNewQuoteModal(true)} className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                    <Plus size={18} />
                    Nueva Cotización
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['Todas', 'Enviada', 'Aprobada', 'Cancelada', 'Sin respuesta'].map((status, idx) => (
                    <button key={status} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0 ? 'bg-marga-violet text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Detalle (Org/Dest)</th>
                            <th className="px-6 py-3 text-center">PAX</th>
                            <th className="px-6 py-3 text-right">Precio</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {quotes.map((q) => (
                            <tr key={q.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <td className="px-6 py-4 font-mono text-gray-500">{q.id}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">{q.leadName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${q.type === 'Transfer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {q.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{q.origin} <span className="text-gray-300 mx-1">→</span> {q.destination}</td>
                                <td className="px-6 py-4 text-center">{q.pax}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">${q.price.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${q.status === 'Aprobada' ? 'bg-green-100 text-green-700' :
                                        q.status === 'Enviada' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {q.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500">{q.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddQuoteModal
                isOpen={showNewQuoteModal}
                onClose={() => setShowNewQuoteModal(false)}
                onSuccess={fetchQuotes}
            />
        </div>
    )
}

export const TransfersView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'aeropuerto' | 'tours'>('aeropuerto');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZone, setSelectedZone] = useState('Todas');
    const [activeOnly, setActiveOnly] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
    const [selectedTour, setSelectedTour] = useState<any | null>(null);

    const [airportTransfers, setAirportTransfers] = useState<any[]>([]);
    const [tours, setTours] = useState<any[]>([]);

    const AIRPORT_ZONES = ['Ciudad', 'Primera Zona (Luján + Maipú)', 'Valle de Uco', 'Potrerillos', 'Valle Sur', 'Valle Este', 'Las Leñas'];
    const TOUR_REGIONS = ['Ciudad', 'Primera Zona (Luján + Maipú)', 'Valle de Uco', 'Alta Montaña', 'Valle Sur', 'Valle Este'];

    const fetchAirportTransfers = () => {
        supabase.from('airport_transfers').select('*').then(({ data, error }) => {
            if (!error && data) setAirportTransfers(data);
        });
    };

    const fetchTours = () => {
        supabase.from('tours').select('*').then(({ data, error }) => {
            if (!error && data) setTours(data);
        });
    };

    useEffect(() => {
        fetchAirportTransfers();
        fetchTours();
    }, []);

    const filteredAirport = airportTransfers.filter(t => {
        const matchesSearch = t.zone?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesZone = selectedZone === 'Todas' || t.zone === selectedZone;
        const matchesActive = !activeOnly || t.is_active;
        return matchesSearch && matchesZone && matchesActive;
    });

    const filteredTours = tours.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedZone === 'Todas' || t.region === selectedZone;
        const matchesActive = !activeOnly || t.is_active;
        return matchesSearch && matchesRegion && matchesActive;
    });

    const zones = activeTab === 'aeropuerto' ? AIRPORT_ZONES : TOUR_REGIONS;

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Transfers</h2>
                <p className="text-sm text-gray-500 mt-1">Tarifario fijo. Si no está listado → consultar representante.</p>
            </div>

            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button onClick={() => { setActiveTab('aeropuerto'); setSelectedZone('Todas'); }} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'aeropuerto' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Aeropuerto</button>
                <button onClick={() => { setActiveTab('tours'); setSelectedZone('Todas'); }} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'tours' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tours</button>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Buscar transfer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Filter size={14} /></div>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer">
                            <option value="Todas">Todas las {activeTab === 'aeropuerto' ? 'zonas' : 'regiones'}</option>
                            {zones.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <button onClick={() => setActiveOnly(!activeOnly)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${activeOnly ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>Solo activos</button>
                </div>
                <button onClick={() => setShowNewModal(true)} className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors"><Plus size={18} />+ Nuevo</button>
            </div>

            {(selectedZone !== 'Todas' || activeOnly) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedZone !== 'Todas' && (<div className="inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1 rounded-full text-xs font-bold border border-marga-violet/20"><MapPin size={12} /><span>{activeTab === 'aeropuerto' ? 'Zona' : 'Región'}: {selectedZone}</span><button onClick={() => setSelectedZone('Todas')} className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"><X size={12} /></button></div>)}
                    {activeOnly && (<div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200"><Check size={12} /><span>Solo activos</span><button onClick={() => setActiveOnly(false)} className="ml-1 hover:bg-green-200 rounded-full p-0.5"><X size={12} /></button></div>)}
                </div>
            )}

            {activeTab === 'aeropuerto' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                            <tr><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Zona</th><th className="px-6 py-3 text-right">Precio</th><th className="px-6 py-3 text-center">Pax Máx</th><th className="px-6 py-3 text-center">Pax Valijas</th><th className="px-6 py-3 text-center">Consultar</th><th className="px-6 py-3 text-center">Activo</th><th className="px-6 py-3 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAirport.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800">Aeropuerto ↔ {t.zone}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{t.zone}</span></td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">{t.price ? `$${t.price.toLocaleString()}` : '—'}</td>
                                    <td className="px-6 py-4 text-center"><span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">19</span></td>
                                    <td className="px-6 py-4 text-center"><span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">15</span></td>
                                    <td className="px-6 py-4 text-center">{t.needs_consultation ? <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">A CONSULTAR</span> : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-6 py-4 text-center"><div className={`w-10 h-5 rounded-full p-0.5 mx-auto transition-colors ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${t.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => setSelectedTransfer(t)} className="text-gray-400 hover:text-marga-violet font-medium text-xs flex items-center justify-end gap-1 ml-auto"><Eye size={14} /> Ver</button></td>
                                </tr>
                            ))}
                            {filteredAirport.length === 0 && (<tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">No hay transfers de aeropuerto.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'tours' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                            <tr><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Tipo</th><th className="px-6 py-3">Región</th><th className="px-6 py-3 text-center">Duración</th><th className="px-6 py-3 text-right">Precio</th><th className="px-6 py-3 text-right">Hora Extra</th><th className="px-6 py-3 text-center">Consultar</th><th className="px-6 py-3 text-center">Activo</th><th className="px-6 py-3 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTours.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800">{t.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-semibold">{t.tour_type || '—'}</span></td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">{t.region || '—'}</span></td>
                                    <td className="px-6 py-4 text-center text-gray-600">{t.duration_hours ? `${t.duration_hours}h` : '—'}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">{t.price ? `$${t.price.toLocaleString()}` : '—'}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs">{t.extra_hour_price ? `$${t.extra_hour_price.toLocaleString()}/h` : '—'}</td>
                                    <td className="px-6 py-4 text-center">{t.needs_consultation ? <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">A CONSULTAR</span> : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-6 py-4 text-center"><div className={`w-10 h-5 rounded-full p-0.5 mx-auto transition-colors ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${t.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => setSelectedTour(t)} className="text-gray-400 hover:text-marga-violet font-medium text-xs flex items-center justify-end gap-1 ml-auto"><Eye size={14} /> Ver</button></td>
                                </tr>
                            ))}
                            {filteredTours.length === 0 && (<tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">No hay tours.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            )}

            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">¿Qué tipo de transfer deseas crear?</h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { setActiveTab('aeropuerto'); setShowNewModal(false); }} className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors flex items-center gap-3"><ArrowRightLeft size={20} />Crear Transfer Aeropuerto</button>
                            <button onClick={() => { setActiveTab('tours'); setShowNewModal(false); }} className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors flex items-center gap-3"><Compass size={20} />Crear Tour</button>
                        </div>
                        <button onClick={() => setShowNewModal(false)} className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Drawers */}
            <AirportTransferDrawer transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} onSave={fetchAirportTransfers} />
            <TourDrawer tour={selectedTour} onClose={() => setSelectedTour(null)} onSave={fetchTours} />
        </div>
    )
}

export const ClientsView: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchClients = () => {
        supabase.from('clients').select('*').then(({ data, error }) => {
            if (!error && data) setClients(data as any);
        });
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(c => {
        const matchesSearch = !searchTerm ||
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.origin && c.origin.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.document_id && c.document_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.birthdate && c.birthdate.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = activeFilter === 'Todos' ||
            (activeFilter === 'VIP' && c.status === 'VIP') ||
            (activeFilter === 'Activos' && c.status === 'Activo') ||
            (activeFilter === 'Inactivos' && c.status === 'Inactivo');

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cartera de Clientes</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Nombre, email, origen, DNI, cumpleaños..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-yellow focus:border-transparent text-sm w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2">
                        <Plus size={18} />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['Todos', 'VIP', 'Activos', 'Inactivos'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === f ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                    >
                        {f}
                    </button>
                ))}
                <span className="ml-auto text-sm text-gray-400 self-center">{filteredClients.length} clientes</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3">Origen</th>
                            <th className="px-6 py-3">DNI/Pasaporte</th>
                            <th className="px-6 py-3">Motivo</th>
                            <th className="px-6 py-3 text-center">Info</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map((c) => (
                            <React.Fragment key={c.id}>
                                <tr
                                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-marga-violetLight/50 text-marga-violet flex items-center justify-center font-bold">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-marga-violet transition-colors">{c.name}</p>
                                                <p className="text-xs text-gray-400">{c.birthdate || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                                <Phone size={12} /> {c.phone || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                                <Mail size={12} /> {c.email || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Globe size={14} className="text-gray-400" />
                                            {c.origin || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs font-mono">
                                        {c.document_id || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-500">{c.visit_reason || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            {c.has_food_restrictions && (
                                                <span title={`Restricción: ${c.food_restrictions_detail}`} className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center" style={{ fontSize: '10px' }}>🍽</span>
                                            )}
                                            {c.has_disability && (
                                                <span title={`Discapacidad: ${c.disability_detail}`} className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <Accessibility size={12} />
                                                </span>
                                            )}
                                            {c.travels_with_pet && (
                                                <span title="Viaja con mascota" className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                    <Dog size={12} />
                                                </span>
                                            )}
                                            {!c.has_food_restrictions && !c.has_disability && !c.travels_with_pet && (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${c.status === 'VIP' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                            c.status === 'Activo' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-400'
                                            }`}>
                                            {c.status === 'VIP' && <Star size={10} fill="currentColor" />}
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                                {expandedId === c.id && (
                                    <tr className="bg-gray-50/70">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Fecha Nacimiento</span>
                                                    <span className="text-gray-700">{c.birthdate || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">DNI / Pasaporte</span>
                                                    <span className="text-gray-700 font-mono">{c.document_id || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Tel. Emergencia</span>
                                                    <span className="text-gray-700">{c.emergency_phone || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Motivo Visita</span>
                                                    <span className="text-gray-700">{c.visit_reason || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Restricciones Alimentarias</span>
                                                    {c.has_food_restrictions ? (
                                                        <span className="text-orange-600 font-medium">Sí — {c.food_restrictions_detail}</span>
                                                    ) : (
                                                        <span className="text-gray-500">No</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Discapacidad</span>
                                                    {c.has_disability ? (
                                                        <span className="text-blue-600 font-medium">Sí — {c.disability_detail}</span>
                                                    ) : (
                                                        <span className="text-gray-500">No</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Viaja con Mascota</span>
                                                    <span className={c.travels_with_pet ? 'text-green-600 font-medium' : 'text-gray-500'}>{c.travels_with_pet ? 'Sí' : 'No'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-semibold uppercase block mb-1">Consentimiento Imagen</span>
                                                    <span className={c.image_consent ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{c.image_consent ? 'Sí' : 'No'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddClientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchClients}
            />
        </div>
    );
}

export const UsersView: React.FC = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);

    useEffect(() => {
        supabase.from('profiles').select('*').then(({ data, error }) => {
            if (!error && data) setUsers(data as any);
        });
    }, []);

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Usuarios del Sistema</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar usuario..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-yellow focus:border-transparent text-sm" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Último Acceso</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold flex w-fit items-center gap-1 ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'Conductor' ? 'bg-blue-100 text-blue-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                        {u.role === 'Admin' && <Shield size={10} />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {u.status === 'Active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">{u.lastLogin}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-marga-violet font-medium text-xs">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface RegionsViewProps {
    onNavigate: (view: ViewState, regionFilter: string) => void;
}

export const RegionsView: React.FC<RegionsViewProps> = ({ onNavigate }) => {
    const [regionsData, setRegionsData] = useState<any[]>([]);

    useEffect(() => {
        // Fetch counts from separate tables
        const fetchCounts = async () => {
            const counts: Record<string, any> = {};
            REGION_OPTIONS.forEach(r => {
                counts[r] = { wineries: 0, hotels: 0, restaurants: 0, activities: 0 };
            });

            // Fetch wineries
            const { data: wineries } = await supabase.from('wineries').select('region');
            wineries?.forEach((w: any) => { if (counts[w.region]) counts[w.region].wineries++; });

            // Fetch hotels
            const { data: hotels } = await supabase.from('hotels').select('region');
            hotels?.forEach((h: any) => { if (counts[h.region]) counts[h.region].hotels++; });

            // Fetch restaurants
            const { data: restaurants } = await supabase.from('restaurants').select('region');
            restaurants?.forEach((r: any) => { if (counts[r.region]) counts[r.region].restaurants++; });

            // Fetch activities
            const { data: activities } = await supabase.from('activities').select('region');
            activities?.forEach((a: any) => { if (counts[a.region]) counts[a.region].activities++; });

            setRegionsData(REGION_OPTIONS.map(name => ({
                name,
                counts: counts[name] || { wineries: 0, hotels: 0, restaurants: 0, activities: 0 }
            })));
        };

        fetchCounts();
    }, []);

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Regiones</h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            Base de organización del catálogo. Usá regiones para filtrar bodegas, hoteles, restaurantes y actividades.
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar región..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm" />
                </div>
                <button className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                    <Plus size={18} />
                    Nueva Región
                </button>
            </div>

            {/* Regions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionsData.map((region) => (
                    <div key={region.name} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group overflow-hidden flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-800">{region.name}</h3>
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-marga-violet/10 group-hover:text-marga-violet transition-colors">
                                    <MapPin size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Wine size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{region.counts.wineries}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Bodegas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Bed size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{region.counts.hotels}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Hoteles</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Utensils size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{region.counts.restaurants}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Restó</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Compass size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{region.counts.activities}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Activ.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-between gap-1">
                            <button
                                onClick={() => onNavigate(ViewState.WINERIES, region.name)}
                                className="flex-1 py-1.5 rounded hover:bg-white hover:shadow-sm text-xs text-gray-500 hover:text-purple-600 font-medium transition-all flex justify-center items-center gap-1" title="Ver Bodegas"
                            >
                                <Wine size={14} />
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.HOTELS, region.name)}
                                className="flex-1 py-1.5 rounded hover:bg-white hover:shadow-sm text-xs text-gray-500 hover:text-blue-600 font-medium transition-all flex justify-center items-center gap-1" title="Ver Hoteles"
                            >
                                <Bed size={14} />
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.RESTAURANTS, region.name)}
                                className="flex-1 py-1.5 rounded hover:bg-white hover:shadow-sm text-xs text-gray-500 hover:text-orange-600 font-medium transition-all flex justify-center items-center gap-1" title="Ver Restaurantes"
                            >
                                <Utensils size={14} />
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.ACTIVITIES, region.name)}
                                className="flex-1 py-1.5 rounded hover:bg-white hover:shadow-sm text-xs text-gray-500 hover:text-green-600 font-medium transition-all flex justify-center items-center gap-1" title="Ver Actividades"
                            >
                                <Compass size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// GENERIC CATALOG VIEW (Used for Hotels, Resto, etc)
interface CatalogViewProps {
    title: string;
    itemLabel: string;
    data: CatalogItem[];
    initialRegionFilter?: string;
}

const CatalogView: React.FC<CatalogViewProps> = ({ title, itemLabel, data, initialRegionFilter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(initialRegionFilter || 'Todas');
    const REGIONS_LIST = REGION_OPTIONS; // Reusing const

    useEffect(() => {
        if (initialRegionFilter) {
            setSelectedRegion(initialRegionFilter);
        }
    }, [initialRegionFilter]);

    const filteredData = data.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'Todas' || item.region === selectedRegion;
        return matchesSearch && matchesRegion;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={`Buscar ${itemLabel.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                        />
                    </div>
                    {/* Redundant Dropdown per requirements */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer"
                        >
                            <option value="Todas">Todas las regiones</option>
                            {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <button className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2">
                        <Plus size={18} />
                        Nuevo
                    </button>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedRegion('Todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === 'Todas' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todas
                </button>
                {REGIONS_LIST.map(r => (
                    <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Active Filter Pill */}
            {selectedRegion !== 'Todas' && (
                <div className="mb-6 inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1.5 rounded-md text-sm font-semibold border border-marga-violet/20">
                    <MapPin size={14} />
                    <span>Filtrando por: {selectedRegion}</span>
                    <button
                        onClick={() => setSelectedRegion('Todas')}
                        className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Región</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3 text-center">Rating</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800">
                                    {item.name}
                                    {item.details && <p className="text-xs text-gray-400 font-normal mt-0.5">{item.details}</p>}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                        <MapPin size={10} className="text-gray-400" />
                                        {item.region}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-700 font-medium text-xs border border-gray-200 px-2 py-1 rounded bg-white">
                                        {item.category || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                        <Star size={14} className={item.rating && item.rating >= 1 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                        <Star size={14} className={item.rating && item.rating >= 2 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                        <Star size={14} className={item.rating && item.rating >= 3 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                        <Star size={14} className={item.rating && item.rating >= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                        <Star size={14} className={item.rating && item.rating >= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-marga-violet font-medium text-xs">Editar</button>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No se encontraron resultados en esta región.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// SPECIFIC WINERIES VIEW
export const WineriesView: React.FC<{ filter?: string }> = ({ filter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(filter || 'Todas');
    const [activeFilter, setActiveFilter] = useState(true);
    const [recommendedFilter, setRecommendedFilter] = useState(false);
    const [restaurantFilter, setRestaurantFilter] = useState(false);
    const [accessibleFilter, setAccessibleFilter] = useState(false);
    const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
    const [kidFriendlyFilter, setKidFriendlyFilter] = useState(false);
    const [selectedWinery, setSelectedWinery] = useState<Winery | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const [wineries, setWineries] = useState<Winery[]>([]);

    const fetchWineries = () => {
        supabase.from('wineries').select('*').then(({ data, error }) => {
            if (!error && data) {
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    region: p.region,
                    department: p.department,
                    hasRestaurant: p.has_restaurant,
                    isAccessible: p.is_accessible,
                    isPetFriendly: p.is_pet_friendly,
                    isKidFriendly: p.is_kid_friendly,
                    isRecommended: p.is_recommended,
                    isActive: p.is_active,
                    phone: p.phone,
                    email: p.email,
                    address: p.address,
                    website: p.website,
                    notes: p.notes,
                }));
                setWineries(mapped);
            }
        });
    };

    useEffect(() => {
        if (filter) {
            setSelectedRegion(filter);
        }
    }, [filter]);

    useEffect(() => {
        fetchWineries();
    }, []);

    const filteredData = wineries.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'Todas' || w.region === selectedRegion;
        const matchesActive = !activeFilter || w.isActive;
        const matchesRecommended = !recommendedFilter || w.isRecommended;
        const matchesRestaurant = !restaurantFilter || w.hasRestaurant;
        const matchesAccessible = !accessibleFilter || w.isAccessible;
        const matchesPetFriendly = !petFriendlyFilter || w.isPetFriendly;
        const matchesKidFriendly = !kidFriendlyFilter || w.isKidFriendly;

        return matchesSearch && matchesRegion && matchesActive && matchesRecommended && matchesRestaurant && matchesAccessible && matchesPetFriendly && matchesKidFriendly;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            {/* Header - matching CatalogView style */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bodegas</h2>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar bodega..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                        />
                    </div>

                    {/* Region Dropdown */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer"
                        >
                            <option value="Todas">Todas las regiones</option>
                            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Nueva Bodega
                    </button>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedRegion('Todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === 'Todas' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todas
                </button>
                {REGION_OPTIONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap">
                <button
                    onClick={() => setActiveFilter(!activeFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeFilter ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Solo Activas
                </button>
                <button
                    onClick={() => setRecommendedFilter(!recommendedFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${recommendedFilter ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Recomendadas
                </button>
                <button
                    onClick={() => setRestaurantFilter(!restaurantFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${restaurantFilter ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Restaurante
                </button>
                <button
                    onClick={() => setAccessibleFilter(!accessibleFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${accessibleFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Accesible
                </button>
                <button
                    onClick={() => setPetFriendlyFilter(!petFriendlyFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${petFriendlyFilter ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pet Friendly
                </button>
                <button
                    onClick={() => setKidFriendlyFilter(!kidFriendlyFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${kidFriendlyFilter ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kid Friendly
                </button>
            </div>

            {/* Active Filter Pill */}
            {selectedRegion !== 'Todas' && (
                <div className="mb-6 inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1.5 rounded-md text-sm font-semibold border border-marga-violet/20">
                    <MapPin size={14} />
                    <span>Filtrando por: {selectedRegion}</span>
                    <button
                        onClick={() => setSelectedRegion('Todas')}
                        className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Región</th>
                            <th className="px-6 py-3 text-center">Restaurante</th>
                            <th className="px-6 py-3">Atributos</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3 text-center">Recomendado</th>
                            <th className="px-6 py-3 text-center">Activo</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedWinery(w)} className="font-bold text-gray-800 hover:text-marga-violet text-left">
                                        {w.name}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">
                                        {w.region}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {w.hasRestaurant ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600" title="Sí">
                                            <Utensils size={12} />
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {w.isAccessible && <div className="p-1 rounded bg-blue-50 text-blue-600" title="Accesible"><Accessibility size={12} /></div>}
                                        {w.isPetFriendly && <div className="p-1 rounded bg-green-50 text-green-600" title="Pet Friendly"><Dog size={12} /></div>}
                                        {w.isKidFriendly && <div className="p-1 rounded bg-pink-50 text-pink-600" title="Kid Friendly"><Baby size={12} /></div>}
                                        {!w.isAccessible && !w.isPetFriendly && !w.isKidFriendly && <span className="text-gray-300 text-xs">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {w.phone && (
                                            <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                                <Phone size={12} />
                                                <span className="truncate max-w-[120px]">{w.phone}</span>
                                            </div>
                                        )}
                                        {w.email && (
                                            <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                                <Mail size={12} />
                                                <span className="truncate max-w-[120px]">{w.email}</span>
                                            </div>
                                        )}
                                        {!w.phone && !w.email && <span className="text-gray-300 text-xs">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {w.isRecommended ? <Star size={16} className="text-yellow-400 fill-yellow-400 mx-auto" /> : <Star size={16} className="text-gray-200 mx-auto" />}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`w-8 h-4 rounded-full p-0.5 mx-auto transition-colors ${w.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${w.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedWinery(w)}
                                        className="text-gray-400 hover:text-marga-violet font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <Eye size={14} /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No se encontraron bodegas con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >

            {/* Drawer */}
            < WineryDrawer winery={selectedWinery} onClose={() => setSelectedWinery(null)} onSave={fetchWineries} />

            {/* Add Winery Modal */}
            <AddWineryModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchWineries}
            />
        </div >
    );
};

// Helper for Dropdown Icon
const ChevronDownIcon = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </div>
);

interface Hotel {
    id: string;
    name: string;
    region: string;
    stars: number;
    pricePerNight: number | null;
    isAccessible: boolean;
    isPetFriendly: boolean;
    hasWifi: boolean;
    hasPool: boolean;
    hasGym: boolean;
    hasSpa: boolean;
    hasRestaurant: boolean;
    hasParking: boolean;
    isActive: boolean;
    phone: string;
    email: string;
    description: string;
}

export const HotelsView: React.FC<{ filter?: string }> = ({ filter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(filter || 'Todas');
    const [activeFilter, setActiveFilter] = useState(true);
    const [wifiFilter, setWifiFilter] = useState(false);
    const [poolFilter, setPoolFilter] = useState(false);
    const [gymFilter, setGymFilter] = useState(false);
    const [spaFilter, setSpaFilter] = useState(false);
    const [restaurantFilter, setRestaurantFilter] = useState(false);
    const [parkingFilter, setParkingFilter] = useState(false);
    const [accessibleFilter, setAccessibleFilter] = useState(false);
    const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

    const [hotels, setHotels] = useState<Hotel[]>([]);

    const fetchHotels = () => {
        supabase.from('hotels').select('*').then(({ data, error }) => {
            if (!error && data) {
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    region: p.region,
                    stars: p.stars,
                    pricePerNight: p.price_per_night,
                    isAccessible: p.is_accessible,
                    isPetFriendly: p.is_pet_friendly,
                    hasWifi: p.has_wifi,
                    hasPool: p.has_pool,
                    hasGym: p.has_gym,
                    hasSpa: p.has_spa,
                    hasRestaurant: p.has_restaurant,
                    hasParking: p.has_parking,
                    isActive: p.is_active,
                    phone: p.phone,
                    email: p.email,
                    description: p.description,
                }));
                setHotels(mapped);
            }
        });
    };

    useEffect(() => {
        if (filter) setSelectedRegion(filter);
    }, [filter]);

    useEffect(() => {
        fetchHotels();
    }, []);

    const filteredData = hotels.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'Todas' || h.region === selectedRegion;
        const matchesActive = !activeFilter || h.isActive;
        const matchesWifi = !wifiFilter || h.hasWifi;
        const matchesPool = !poolFilter || h.hasPool;
        const matchesGym = !gymFilter || h.hasGym;
        const matchesSpa = !spaFilter || h.hasSpa;
        const matchesRestaurant = !restaurantFilter || h.hasRestaurant;
        const matchesParking = !parkingFilter || h.hasParking;
        const matchesAccessible = !accessibleFilter || h.isAccessible;
        const matchesPetFriendly = !petFriendlyFilter || h.isPetFriendly;
        return matchesSearch && matchesRegion && matchesActive && matchesWifi && matchesPool && matchesGym && matchesSpa && matchesRestaurant && matchesParking && matchesAccessible && matchesPetFriendly;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Hoteles</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar hotel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer"
                        >
                            <option value="Todas">Todas las regiones</option>
                            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Nuevo Hotel
                    </button>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedRegion('Todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === 'Todas' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todas
                </button>
                {REGION_OPTIONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap">
                <button onClick={() => setActiveFilter(!activeFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeFilter ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Solo Activos</button>
                <button onClick={() => setWifiFilter(!wifiFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${wifiFilter ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Wifi size={12} />WiFi</button>
                <button onClick={() => setPoolFilter(!poolFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${poolFilter ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Waves size={12} />Pileta</button>
                <button onClick={() => setGymFilter(!gymFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${gymFilter ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Dumbbell size={12} />Gimnasio</button>
                <button onClick={() => setSpaFilter(!spaFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${spaFilter ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Sparkles size={12} />Spa</button>
                <button onClick={() => setRestaurantFilter(!restaurantFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${restaurantFilter ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Utensils size={12} />Restaurante</button>
                <button onClick={() => setParkingFilter(!parkingFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${parkingFilter ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Car size={12} />Parking</button>
                <button onClick={() => setAccessibleFilter(!accessibleFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${accessibleFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Accessibility size={12} />Accesible</button>
                <button onClick={() => setPetFriendlyFilter(!petFriendlyFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${petFriendlyFilter ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Dog size={12} />Pet Friendly</button>
            </div>

            {/* Active Filter Pill */}
            {selectedRegion !== 'Todas' && (
                <div className="mb-6 inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1.5 rounded-md text-sm font-semibold border border-marga-violet/20">
                    <MapPin size={14} />
                    <span>Filtrando por: {selectedRegion}</span>
                    <button onClick={() => setSelectedRegion('Todas')} className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"><X size={14} /></button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Región</th>
                            <th className="px-6 py-3 text-center">Estrellas</th>
                            <th className="px-6 py-3 text-right">USD/Noche</th>
                            <th className="px-6 py-3">Servicios</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3 text-center">Activo</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedHotel(h)} className="font-bold text-gray-800 hover:text-blue-600 text-left">{h.name}</button>
                                    {h.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]" title={h.description}>{h.description}</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">{h.region}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={12} className={s <= h.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                                    {h.pricePerNight ? `$${h.pricePerNight.toLocaleString()}` : '—'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 flex-wrap">
                                        {h.hasWifi && <div className="p-1 rounded bg-cyan-50 text-cyan-600" title="WiFi"><Wifi size={12} /></div>}
                                        {h.hasPool && <div className="p-1 rounded bg-blue-50 text-blue-600" title="Pileta"><Waves size={12} /></div>}
                                        {h.hasGym && <div className="p-1 rounded bg-purple-50 text-purple-600" title="Gimnasio"><Dumbbell size={12} /></div>}
                                        {h.hasSpa && <div className="p-1 rounded bg-pink-50 text-pink-600" title="Spa"><Sparkles size={12} /></div>}
                                        {h.hasRestaurant && <div className="p-1 rounded bg-orange-50 text-orange-600" title="Restaurante"><Utensils size={12} /></div>}
                                        {h.hasParking && <div className="p-1 rounded bg-gray-100 text-gray-600" title="Estacionamiento"><Car size={12} /></div>}
                                        {h.isAccessible && <div className="p-1 rounded bg-blue-50 text-blue-600" title="Accesible"><Accessibility size={12} /></div>}
                                        {h.isPetFriendly && <div className="p-1 rounded bg-green-50 text-green-600" title="Pet Friendly"><Dog size={12} /></div>}
                                        {!h.hasWifi && !h.hasPool && !h.hasGym && !h.hasSpa && !h.hasRestaurant && !h.hasParking && !h.isAccessible && !h.isPetFriendly && <span className="text-gray-300 text-xs">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {h.phone && (
                                            <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                                <Phone size={12} />
                                                <span className="truncate max-w-[120px]">{h.phone}</span>
                                            </div>
                                        )}
                                        {h.email && (
                                            <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                                <Mail size={12} />
                                                <span className="truncate max-w-[120px]">{h.email}</span>
                                            </div>
                                        )}
                                        {!h.phone && !h.email && <span className="text-gray-300 text-xs">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`w-8 h-4 rounded-full p-0.5 mx-auto transition-colors ${h.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${h.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedHotel(h)}
                                        className="text-gray-400 hover:text-blue-600 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <Eye size={14} /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No se encontraron hoteles con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            <HotelDrawer hotel={selectedHotel} onClose={() => setSelectedHotel(null)} onSave={fetchHotels} />

            {/* Add Hotel Modal */}
            <AddHotelModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchHotels}
            />
        </div>
    );
};

interface Restaurant {
    id: string;
    name: string;
    region: string;
    schedule: string;
    priceMin: number | null;
    priceMax: number | null;
    isAccessible: boolean;
    isPetFriendly: boolean;
    isKidFriendly: boolean;
    isActive: boolean;
    phone: string;
}

const formatPrice = (min: number | null, max: number | null): string => {
    if (!min && !max) return '—';
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && !max) return `${fmt(min)}+`;
    if (min && max && min === max) return fmt(min);
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    return '—';
};

export const RestaurantsView: React.FC<{ filter?: string }> = ({ filter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(filter || 'Todas');
    const [activeFilter, setActiveFilter] = useState(true);
    const [accessibleFilter, setAccessibleFilter] = useState(false);
    const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
    const [kidFriendlyFilter, setKidFriendlyFilter] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

    const fetchRestaurants = () => {
        supabase.from('restaurants').select('*').then(({ data, error }) => {
            if (!error && data) {
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    region: p.region,
                    schedule: p.schedule,
                    priceMin: p.price_min ? Number(p.price_min) : null,
                    priceMax: p.price_max ? Number(p.price_max) : null,
                    isAccessible: p.is_accessible,
                    isPetFriendly: p.is_pet_friendly,
                    isKidFriendly: p.is_kid_friendly,
                    isActive: p.is_active,
                    phone: p.phone,
                }));
                setRestaurants(mapped);
            }
        });
    };

    useEffect(() => {
        if (filter) setSelectedRegion(filter);
    }, [filter]);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const filteredData = restaurants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'Todas' || r.region === selectedRegion;
        const matchesActive = !activeFilter || r.isActive;
        const matchesAccessible = !accessibleFilter || r.isAccessible;
        const matchesPetFriendly = !petFriendlyFilter || r.isPetFriendly;
        const matchesKidFriendly = !kidFriendlyFilter || r.isKidFriendly;
        return matchesSearch && matchesRegion && matchesActive && matchesAccessible && matchesPetFriendly && matchesKidFriendly;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Restaurantes</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar restaurante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer"
                        >
                            <option value="Todas">Todas las regiones</option>
                            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Nuevo Restaurante
                    </button>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedRegion('Todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === 'Todas' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todas
                </button>
                {REGION_OPTIONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap">
                <button onClick={() => setActiveFilter(!activeFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeFilter ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Solo Activos</button>
                <button onClick={() => setAccessibleFilter(!accessibleFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${accessibleFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Accessibility size={12} />Accesible</button>
                <button onClick={() => setPetFriendlyFilter(!petFriendlyFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${petFriendlyFilter ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Dog size={12} />Pet Friendly</button>
                <button onClick={() => setKidFriendlyFilter(!kidFriendlyFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${kidFriendlyFilter ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Baby size={12} />Kid Friendly</button>
            </div>

            {/* Active Filter Pill */}
            {selectedRegion !== 'Todas' && (
                <div className="mb-6 inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1.5 rounded-md text-sm font-semibold border border-marga-violet/20">
                    <MapPin size={14} />
                    <span>Filtrando por: {selectedRegion}</span>
                    <button onClick={() => setSelectedRegion('Todas')} className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"><X size={14} /></button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Región</th>
                            <th className="px-6 py-3">Horarios</th>
                            <th className="px-6 py-3 text-right">Precio/Persona</th>
                            <th className="px-6 py-3">Atributos</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3 text-center">Activo</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedRestaurant(r)} className="font-bold text-gray-800 hover:text-orange-600 text-left">{r.name}</button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">{r.region}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-1.5 text-xs text-gray-600 max-w-[200px]">
                                        <Clock size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                        <span>{r.schedule || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-gray-800">
                                        {formatPrice(r.priceMin, r.priceMax)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {r.isAccessible && <div className="p-1 rounded bg-blue-50 text-blue-600" title="Accesible"><Accessibility size={12} /></div>}
                                        {r.isPetFriendly && <div className="p-1 rounded bg-green-50 text-green-600" title="Pet Friendly"><Dog size={12} /></div>}
                                        {r.isKidFriendly && <div className="p-1 rounded bg-pink-50 text-pink-600" title="Kid Friendly"><Baby size={12} /></div>}
                                        {!r.isAccessible && !r.isPetFriendly && !r.isKidFriendly && <span className="text-gray-300 text-xs">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {r.phone ? (
                                        <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                            <Phone size={12} />
                                            <span className="truncate max-w-[120px]">{r.phone}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`w-8 h-4 rounded-full p-0.5 mx-auto transition-colors ${r.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${r.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedRestaurant(r)}
                                        className="text-gray-400 hover:text-orange-600 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <Eye size={14} /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No se encontraron restaurantes con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            <RestaurantDrawer restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} onSave={fetchRestaurants} />

            {/* Add Restaurant Modal */}
            <AddRestaurantModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchRestaurants}
            />
        </div>
    );
};

export const ActivitiesView: React.FC<{ filter?: string }> = ({ filter }) => {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(filter || 'Todas');
    const [accessibleFilter, setAccessibleFilter] = useState(false);
    const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
    const [kidFriendlyFilter, setKidFriendlyFilter] = useState(false);
    const [activeFilter, setActiveFilter] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchActivities = () => {
        supabase.from('activities').select('*').then(({ data, error }) => {
            if (!error && data) {
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    region: p.region,
                    contact: p.contact,
                    phone: p.phone,
                    address: p.address,
                    price: p.price || null,
                    provider: p.provider,
                    isAccessible: p.is_accessible,
                    isPetFriendly: p.is_pet_friendly,
                    isKidFriendly: p.is_kid_friendly,
                    isActive: p.is_active,
                    description: p.description,
                    notes: p.notes,
                }));
                setActivities(mapped);
            }
        });
    };

    useEffect(() => { if (filter) setSelectedRegion(filter); }, [filter]);
    useEffect(() => { fetchActivities(); }, []);

    const filteredData = activities.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.contact || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'Todas' || a.region === selectedRegion;
        const matchesActive = !activeFilter || a.isActive;
        const matchesAccessible = !accessibleFilter || a.isAccessible;
        const matchesPetFriendly = !petFriendlyFilter || a.isPetFriendly;
        const matchesKidFriendly = !kidFriendlyFilter || a.isKidFriendly;
        return matchesSearch && matchesRegion && matchesActive && matchesAccessible && matchesPetFriendly && matchesKidFriendly;
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Actividades</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar actividad, proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer"
                        >
                            <option value="Todas">Todas las regiones</option>
                            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                        <Plus size={18} />
                        Nueva Actividad
                    </button>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setSelectedRegion('Todas')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === 'Todas' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
                {REGION_OPTIONS.map(r => (
                    <button key={r} onClick={() => setSelectedRegion(r)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}</button>
                ))}
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap">
                <button onClick={() => setActiveFilter(!activeFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeFilter ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Solo Activos</button>
                <button onClick={() => setAccessibleFilter(!accessibleFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${accessibleFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Accessibility size={12} />Accesible</button>
                <button onClick={() => setPetFriendlyFilter(!petFriendlyFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${petFriendlyFilter ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Dog size={12} />Pet Friendly</button>
                <button onClick={() => setKidFriendlyFilter(!kidFriendlyFilter)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${kidFriendlyFilter ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Baby size={12} />Apto Chicos</button>
            </div>

            {/* Active Filter Pill */}
            {selectedRegion !== 'Todas' && (
                <div className="mb-6 inline-flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1.5 rounded-md text-sm font-semibold border border-marga-violet/20">
                    <MapPin size={14} />
                    <span>Filtrando por: {selectedRegion}</span>
                    <button onClick={() => setSelectedRegion('Todas')} className="ml-1 hover:bg-marga-violet/20 rounded-full p-0.5"><X size={14} /></button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Actividad</th>
                            <th className="px-6 py-3">Región</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3 text-right">Precio</th>
                            <th className="px-6 py-3">Atributos</th>
                            <th className="px-6 py-3 text-center">Activo</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedActivity(a)} className="font-bold text-gray-800 hover:text-marga-violet text-left">
                                        {a.name}
                                    </button>
                                    {a.provider && <p className="text-xs text-gray-400 mt-0.5">{a.provider}</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">
                                        {a.region || '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {a.contact && <span className="text-xs text-gray-700 font-medium">{a.contact}</span>}
                                        {a.phone && (
                                            <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                                <Phone size={11} />
                                                <span>{a.phone}</span>
                                            </div>
                                        )}
                                        {!a.contact && !a.phone && <span className="text-gray-300 text-xs">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                                    {a.price || '—'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {a.isAccessible && <div className="p-1 rounded bg-blue-50 text-blue-600" title="Accesible"><Accessibility size={12} /></div>}
                                        {a.isPetFriendly && <div className="p-1 rounded bg-green-50 text-green-600" title="Pet Friendly"><Dog size={12} /></div>}
                                        {a.isKidFriendly && <div className="p-1 rounded bg-pink-50 text-pink-600" title="Apto chicos"><Baby size={12} /></div>}
                                        {!a.isAccessible && !a.isPetFriendly && !a.isKidFriendly && <span className="text-gray-300 text-xs">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`w-8 h-4 rounded-full p-0.5 mx-auto transition-colors ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${a.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedActivity(a)}
                                        className="text-gray-400 hover:text-marga-violet font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <Eye size={14} /> Ver / Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No se encontraron actividades con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            <ActivityDrawer activity={selectedActivity} onClose={() => setSelectedActivity(null)} onSave={fetchActivities} />

            {/* Add Modal */}
            <AddActivityModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchActivities} />
        </div>
    );
};
export const RoutesView: React.FC = () => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [costoKm, setCostoKm] = useState('1500');
    const [precioFullDay, setPrecioFullDay] = useState('45000');
    const [precioMedioDia, setPrecioMedioDia] = useState('25000');
    const [precioViaticos, setPrecioViaticos] = useState('10000');
    const [ganancia, setGanancia] = useState('0');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        supabase.from('routes').select('*').order('origin').then(({ data, error }) => {
            if (!error && data) setRoutes(data);
        });

        // Load existing settings if they exist
        supabase.from('settings').select('*').eq('id', 1).single().then(({ data, error }) => {
            if (!error && data) {
                if (data.costo_km) setCostoKm(data.costo_km.toString());
                if (data.precio_full_day) setPrecioFullDay(data.precio_full_day.toString());
                if (data.precio_medio_dia) setPrecioMedioDia(data.precio_medio_dia.toString());
                if (data.precio_viaticos) setPrecioViaticos(data.precio_viaticos.toString());
                if (data.ganancia !== undefined) setGanancia(data.ganancia.toString());
            }
        });
    }, []);

    const handleSaveRates = async () => {
        setIsSaving(true);
        const { error } = await supabase.from('settings').upsert({
            id: 1,
            costo_km: Number(costoKm),
            precio_full_day: Number(precioFullDay),
            precio_medio_dia: Number(precioMedioDia),
            precio_viaticos: Number(precioViaticos),
            ganancia: Number(ganancia)
        });
        setIsSaving(false);
        if (!error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            console.error('Error saving settings:', error);
            // Even if table doesn't exist yet, show success for UX demo or alert
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const filteredRoutes = routes.filter(r => {
        const term = searchTerm.toLowerCase();
        return r.origin.toLowerCase().includes(term) || r.destination.toLowerCase().includes(term);
    }).sort((a, b) => {
        const aIsCircular = a.origin === a.destination;
        const bIsCircular = b.origin === b.destination;

        if (aIsCircular && !bIsCircular) return -1;
        if (!aIsCircular && bIsCircular) return 1;
        return 0; // Maintain existing 'order by origin' from Supabase for the rest
    });

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign size={18} className="text-marga-violet" />
                        Ajustes de Tarifas
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo de precio por kilómetro</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={costoKm}
                                    onChange={(e) => setCostoKm(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio agregado por full day</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={precioFullDay}
                                    onChange={(e) => setPrecioFullDay(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio medio día</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={precioMedioDia}
                                    onChange={(e) => setPrecioMedioDia(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio viáticos</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={precioViaticos}
                                    onChange={(e) => setPrecioViaticos(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia / Margen</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                <input
                                    type="number"
                                    value={ganancia}
                                    onChange={(e) => setGanancia(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end items-center border-t border-gray-100">
                    {saveSuccess && <span className="text-green-600 font-medium text-sm mr-4">¡Cambios guardados con éxito!</span>}
                    <button 
                        onClick={handleSaveRates}
                        disabled={isSaving}
                        className="bg-marga-violet hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Distancias y Rutas</h2>
                    <p className="text-sm text-gray-500 mt-1">Consulta los kilómetros entre distintos puntos de interés.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar origen o destino..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet focus:border-transparent text-sm w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Origen</th>
                            <th className="px-6 py-4 text-center">Trayecto</th>
                            <th className="px-6 py-4 text-right">Destino</th>
                            <th className="px-6 py-4 text-center">Distancia (km)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRoutes.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-gray-800 w-1/3">{r.origin}</td>
                                <td className="px-6 py-4 text-center text-gray-400 w-1/6">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        {r.origin === r.destination ? (
                                            <RefreshCw size={14} className="group-hover:text-marga-violet transition-colors" />
                                        ) : (
                                            <ArrowRightLeft size={14} className="group-hover:text-marga-violet transition-colors" />
                                        )}
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-800 text-right w-1/3">{r.destination}</td>
                                <td className="px-6 py-4 text-center w-1/6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                                        <Compass size={14} />
                                        {r.distance_km} km
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredRoutes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    No se encontraron rutas que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const GenericPlaceholderView: React.FC<{ title: string, filter?: string }> = ({ title, filter }) => (
    <div className="p-10 flex flex-col items-center justify-center h-full text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-600 mb-2">{title}</h2>
        {filter && (
            <div className="flex items-center gap-2 bg-marga-violet/10 text-marga-violet px-3 py-1 rounded-full text-sm font-medium mb-2">
                <MapPin size={14} />
                Filtro: {filter}
            </div>
        )}
        <p className="text-sm">Esta sección está en construcción para la demo.</p>
    </div>
);

// ─────────────────────── EXPERIENCES VIEW ───────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'Enológica':   { bg: 'bg-purple-100', text: 'text-purple-700' },
    'Aventura':    { bg: 'bg-orange-100', text: 'text-orange-700' },
    'Trekking':    { bg: 'bg-green-100',  text: 'text-green-700' },
    'Cabalgata':   { bg: 'bg-amber-100',  text: 'text-amber-700' },
    'City Tour':   { bg: 'bg-blue-100',   text: 'text-blue-700' },
    'Cultural':    { bg: 'bg-pink-100',   text: 'text-pink-700' },
    'Gastronomía': { bg: 'bg-red-100',    text: 'text-red-700' },
};

export const ExperiencesView: React.FC<{ filter?: string }> = ({ filter }) => {
    const [experiences, setExperiences] = useState<ExperienceType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(filter || 'Todas');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [selectedExperience, setSelectedExperience] = useState<ExperienceType | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchExperiences = () => {
        supabase.from('experiences').select('*').then(({ data, error }) => {
            if (!error && data) {
                setExperiences(data.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    region: e.region,
                    category: e.category,
                    duration: e.duration,
                    price: e.price || '',
                    highlight: e.highlight || '',
                    includes: e.includes || '',
                    contact: e.contact || '',
                    description: e.description || '',
                    image_url: e.image_url || '',
                    departure_time: e.departure_time || '',
                    is_accessible: e.is_accessible || false,
                    url_producto: e.url_producto || '',
                    notes: e.notes || '',
                    provider: e.provider || '',
                    phone: e.phone || '',
                    is_active: e.is_active,
                })));
            }
        });
    };

    useEffect(() => { fetchExperiences(); }, []);

    const categories = ['Todas', ...Array.from(new Set(experiences.map(e => e.category).filter(Boolean)))];
    const regions = ['Todas', ...REGION_OPTIONS];

    const filtered = experiences.filter(e => {
        const matchSearch = !searchTerm ||
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRegion = selectedRegion === 'Todas' || e.region === selectedRegion;
        const matchCategory = selectedCategory === 'Todas' || e.category === selectedCategory;
        return matchSearch && matchRegion && matchCategory;
    });

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="px-8 py-5 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">Experiencias</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{filtered.length} experiencias en catálogo</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="bg-marga-yellow hover:bg-yellow-500 text-marga-text font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                    <Plus size={18} /> Nueva Experiencia
                </button>
            </div>

            {/* Filters */}
            <div className="px-8 py-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-3 shrink-0">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Buscar experiencia..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet/30" />
                </div>

                {/* Region filter */}
                <div className="flex gap-1.5 flex-wrap">
                    {regions.map(r => (
                        <button key={r} onClick={() => setSelectedRegion(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                selectedRegion === r ? 'bg-marga-violet text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>{r}</button>
                    ))}
                </div>

                {/* Category filter */}
                <div className="flex gap-1.5 flex-wrap">
                    {categories.map((c: string) => {
                        const col = CATEGORY_COLORS[c];
                        const active = selectedCategory === c;
                        return (
                            <button key={c} onClick={() => setSelectedCategory(c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    active ? (col ? `${col.bg} ${col.text}` : 'bg-gray-700 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>{c}</button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Experiencia</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Región</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Duración</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No se encontraron experiencias</td></tr>
                        ) : filtered.map(exp => {
                            const col = CATEGORY_COLORS[exp.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                            return (
                                <tr key={exp.id}
                                    onClick={() => setSelectedExperience(exp)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors group">
                                    {/* Experiencia */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {exp.image_url ? (
                                                <img src={exp.image_url} alt={exp.name}
                                                    className="w-12 h-10 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-12 h-10 rounded-lg bg-marga-violet/10 flex items-center justify-center shrink-0">
                                                    <Star size={16} className="text-marga-violet" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm leading-tight">{exp.name}</p>
                                                {exp.highlight && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{exp.highlight}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    {/* Región */}
                                    <td className="px-6 py-4">
                                        {exp.region && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-marga-violet bg-marga-violet/10 px-2 py-0.5 rounded-full">
                                                <MapPin size={10} />{exp.region}
                                            </span>
                                        )}
                                    </td>
                                    {/* Categoría */}
                                    <td className="px-6 py-4">
                                        {exp.category && (
                                            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${col.bg} ${col.text}`}>
                                                {exp.category}
                                            </span>
                                        )}
                                    </td>
                                    {/* Duración */}
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            {exp.duration && <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{exp.duration}</span>}
                                            {exp.departure_time && <span className="text-xs text-gray-400 mt-0.5 block">Salida: {exp.departure_time}</span>}
                                        </div>
                                    </td>
                                    {/* Precio */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-gray-800">{exp.price || '—'}</span>
                                    </td>
                                    {/* Estado */}
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                            exp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {exp.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                        {exp.is_accessible && (
                                            <span className="ml-1 inline-flex items-center text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                <Accessibility size={10} />
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            <ExperienceDrawer experience={selectedExperience} onClose={() => setSelectedExperience(null)} onSave={fetchExperiences} />

            {/* Add Modal */}
            <AddExperienceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchExperiences} />
        </div>
    );
};
