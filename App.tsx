import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History, FileText, Truck, Map, MapPin, Globe, Star, Wine, Bed, Utensils, Settings, Search, Bell, ChevronDown, Users, UserCog, Compass, LogOut } from 'lucide-react';
import { ViewState, Lead, LeadStatus } from './types';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { KanbanView } from './views/KanbanView';
import { LeadDrawer } from './components/LeadDrawer';
import { LoginPage } from './components/LoginPage';
import { QuotesView, TransfersView, UsersView, ClientsView, GenericPlaceholderView, RegionsView, WineriesView, HotelsView, RestaurantsView, ActivitiesView, ExperiencesView, RoutesView } from './views/DataViews';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LEADS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('leads').select('*').then(({ data, error }) => {
      if (!error && data) {
        // Map database fields to frontend types if necessary, though they match closely now
        setLeads(data as any); // Type assertion for now, better to strictly type the DB response
      }
    });
  }, []);

  // Navigation Handler for Regions
  const handleNavigateWithRegion = (view: ViewState, region: string) => {
    setActiveRegionFilter(region);
    setCurrentView(view);
  };

  // Main navigation handler (resets filters)
  const handleViewChange = (view: ViewState) => {
    setActiveRegionFilter(undefined);
    setCurrentView(view);
  };

  // Bot Toggle Logic with automatic status transition
  const handleBotToggle = (leadId: string, isBot: boolean) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        // When switching to Human mode, automatically move to "En gestión" if not already in a terminal state
        let newStatus = l.status;
        if (!isBot && l.isBotActive) { // Switching from Bot to Human
          newStatus = LeadStatus.EN_GESTION;
        } else if (isBot && !l.isBotActive) { // Switching from Human to Bot
          // Reset to Nuevo or keep current if valid? For demo, reset to Nuevo to show it in Bot tray
          newStatus = LeadStatus.NUEVO;
        }
        return { ...l, isBotActive: isBot, status: newStatus };
      }
      return l;
    }));

    // Update selected lead if it's open
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => {
        if (!prev) return null;
        let newStatus = prev.status;
        if (!isBot && prev.isBotActive) {
          newStatus = LeadStatus.EN_GESTION;
        } else if (isBot && !prev.isBotActive) {
          newStatus = LeadStatus.NUEVO;
        }
        return { ...prev, isBotActive: isBot, status: newStatus };
      });
    }
  };

  // CTA Action: Pasar a Humano
  const handleHandoff = (leadId: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          isBotActive: false, // Switch to Human
          status: LeadStatus.EN_GESTION, // Move to 'En Gestión' column
          pendingDecision: false // Ensure pending decision is cleared just in case
        };
      }
      return l;
    }));
  };

  // CTA Action: Marcar Frío
  const handleMarkCold = (leadId: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: LeadStatus.FRIO
        };
      }
      return l;
    }));
  };

  // Known Contact Decision: Confirm BOT
  // Effect: Unlocks the card, sets mode to AUTO. Status remains NUEVO (user can now drag/bot can work).
  const handleConfirmBot = (leadId: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          pendingDecision: false, // Unlock
          isBotActive: true, // Ensure Bot is active
          status: LeadStatus.NUEVO // Explicitly stay in Nuevo
        };
      }
      return l;
    }));
  };

  // Known Contact Decision: Confirm HUMAN
  // Effect: Unlocks card, sets mode to HUMAN, Moves to EN GESTION.
  const handleConfirmHuman = (leadId: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          pendingDecision: false, // Unlock
          isBotActive: false, // Switch to Human
          status: LeadStatus.EN_GESTION // Auto-move to En Gestion
        };
      }
      return l;
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Obtener nombre del usuario logueado
  const userName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Usuario';

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLogin={() => {}} />;
  }

  const SidebarItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => handleViewChange(view)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 mb-1 ${currentView === view
        ? 'bg-marga-yellow text-marga-text shadow-sm'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <Icon size={18} className={currentView === view ? 'text-gray-800' : 'text-gray-400'} />
      <span>{label}</span>
    </button>
  );

  const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 w-full font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-marga-yellow rounded-xl flex items-center justify-center text-xl shadow-sm rotate-3">🐶</div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 tracking-tight leading-none">marga tour</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">

          <SidebarSection title="Operación">
            <SidebarItem view={ViewState.LEADS} icon={LayoutDashboard} label="Leads" />
            <SidebarItem view={ViewState.HISTORY} icon={History} label="Historial" />
            <SidebarItem view={ViewState.QUOTES} icon={FileText} label="Cotizaciones" />
            <SidebarItem view={ViewState.CLIENTS} icon={Users} label="Clientes" />
          </SidebarSection>

          <SidebarSection title="Servicios">
            <SidebarItem view={ViewState.TRANSFERS} icon={Truck} label="Transfers" />
            <SidebarItem view={ViewState.ROUTES} icon={Map} label="Rutas" />
          </SidebarSection>

          <SidebarSection title="Catálogo">
            <SidebarItem view={ViewState.REGIONS} icon={Globe} label="Regiones" />
            <SidebarItem view={ViewState.WINERIES} icon={Wine} label="Bodegas" />
            <SidebarItem view={ViewState.RESTAURANTS} icon={Utensils} label="Restaurantes" />
            <SidebarItem view={ViewState.HOTELS} icon={Bed} label="Hoteles" />
            <SidebarItem view={ViewState.ACTIVITIES} icon={Compass} label="Actividades" />
            <SidebarItem view={ViewState.EXPERIENCES} icon={Star} label="Experiencias" />
          </SidebarSection>

          <SidebarSection title="Sistema">
            <SidebarItem view={ViewState.USERS} icon={UserCog} label="Usuarios del Sistema" />
            <SidebarItem view={ViewState.CONFIG} icon={Settings} label="Configuración" />
          </SidebarSection>

        </div>

        {/* Simple Footer with logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-marga-yellow flex items-center justify-center text-xs font-extrabold text-gray-800 uppercase">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-700 capitalize truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
          <p className="text-[10px] text-gray-300 text-center mt-2">v1.0.4 · Marga CRM</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col h-screen relative bg-gray-50/50">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">

          {/* Global Search & Region Filter */}
          <div className="flex-1 flex items-center gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por teléfono, nombre, región..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-violet/20 focus:border-marga-violet transition-all text-sm"
              />
            </div>

            {/* Region Dropdown */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <Globe size={16} />
              </div>
              <select className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-marga-violet/20 cursor-pointer shadow-sm">
                <option>Todas las regiones</option>
                <option>Gran Mendoza</option>
                <option>Valle de Uco</option>
                <option>Sur (San Rafael)</option>
                <option>Alta Montaña</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Right Area: Notifications & User */}
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>


          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 min-h-0 min-w-0 relative">
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
          </div>

          {currentView === ViewState.LEADS && (
            <div className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
              <div className="px-8 py-6">
                <h2 className="text-2xl font-bold text-gray-800">Tablero de Leads</h2>
                <p className="text-sm text-gray-500 mt-1">Gestiona las oportunidades y seguimientos activos.</p>
              </div>
              <KanbanView
                leads={leads}
                onLeadClick={setSelectedLead}
                onToggleBot={handleBotToggle}
                onHandoff={handleHandoff}
                onMarkCold={handleMarkCold}
                onConfirmBot={handleConfirmBot}
                onConfirmHuman={handleConfirmHuman}
              />
            </div>
          )}

          {currentView === ViewState.QUOTES && <QuotesView />}
          {currentView === ViewState.TRANSFERS && <TransfersView />}
          {currentView === ViewState.CLIENTS && <ClientsView />}
          {currentView === ViewState.USERS && <UsersView />}
          {currentView === ViewState.REGIONS && <RegionsView onNavigate={handleNavigateWithRegion} />}
          {currentView === ViewState.WINERIES && <WineriesView filter={activeRegionFilter} />}
          {currentView === ViewState.HOTELS && <HotelsView filter={activeRegionFilter} />}
          {currentView === ViewState.RESTAURANTS && <RestaurantsView filter={activeRegionFilter} />}
          {currentView === ViewState.ACTIVITIES && <ActivitiesView filter={activeRegionFilter} />}
          {currentView === ViewState.EXPERIENCES && <ExperiencesView filter={activeRegionFilter} />}
          {currentView === ViewState.ROUTES && <RoutesView />}

          {/* Fallback for other views */}
          {![ViewState.LEADS, ViewState.QUOTES, ViewState.TRANSFERS, ViewState.CLIENTS, ViewState.USERS, ViewState.REGIONS, ViewState.WINERIES, ViewState.HOTELS, ViewState.RESTAURANTS, ViewState.ACTIVITIES, ViewState.EXPERIENCES, ViewState.ROUTES].includes(currentView) && (
            <GenericPlaceholderView
              title={
                currentView === ViewState.HISTORY ? "Historial" :
                  currentView === ViewState.CONFIG ? "Configuración" :
                    currentView
              }
              filter={activeRegionFilter}
            />
          )}
        </div>
      </main>

      {/* Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onToggleBot={handleBotToggle}
        />
      )}
    </div>
  );
};

export default App;
