import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Phone, Clock, RefreshCw, Navigation, Search, LocateFixed } from 'lucide-react';
import ResourceMap from '../components/maps/ResourceMap';
import ResourceDetail from '../components/resources/ResourceDetail';
import { getResources, initializeResourcesForLocation, fetchRealPlacesFromGoogle } from '../services/resourceService';
import { useMapContext } from '../components/maps/MapProvider';
import type { Resource } from '../types';

const typeFilters: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📍' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'shelter', label: 'Shelter', icon: '🏠' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'fuel', label: 'Fuel', icon: '⛽' },
];

const statusBadge: Record<string, string> = {
  open: 'badge-success',
  closed: 'badge-danger',
  limited: 'badge-warning',
};

const typeColors: Record<string, { bg: string; text: string }> = {
  hospital: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  pharmacy: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  shelter: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' },
  water: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  fuel: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
};

export default function EmergencyMap() {
  const [searchParams] = useSearchParams();
  const { isLoaded } = useMapContext();
  const [activeType, setActiveType] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location and initialize resources nearby
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(loc);
          initializeResourcesForLocation(loc.lat, loc.lng).then(() => {
            const data = getResources({ type: activeType === 'all' ? undefined : activeType });
            setResources(data);
            // Check for highlight param from AI assistant
            const highlightId = searchParams.get('highlight');
            if (highlightId) {
              const found = data.find((r) => r.id === highlightId || r.id === decodeURIComponent(highlightId));
              if (found) setSelectedResource(found);
            }
          });
        },
        () => {
          setResources(getResources({ type: activeType === 'all' ? undefined : activeType }));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setResources(getResources({ type: activeType === 'all' ? undefined : activeType }));
    }
  }, []);

  // Handle highlight param changes (e.g., from AI assistant navigation)
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && resources.length > 0) {
      const found = resources.find((r) => r.id === highlightId || r.id === decodeURIComponent(highlightId));
      if (found) {
        setSelectedResource(found);
        setMapCenter({ lat: found.lat, lng: found.lng });
      }
    }
  }, [searchParams, resources]);

  const loadResources = () => {
    const data = getResources({ type: activeType === 'all' ? undefined : activeType });
    setResources(data);
  };

  useEffect(() => {
    loadResources();
  }, [activeType]);

  const handleReturnToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(loc);
          setSearchQuery('');
          initializeResourcesForLocation(loc.lat, loc.lng, true).then(() => {
            const data = getResources({ type: activeType === 'all' ? undefined : activeType });
            setResources(data);
          });
        },
        () => {
          alert('Location access denied. Please enable location permissions in your browser.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Location search using Google Geocoding
  const handleLocationSearch = () => {
    if (!searchQuery.trim() || !isLoaded) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, async (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        setMapCenter(loc);

        // Fetch new resources for the searched location
        const newResources = await fetchRealPlacesFromGoogle(loc.lat, loc.lng);
        if (newResources.length > 0) {
          localStorage.setItem('civichub_resources', JSON.stringify(newResources));
          setResources(newResources);
        }
      }
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
            placeholder="Search any location (e.g., New York, Paris...)"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button onClick={handleLocationSearch} className="btn btn-primary text-sm">
          <Navigation size={14} /> Go
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveType(f.value); setSelectedResource(null); }}
              className={`btn text-xs ${activeType === f.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleReturnToCurrentLocation} className="btn text-xs text-cyan-500 hover:text-cyan-400" style={{ background: 'rgba(6, 182, 212, 0.1)' }} title="Return to My Location">
            <LocateFixed size={14} className="mr-1 inline" /> My Location
          </button>
          <button onClick={loadResources} className="btn btn-secondary text-xs" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-secondary text-xs">
            <Filter size={14} /> Status
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {resources.length} resources found
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          — click a marker for details
        </span>
      </div>

      {/* Map + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ height: '520px' }}>
          <ResourceMap
            resources={resources}
            onResourceSelect={(r) => setSelectedResource(r)}
            center={mapCenter}
            highlightedId={selectedResource?.id}
          />
        </div>

        {/* Side Panel */}
        <div className="card" style={{ maxHeight: '520px', overflow: 'auto' }}>
          {selectedResource ? (
            <ResourceDetail
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
              onUpdate={() => {
                loadResources();
                const updated = getResources().find((r) => r.id === selectedResource.id);
                if (updated) setSelectedResource(updated);
              }}
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Nearby Resources
              </h3>
              <div className="space-y-2">
                {resources.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResource(res)}
                    className="w-full text-left p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all"
                    style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: typeColors[res.type]?.bg }}
                        >
                          <MapPin size={14} style={{ color: typeColors[res.type]?.text }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {res.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {res.address}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${statusBadge[res.status]} text-[10px]`}>
                        {res.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs ml-10" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {res.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {res.hours}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
