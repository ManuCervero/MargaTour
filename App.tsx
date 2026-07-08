import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History, FileText, Truck, Map, MapPin, Globe, Star, Wine, Bed, Utensils, Settings, Search, Bell, ChevronDown, Users, UserCog, Compass, LogOut, Menu, X, MessageCircle, Calculator } from 'lucide-react';
import { ViewState, Lead, LeadStatus } from './types';
import { api, clearToken, getStoredUser, onAuthError, setStoredUser, setToken } from './lib/api';
import { KanbanView } from './views/KanbanView';
import { LeadDrawer } from './components/LeadDrawer';
import { LoginPage } from './components/LoginPage';
import { GlobalSearch } from './components/GlobalSearch';
import { TransfersView, UsersView, ClientsView, GenericPlaceholderView, RegionsView, WineriesView, HotelsView, RestaurantsView, ActivitiesView, ExperiencesView, RoutesView } from './views/DataViews';
import { QuotesView } from './views/QuotesView';
import { AccountingView } from './views/AccountingView';

const App: React.FC = () => {
  const [user, setUser] = useState<Record<string, string> | null>(() => getStoredUser());
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.QUOTES);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    onAuthError(() => setUser(null));
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      api.from('leads').select('*').then(({ data, error }) => {
        if (!error && data) setLeads(data as any);
      });
    }
    setSessionLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setUser(getStoredUser());
    api.from('leads').select('*').then(({ data, error }) => {
      if (!error && data) setLeads(data as any);
    });
  };

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

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const userName = user?.name || user?.username || 'Usuario';

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-marga-wine flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-marga-cream/30 border-t-marga-cream rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  const SidebarItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => { handleViewChange(view); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 mb-1 ${currentView === view
        ? 'bg-marga-wine text-marga-cream shadow-sm'
        : 'text-marga-dark/60 hover:bg-marga-creamDark hover:text-marga-dark'
        }`}
    >
      <Icon size={18} className={currentView === view ? 'text-marga-cream' : 'text-marga-dark/40'} />
      <span>{label}</span>
    </button>
  );

  const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="px-4 text-[11px] font-bold text-marga-dark/40 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="flex h-screen bg-marga-cream w-full font-sans">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-marga-dark/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-marga-creamDark flex flex-col fixed inset-y-0 z-40 shadow-[4px_0_24px_-12px_rgba(74,28,45,0.12)] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        <div className="h-16 flex items-center px-4 border-b border-marga-creamDark bg-white justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-marga-wine rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EDEDDD"/></svg>
            </div>
            <h1 className="text-lg font-extrabold text-marga-wine tracking-tight leading-none hidden md:block font-display uppercase">Marga Tour</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-marga-dark/40 hover:text-marga-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <SidebarSection title="Operación">
            <SidebarItem view={ViewState.QUOTES} icon={FileText} label="Cotizaciones" />
            <SidebarItem view={ViewState.CLIENTS} icon={Users} label="Clientes" />
            <SidebarItem view={ViewState.ACCOUNTING} icon={Calculator} label="Contable" />
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

          <SidebarSection title="Comunicación">
            <SidebarItem view={ViewState.LEADS} icon={LayoutDashboard} label="Leads" />
            <SidebarItem view={ViewState.HISTORY} icon={History} label="Historial" />
          </SidebarSection>

        </div>

        <div className="p-4 border-t border-marga-creamDark">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-marga-wine flex items-center justify-center text-xs font-extrabold text-marga-cream uppercase">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-marga-dark capitalize truncate">{userName}</p>
              <p className="text-[10px] text-marga-dark/40 truncate">{user?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-marga-dark/50 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
          <p className="text-[10px] text-marga-dark/25 text-center mt-2">v1.0.4 · Marga CRM</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-x-hidden relative bg-marga-cream min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-marga-creamDark flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 gap-3">

          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-marga-wine rounded-lg flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EDEDDD"/></svg>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <GlobalSearch onNavigate={handleViewChange} />
          </div>

          {/* Bell */}
          <button className="relative p-2 text-marga-dark/40 hover:text-marga-wine hover:bg-marga-creamDark rounded-full transition-colors flex-shrink-0">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-marga-wine rounded-full border-2 border-white"></span>
          </button>
        </header>

        {/* View Content */}
        <div className="flex-1 min-h-0 min-w-0 overflow-x-hidden relative pb-16 md:pb-0">
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
          </div>

          {currentView === ViewState.LEADS && (
            <div className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
              <div className="px-8 py-6">
                <h2 className="text-2xl font-bold text-marga-wine font-display uppercase">Tablero de Leads</h2>
                <p className="text-sm text-marga-dark/50 mt-1">Gestiona las oportunidades y seguimientos activos.</p>
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
          {currentView === ViewState.ACCOUNTING && <AccountingView />}

          {/* Fallback for other views */}
          {![ViewState.LEADS, ViewState.QUOTES, ViewState.TRANSFERS, ViewState.CLIENTS, ViewState.USERS, ViewState.REGIONS, ViewState.WINERIES, ViewState.HOTELS, ViewState.RESTAURANTS, ViewState.ACTIVITIES, ViewState.EXPERIENCES, ViewState.ROUTES, ViewState.ACCOUNTING].includes(currentView) && (
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
        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-marga-creamDark flex items-center justify-around px-2 py-2 safe-area-pb">
          {[
            { view: ViewState.LEADS, icon: LayoutDashboard, label: 'Leads' },
            { view: ViewState.QUOTES, icon: FileText, label: 'Cotizaciones' },
            { view: ViewState.CLIENTS, icon: Users, label: 'Clientes' },
            { view: ViewState.WINERIES, icon: Wine, label: 'Bodegas' },
          ].map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                currentView === view ? 'text-marga-wine' : 'text-marga-dark/40'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${currentView === view ? 'bg-marga-wine/10' : ''}`}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-marga-dark/40"
          >
            <div className="p-1.5 rounded-xl">
              <Menu size={18} />
            </div>
            <span className="text-[10px] font-semibold">Más</span>
          </button>
        </nav>
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
