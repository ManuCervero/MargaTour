import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Wine, Bed, Utensils, Compass, Star, Users, Truck, X } from 'lucide-react';
import { api } from '../lib/api';
import { ViewState } from '../types';

interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  type: string;
  view: ViewState;
  icon: React.ElementType;
  iconColor: string;
}

interface GlobalSearchProps {
  onNavigate: (view: ViewState) => void;
}

const ENTITY_CONFIG: Array<{
  table: string;
  label: string;
  view: ViewState;
  icon: React.ElementType;
  iconColor: string;
  subtitleKey?: string;
}> = [
  { table: 'wineries',     label: 'Bodega',      view: ViewState.WINERIES,     icon: Wine,    iconColor: 'text-marga-wine', subtitleKey: 'region' },
  { table: 'hotels',       label: 'Hotel',        view: ViewState.HOTELS,       icon: Bed,     iconColor: 'text-blue-500',   subtitleKey: 'region' },
  { table: 'restaurants',  label: 'Restaurante',  view: ViewState.RESTAURANTS,  icon: Utensils,iconColor: 'text-orange-500', subtitleKey: 'region' },
  { table: 'activities',   label: 'Actividad',    view: ViewState.ACTIVITIES,   icon: Compass, iconColor: 'text-green-500',  subtitleKey: 'region' },
  { table: 'experiences',  label: 'Experiencia',  view: ViewState.EXPERIENCES,  icon: Star,    iconColor: 'text-marga-olive', subtitleKey: 'region' },
  { table: 'clients',      label: 'Cliente',      view: ViewState.CLIENTS,      icon: Users,   iconColor: 'text-teal-500',   subtitleKey: 'email' },
  { table: 'transfers',    label: 'Transfer',     view: ViewState.TRANSFERS,    icon: Truck,   iconColor: 'text-gray-500',   subtitleKey: 'type' },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetches = ENTITY_CONFIG.map(cfg =>
      new Promise<SearchResult[]>(resolve => {
        api.from(cfg.table).select('*').then(({ data }) => {
          const matched = (data as any[])
            .filter(item => item.name?.toLowerCase().includes(term))
            .slice(0, 4)
            .map(item => ({
              id: item.id,
              name: item.name,
              subtitle: cfg.subtitleKey ? item[cfg.subtitleKey] : undefined,
              type: cfg.label,
              view: cfg.view,
              icon: cfg.icon,
              iconColor: cfg.iconColor,
            }));
          resolve(matched);
        });
      })
    );

    const all = await Promise.all(fetches);
    setResults(all.flat());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.view);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar bodega, hotel, restaurante..."
        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-marga-creamDark rounded-lg focus:outline-none focus:ring-2 focus:ring-marga-wine/20 focus:border-marga-wine transition-all text-sm"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-marga-wine transition-colors"
        >
          <X size={14} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-marga-creamDark z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-marga-creamDark border-t-marga-wine rounded-full animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">
              Sin resultados para <span className="font-semibold text-gray-600">"{query}"</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((result, i) => {
                const Icon = result.icon;
                return (
                  <li key={`${result.type}-${result.id}-${i}`}>
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-marga-cream transition-colors text-left"
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center ${result.iconColor}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.name}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {result.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
