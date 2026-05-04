import { useState, useEffect } from 'react';
import { Filter, MapPin, Phone, Clock, RefreshCw, Navigation } from 'lucide-react';
import ResourceMap from '../components/maps/ResourceMap';
import ResourceDetail from '../components/resources/ResourceDetail';
import { getResources, initializeResourcesForLocation } from '../services/resourceService';
import type { Resource, ResourceType } from '../types';

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
  const [activeType, setActiveType] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location and initialize resources nearby
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          // Generate real resources near the user's actual location via Google Places API
          initializeResourcesForLocation(loc.lat, loc.lng).then(() => {
            // Reload resources once data is fetched
            setResources(getResources({ type: activeType === 'all' ? undefined : activeType }));
          });
        },
        () => {
          // Geolocation denied — load with default data
          setResources(getResources({ type: activeType === 'all' ? undefined : activeType }));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setResources(getResources({ type: activeType === 'all' ? undefined : activeType }));
    }
  }, []);

  const loadResources = () => {
    const data = getResources({ type: activeType === 'all' ? undefined : activeType });
    setResources(data);
  };

  useEffect(() => {
    loadResources();
  }, [activeType]);

  return (
    <div className="space-y-4 animate-fade-in">
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
                // Re-select the updated resource
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
