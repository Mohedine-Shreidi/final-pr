import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useState, useCallback, useEffect } from 'react';
import { useMapContext } from './MapProvider';
import { Map, MapPin, Navigation } from 'lucide-react';
import type { Resource } from '../../types';

const containerStyle = { width: '100%', height: '100%' };

// Fallback if geolocation fails — will be overridden by user location
const FALLBACK_CENTER = { lat: 31.955, lng: 35.915 };

const typeIcons: Record<string, { color: string; label: string }> = {
  hospital: { color: '#ef4444', label: '🏥' },
  pharmacy: { color: '#10b981', label: '💊' },
  shelter: { color: '#8b5cf6', label: '🏠' },
  water: { color: '#3b82f6', label: '💧' },
  fuel: { color: '#f59e0b', label: '⛽' },
};

const statusColors: Record<string, string> = {
  open: '#10b981',
  closed: '#ef4444',
  limited: '#f59e0b',
};

interface ResourceMapProps {
  resources: Resource[];
  onResourceSelect?: (resource: Resource) => void;
  center?: { lat: number; lng: number };
  markers?: { lat: number; lng: number; title: string; color?: string }[];
}

export default function ResourceMap({
  resources,
  onResourceSelect,
  center: propCenter,
  markers,
}: ResourceMapProps) {
  const { isLoaded, hasKey } = useMapContext();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Get user's real location via browser geolocation API
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        console.warn('[Geolocation] Permission denied or unavailable:', error.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // The effective center: prop > user location > fallback
  const effectiveCenter = propCenter || userLocation || FALLBACK_CENTER;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(void map);
  }, [map]);

  /* ---- Fallback: Interactive CSS Map ---- */
  if (!hasKey || !isLoaded) {
    return (
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1929 0%, #142438 40%, #1a3050 100%)',
          minHeight: '400px',
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`h${i}`} className="absolute w-full border-t border-cyan-400/30" style={{ top: `${(i + 1) * 8}%` }} />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`v${i}`} className="absolute h-full border-l border-cyan-400/30" style={{ left: `${(i + 1) * 6}%` }} />
          ))}
        </div>

        {/* Plotted resource markers */}
        {resources.map((res, i) => {
          // Position relative to effective center
          const relLng = (res.lng - effectiveCenter.lng) * 800;
          const relLat = (res.lat - effectiveCenter.lat) * 800;
          const x = 50 + relLng;
          const y = 50 - relLat;
          const icon = typeIcons[res.type];
          return (
            <button
              key={res.id}
              onClick={() => onResourceSelect?.(res)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
              style={{ left: `${Math.min(Math.max(x, 5), 95)}%`, top: `${Math.min(Math.max(y, 5), 90)}%` }}
              title={res.name}
            >
              <div
                className="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg cursor-pointer transition-all hover:scale-125 hover:z-20"
                style={{
                  background: `radial-gradient(circle, ${icon.color}44, ${icon.color}cc)`,
                  border: `2px solid ${statusColors[res.status]}`,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <span className="text-base">{icon.label}</span>
                {/* Pulse ring */}
                {res.status === 'open' && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: statusColors[res.status] }}
                  />
                )}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' }}>
                {res.name}
                <span className="ml-2 capitalize" style={{ color: statusColors[res.status] }}>● {res.status}</span>
              </div>
            </button>
          );
        })}

        {/* User location dot */}
        {userLocation && (
          <div className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: '50%', top: '50%' }}>
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-40" />
          </div>
        )}

        {/* Custom markers */}
        {markers?.map((m, i) => (
          <div
            key={i}
            className="absolute w-6 h-6 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{
              left: `${50 + (m.lng - effectiveCenter.lng) * 2000}%`,
              top: `${50 - (m.lat - effectiveCenter.lat) * 2000}%`,
              background: m.color || '#ef4444',
            }}
          >
            <MapPin size={14} className="text-white" />
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(15, 23, 42, 0.85)' }}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Legend</p>
          {Object.entries(typeIcons).map(([type, { color, label }]) => (
            <div key={type} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-4 h-4 rounded flex items-center justify-center text-[10px]" style={{ background: `${color}33` }}>
                {label}
              </span>
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Location status */}
        <div className="absolute top-3 right-3 glass rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(15, 23, 42, 0.85)' }}>
          {locationLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-[11px] text-slate-300">Locating you...</span>
            </>
          ) : userLocation ? (
            <>
              <Navigation size={12} className="text-cyan-400" />
              <span className="text-[11px] text-slate-300">Your location detected</span>
            </>
          ) : (
            <>
              <Map size={14} className="text-cyan-400" />
              <span className="text-[11px] text-slate-300">Enable location for nearby resources</span>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---- Real Google Maps ---- */
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={effectiveCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {/* User location marker */}
      {userLocation && (
        <MarkerF
          position={userLocation}
          title="Your location"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }}
        />
      )}

      {resources.map((res) => (
        <MarkerF
          key={res.id}
          position={{ lat: res.lat, lng: res.lng }}
          title={res.name}
          label={{ text: typeIcons[res.type]?.label || '📍', fontSize: '18px' }}
          onClick={() => {
            setSelectedResource(res);
            onResourceSelect?.(res);
          }}
        />
      ))}

      {selectedResource && (
        <InfoWindowF
          position={{ lat: selectedResource.lat, lng: selectedResource.lng }}
          onCloseClick={() => setSelectedResource(null)}
        >
          <div style={{ padding: '4px', maxWidth: '200px' }}>
            <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
              {selectedResource.name}
            </h4>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              {selectedResource.address}
            </p>
            <p style={{ fontSize: '12px', color: statusColors[selectedResource.status], fontWeight: 500 }}>
              ● {selectedResource.status.toUpperCase()}
            </p>
            <p style={{ fontSize: '11px', color: '#888' }}>
              {selectedResource.hours}
            </p>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
