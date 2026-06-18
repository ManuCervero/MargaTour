import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Plus, Trash2, Loader2, Save, Navigation, Search, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { Route } from '../types';

// Fix Leaflet default icon broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Waypoint {
  label: string;
  lat: number;
  lon: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Component that auto-fits map bounds when waypoints change
const MapFitter: React.FC<{ waypoints: Waypoint[] }> = ({ waypoints }) => {
  const map = useMap();
  useEffect(() => {
    const valid = waypoints.filter(w => w.lat && w.lon);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lon], 13);
    } else {
      const bounds = L.latLngBounds(valid.map(w => [w.lat, w.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [waypoints, map]);
  return null;
};

// Individual waypoint row with search
const WaypointRow: React.FC<{
  index: number;
  total: number;
  waypoint: Waypoint;
  onChange: (index: number, wp: Waypoint) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}> = ({ index, total, waypoint, onChange, onRemove, onMoveUp, onMoveDown }) => {
  const [query, setQuery] = useState(waypoint.label);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(waypoint.label);
  }, [waypoint.label]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value + ' Mendoza Argentina')}&format=json&limit=5&countrycodes=ar`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch { /* ignore */ }
      setLoading(false);
    }, 500);
  };

  const handleSelect = (result: NominatimResult) => {
    const label = result.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(label);
    setShowDropdown(false);
    setResults([]);
    onChange(index, { label, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
  };

  const labels = ['Origen', 'Parada', 'Destino'];
  const rowLabel = index === 0 ? 'Origen' : index === total - 1 ? 'Destino' : `Parada ${index}`;
  const dotColor = index === 0 ? 'bg-green-500' : index === total - 1 ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="flex items-start gap-2 mb-2" ref={containerRef}>
      <div className="flex flex-col items-center mt-2.5 gap-0.5">
        <div className={`w-3 h-3 rounded-full ${dotColor} flex-shrink-0`}></div>
        {index < total - 1 && <div className="w-px h-4 bg-gray-200"></div>}
      </div>
      <div className="flex-1 relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={`Buscar ${rowLabel.toLowerCase()}...`}
            className="w-full border border-marga-creamDark rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-marga-wine/30"
          />
          {loading
            ? <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            : <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          }
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] bg-white border border-marga-creamDark rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-marga-cream text-xs transition-colors border-b border-marga-creamDark last:border-0"
              >
                <span className="font-semibold text-gray-800">{r.display_name.split(',').slice(0, 2).join(',')}</span>
                <span className="text-gray-400 block truncate">{r.display_name.split(',').slice(2, 4).join(',')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 mt-1">
        <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
          <ArrowUp size={12} />
        </button>
        <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
          <ArrowDown size={12} />
        </button>
      </div>
      {total > 2 && (
        <button onClick={() => onRemove(index)} className="mt-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

interface RouteMapModalProps {
  route?: Route | null;
  initialWaypoints?: { label: string; lat: number; lon: number }[];
  onClose: () => void;
  onSave: (origin: string, destination: string, distanceKm: number, routeIdOrWaypoints?: string | { label: string; lat: number; lon: number }[], waypoints?: { label: string; lat: number; lon: number }[]) => Promise<void>;
  saveLabel?: string;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ route, initialWaypoints, onClose, onSave, saveLabel = 'Guardar ruta' }) => {
  const emptyWaypoint = (): Waypoint => ({ label: '', lat: 0, lon: 0 });

  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    if (initialWaypoints && initialWaypoints.length >= 2) {
      return initialWaypoints;
    }
    if (route) {
      return [
        { label: route.origin, lat: 0, lon: 0 },
        { label: route.destination, lat: 0, lon: 0 },
      ];
    }
    return [emptyWaypoint(), emptyWaypoint()];
  });

  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [totalKm, setTotalKm] = useState<number | null>(route?.distance_km ?? null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calcError, setCalcError] = useState('');

  const validWaypoints = waypoints.filter(w => w.lat !== 0 && w.lon !== 0);
  const canCalculate = validWaypoints.length >= 2;
  const canSave = totalKm !== null && waypoints[0].label && waypoints[waypoints.length - 1].label;

  const handleWaypointChange = (index: number, wp: Waypoint) => {
    setWaypoints(prev => prev.map((w, i) => i === index ? wp : w));
    setTotalKm(null);
    setRouteLine([]);
  };

  const handleRemove = (index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
    setTotalKm(null);
    setRouteLine([]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setWaypoints(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setTotalKm(null);
    setRouteLine([]);
  };

  const handleMoveDown = (index: number) => {
    if (index === waypoints.length - 1) return;
    setWaypoints(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setTotalKm(null);
    setRouteLine([]);
  };

  const calculateRoute = useCallback(async () => {
    if (!canCalculate) return;
    setCalculating(true);
    setCalcError('');
    try {
      const coords = validWaypoints.map(w => `${w.lon},${w.lat}`).join(';');
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) {
        setCalcError('No se pudo calcular la ruta. Verificá los puntos.');
        return;
      }
      const route = data.routes[0];
      const km = Math.round(route.distance / 100) / 10;
      setTotalKm(km);
      const line: [number, number][] = route.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );
      setRouteLine(line);
    } catch {
      setCalcError('Error de conexión con el servicio de rutas.');
    } finally {
      setCalculating(false);
    }
  }, [validWaypoints, canCalculate]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const origin = waypoints[0].label;
      const destination = waypoints[waypoints.length - 1].label;
      await onSave(origin, destination, totalKm!, route?.id, waypoints);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const mapCenter: [number, number] = validWaypoints.length > 0
    ? [validWaypoints[0].lat, validWaypoints[0].lon]
    : [-32.8908, -68.8272]; // Mendoza por defecto

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-marga-creamDark bg-gray-50">
          <div>
            <h2 className="text-lg font-extrabold text-marga-wine">
              {route ? 'Editar Ruta' : 'Nueva Ruta con Mapa'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Agregá paradas — se calcula el km total del recorrido</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-marga-wine hover:bg-marga-creamDark rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Left panel — waypoints */}
          <div className="w-full md:w-72 flex-shrink-0 border-r border-marga-creamDark flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Paradas del recorrido</p>
              {waypoints.map((wp, i) => (
                <WaypointRow
                  key={i}
                  index={i}
                  total={waypoints.length}
                  waypoint={wp}
                  onChange={handleWaypointChange}
                  onRemove={handleRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
              <button
                onClick={() => setWaypoints(prev => [...prev.slice(0, -1), emptyWaypoint(), prev[prev.length - 1]])}
                className="flex items-center gap-1.5 text-xs font-bold text-marga-wine border border-marga-wine/30 hover:bg-marga-wine/5 px-3 py-1.5 rounded-lg transition-colors w-full justify-center mt-2"
              >
                <Plus size={13} /> Agregar parada
              </button>
            </div>

            {/* Calculate button + result */}
            <div className="p-4 border-t border-marga-creamDark bg-gray-50">
              <button
                onClick={calculateRoute}
                disabled={!canCalculate || calculating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {calculating ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                {calculating ? 'Calculando...' : 'Calcular ruta'}
              </button>

              {calcError && (
                <p className="text-xs text-red-500 mt-2 text-center">{calcError}</p>
              )}

              {totalKm !== null && !calcError && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Distancia total</p>
                  <p className="text-2xl font-extrabold text-blue-700 mt-0.5">{totalKm} km</p>
                  <p className="text-xs text-blue-400 mt-0.5">{waypoints.filter(w => w.lat).length} paradas</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel — map */}
          <div className="flex-1 relative" style={{ minHeight: '300px' }}>
            <MapContainer
              center={mapCenter}
              zoom={validWaypoints.length > 0 ? 11 : 9}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFitter waypoints={validWaypoints} />
              {validWaypoints.map((wp, i) => (
                <Marker key={i} position={[wp.lat, wp.lon]} />
              ))}
              {routeLine.length > 0 && (
                <Polyline positions={routeLine} color="#4A1C2D" weight={4} opacity={0.8} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-marga-creamDark bg-white">
          <div className="text-xs text-gray-400">
            {canCalculate
              ? 'Calculá la ruta antes de guardar'
              : 'Seleccioná al menos 2 puntos en el mapa'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-marga-creamDark transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-marga-wine text-marga-cream hover:bg-marga-wineLight transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : saveLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
