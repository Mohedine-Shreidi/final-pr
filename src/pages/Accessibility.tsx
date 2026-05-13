import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useMapContext } from '../components/maps/MapProvider';
import {
  Navigation, MapPin, AlertCircle, Star, Plus, X, Send,
  Accessibility as AccessIcon, ThumbsUp, Map, LocateFixed
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAccessibilityPoints, getObstacles, addAccessibilityPoint,
  addObstacle, rateAccessibilityPoint, confirmObstacleVote,
  type AccessibilityPoint, type Obstacle, type AccessibilityPointType, type ObstacleType,
} from '../services/accessibilityService';
import Portal from '../components/layout/Portal';

const containerStyle = { width: '100%', height: '100%' };
const FALLBACK_CENTER = { lat: 31.955, lng: 35.915 };

const pointTypeIcons: Record<string, { emoji: string; color: string; label: string }> = {
  ramp: { emoji: '♿', color: '#10b981', label: 'Ramp' },
  elevator: { emoji: '🛗', color: '#3b82f6', label: 'Elevator' },
  restroom: { emoji: '🚻', color: '#8b5cf6', label: 'Restroom' },
  entrance: { emoji: '🚪', color: '#06b6d4', label: 'Entrance' },
  parking: { emoji: '🅿️', color: '#f59e0b', label: 'Parking' },
  pathway: { emoji: '🛤️', color: '#14b8a6', label: 'Pathway' },
};

const obstacleTypeLabels: Record<string, string> = {
  stairs: '🪜 Stairs',
  construction: '🚧 Construction',
  narrow_path: '↔️ Narrow Path',
  broken_ramp: '⚠️ Broken Ramp',
  no_curb_cut: '🚫 No Curb Cut',
  steep_slope: '📐 Steep Slope',
};

export default function AccessibilityPage() {
  const { isLoaded } = useMapContext();
  const { user } = useAuth();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeError, setRouteError] = useState('');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [travelMode, setTravelMode] = useState<string>('WALKING');
  const [loading, setLoading] = useState(false);

  const [points, setPoints] = useState<AccessibilityPoint[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<AccessibilityPoint | null>(null);
  const [activeTab, setActiveTab] = useState<'points' | 'obstacles'>('points');
  const [pointFilter, setPointFilter] = useState<AccessibilityPointType | 'all'>('all');

  const [showAddPoint, setShowAddPoint] = useState(false);
  const [showAddObstacle, setShowAddObstacle] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);

  // New point form
  const [newPointName, setNewPointName] = useState('');
  const [newPointType, setNewPointType] = useState<AccessibilityPointType>('ramp');
  const [newPointAddress, setNewPointAddress] = useState('');
  const [newPointFeatures, setNewPointFeatures] = useState('');

  // New obstacle form
  const [newObsDesc, setNewObsDesc] = useState('');
  const [newObsType, setNewObsType] = useState<ObstacleType>('construction');
  const [newObsAddress, setNewObsAddress] = useState('');
  const [newObsPermanent, setNewObsPermanent] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadData = async () => {
    const [pts, obs] = await Promise.all([
      getAccessibilityPoints({ type: pointFilter }),
      getObstacles(),
    ]);
    
    // Fallback sample data for presentations if database is empty
    if (pts.length === 0) {
      // Check if user is near the demo location (Amman)
      const isDemoArea = userLocation && Math.abs(userLocation.lat - 31.955) < 0.1 && Math.abs(userLocation.lng - 35.915) < 0.1;
      
      let samplePoints: AccessibilityPoint[] = [];
      
      if (isDemoArea || !userLocation) {
        samplePoints = [
          { id: 'p1', name: 'Al-Hussein Park Ramp', type: 'ramp', lat: 31.956, lng: 35.914, address: 'Main Entrance', rating: 4.8, ratingCount: 12, features: ['Wheelchair accessible', 'Wide'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'p2', name: 'City Mall Elevator', type: 'elevator', lat: 31.954, lng: 35.916, address: 'Gate 2', rating: 4.5, ratingCount: 8, features: ['Audio announcements', 'Spacious'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'p3', name: 'Boulevard Restroom', type: 'restroom', lat: 31.957, lng: 35.917, address: 'Ground Floor', rating: 4.2, ratingCount: 5, features: ['Grab bars', 'Emergency cord'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'p4', name: 'Hospital Accessible Parking', type: 'parking', lat: 31.953, lng: 35.913, address: 'West Wing', rating: 5.0, ratingCount: 3, features: ['Clearly marked', 'Near entrance'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'p5', name: 'Downtown Flat Pathway', type: 'pathway', lat: 31.955, lng: 35.918, address: 'King Faisal St', rating: 4.0, ratingCount: 15, features: ['No steps', 'Smooth surface'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
        ];
      } else {
        // Generate dynamic points around the user's real location
        const offset = () => (Math.random() - 0.5) * 0.02;
        samplePoints = [
          { id: 'dp1', name: 'Local Park Ramp', type: 'ramp', lat: userLocation.lat + offset(), lng: userLocation.lng + offset(), address: 'Park Entrance', rating: 4.5, ratingCount: 4, features: ['Gentle slope'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'dp2', name: 'Nearby Mall Elevator', type: 'elevator', lat: userLocation.lat + offset(), lng: userLocation.lng + offset(), address: 'Main Building', rating: 4.0, ratingCount: 2, features: ['Wide doors'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'dp3', name: 'Accessible Restroom', type: 'restroom', lat: userLocation.lat + offset(), lng: userLocation.lng + offset(), address: 'Public Square', rating: 4.2, ratingCount: 5, features: ['Grab bars'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
          { id: 'dp4', name: 'Reserved Parking', type: 'parking', lat: userLocation.lat + offset(), lng: userLocation.lng + offset(), address: 'Supermarket', rating: 4.8, ratingCount: 10, features: ['Level surface'], addedBy: '', createdAt: new Date().toISOString(), isConfirmed: true },
        ];
      }
      setPoints(pointFilter === 'all' ? samplePoints : samplePoints.filter(p => p.type === pointFilter));
    } else {
      setPoints(pts);
    }
    
    setObstacles(obs);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          loadData();
        },
        () => { loadData(); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      loadData();
    }
  }, []);

  useEffect(() => { loadData(); }, [pointFilter]);

  const handleFindRoute = useCallback(() => {
    if (!origin.trim() || !destination.trim() || !isLoaded) return;

    setLoading(true);
    setRouteError('');
    setDirections(null);
    setRouteInfo(null);

    const directionsService = new google.maps.DirectionsService();
    
    const resolvedOrigin = origin.trim().toLowerCase() === 'my location' && userLocation 
      ? new google.maps.LatLng(userLocation.lat, userLocation.lng) 
      : origin.trim();

    directionsService.route(
      {
        origin: resolvedOrigin,
        destination: destination.trim(),
        travelMode: travelMode as google.maps.TravelMode,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        setLoading(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteInfo({
              distance: leg.distance?.text || '',
              duration: leg.duration?.text || '',
            });
          }
        } else {
          setRouteError('Could not find a route. Try different addresses.');
        }
      }
    );
  }, [origin, destination, isLoaded, travelMode]);

  const handleAddPoint = async () => {
    if (!newPointName.trim() || !newPointAddress.trim() || !user) return;
    await addAccessibilityPoint({
      name: newPointName.trim(), type: newPointType,
      lat: 31.95 + Math.random() * 0.02, lng: 35.91 + Math.random() * 0.03,
      address: newPointAddress.trim(),
      features: newPointFeatures.split(',').map((f) => f.trim()).filter(Boolean),
    }, user.id);
    setShowAddPoint(false);
    setNewPointName(''); setNewPointAddress(''); setNewPointFeatures('');
    loadData();
  };

  const handleAddObstacle = async () => {
    if (!newObsDesc.trim() || !newObsAddress.trim() || !user) return;
    await addObstacle({
      description: newObsDesc.trim(), type: newObsType,
      lat: 31.95 + Math.random() * 0.02, lng: 35.91 + Math.random() * 0.03,
      address: newObsAddress.trim(), permanent: newObsPermanent,
    }, user.id);
    setShowAddObstacle(false);
    setNewObsDesc(''); setNewObsAddress('');
    loadData();
  };

  const handleRate = async (pointId: string) => {
    if (ratingValue < 1 || ratingValue > 5) return;
    const updated = await rateAccessibilityPoint(pointId, ratingValue);
    setRatingValue(0);
    loadData();
    if (updated) setSelectedPoint(updated);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Route Finder */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Navigation size={18} style={{ color: 'var(--color-primary-500)' }} />
          Wheelchair & General Route Finder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
            <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
              placeholder="Starting point (e.g., City Hall)" onKeyDown={(e) => e.key === 'Enter' && handleFindRoute()}
              className="bg-transparent outline-none text-sm flex-1 min-w-0" style={{ color: 'var(--text-primary)' }} />
            <button 
              onClick={() => {
                if (userLocation) {
                  setOrigin('My Location');
                } else if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setOrigin('My Location');
                    },
                    () => alert('Please enable location access.')
                  );
                }
              }}
              title="Use current location"
              className="p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-500/10 transition-colors flex-shrink-0"
            >
              <LocateFixed size={16} />
            </button>
            <button 
              onClick={() => {
                // Set to the center where sample points are generated
                setUserLocation({ lat: 31.955, lng: 35.915 });
                setOrigin('My Location');
              }}
              title="Simulate Demo Location"
              className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors flex-shrink-0"
            >
              <MapPin size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination (e.g., Central Park)" onKeyDown={(e) => e.key === 'Enter' && handleFindRoute()}
              className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="WALKING">♿ Wheelchair / Walking</option>
            <option value="DRIVING">🚗 Driving</option>
            <option value="BICYCLING">🚲 Bicycling</option>
            <option value="TRANSIT">🚌 Transit</option>
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleFindRoute} disabled={!origin.trim() || !destination.trim() || loading}
            className="btn btn-primary text-sm disabled:opacity-50">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding...</>
            ) : (
              <><Navigation size={16} /> Find Accessible Route</>
            )}
          </button>
          {routeInfo && (
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>📏 {routeInfo.distance}</span>
              <span>⏱️ {routeInfo.duration} ({travelMode.toLowerCase()})</span>
            </div>
          )}
          {routeError && <p className="text-xs text-red-400">{routeError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ height: '500px' }}>
          {isLoaded ? (
            <GoogleMap mapContainerStyle={containerStyle} center={userLocation || FALLBACK_CENTER} zoom={14}
              options={{ styles: [
                { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
                { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
              ], disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false }}>
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
              {directions && <DirectionsRenderer directions={directions} options={{
                polylineOptions: { strokeColor: '#06b6d4', strokeWeight: 5, strokeOpacity: 0.8 },
              }} />}
              {points.map((p) => (
                <MarkerF key={p.id} position={{ lat: p.lat, lng: p.lng }}
                  label={{ text: pointTypeIcons[p.type]?.emoji || '♿', fontSize: '16px' }}
                  title={p.name} onClick={() => setSelectedPoint(p)} />
              ))}
              {obstacles.map((o) => (
                <MarkerF key={o.id} position={{ lat: o.lat, lng: o.lng }}
                  label={{ text: '⚠️', fontSize: '16px' }} title={o.description} />
              ))}
              {selectedPoint && (
                <InfoWindowF position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }} onCloseClick={() => setSelectedPoint(null)}>
                  <div style={{ padding: '4px', maxWidth: '200px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '13px' }}>{selectedPoint.name}</h4>
                    <p style={{ fontSize: '11px', color: '#666' }}>{selectedPoint.address}</p>
                    <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>★ {selectedPoint.rating.toFixed(1)} ({selectedPoint.ratingCount})</p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c1929, #1a3050)' }}>
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
              {/* Simulated markers */}
              {points.map((p, i) => (
                <button key={p.id}
                  onClick={() => setSelectedPoint(p)}
                  className="absolute flex flex-col items-center transition-transform hover:scale-125 cursor-pointer"
                  style={{
                    left: `${15 + ((i * 37 + 13) % 70)}%`,
                    top: `${12 + ((i * 29 + 7) % 65)}%`,
                  }}>
                  <span className="text-2xl animate-bounce" style={{ animationDelay: `${i * 200}ms`, animationDuration: '3s' }}>
                    {pointTypeIcons[p.type]?.emoji || '♿'}
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.6)', color: '#e2e8f0' }}>
                    {p.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              ))}
              {obstacles.map((o, i) => (
                <div key={o.id} className="absolute" style={{
                  left: `${20 + ((i * 43 + 19) % 60)}%`,
                  top: `${10 + ((i * 31 + 23) % 70)}%`,
                }}>
                  <span className="text-lg opacity-80">⚠️</span>
                </div>
              ))}
              {/* Label */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.6)', color: '#94a3b8' }}>
                <Map size={12} className="inline mr-1" style={{ color: '#06b6d4' }} />
                Add Google Maps API key in .env for full map experience
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {/* Selected point detail */}
          {selectedPoint ? (
            <div className="card animate-slide-right space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {pointTypeIcons[selectedPoint.type]?.emoji} {pointTypeIcons[selectedPoint.type]?.label}
                  </span>
                  <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedPoint.name}</h4>
                </div>
                <button onClick={() => setSelectedPoint(null)} className="btn-ghost p-1 rounded-lg">
                  <X size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  <Star size={16} fill="#f59e0b" /> {selectedPoint.rating.toFixed(1)}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({selectedPoint.ratingCount} ratings)</span>
              </div>
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={14} className="text-cyan-500" /> {selectedPoint.address}
              </p>
              {selectedPoint.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPoint.features.map((f, i) => (
                    <span key={i} className="badge badge-info text-[10px]">{f}</span>
                  ))}
                </div>
              )}
              {/* Rate */}
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Rate this point</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRatingValue(s)}>
                        <Star size={18} fill={s <= ratingValue ? '#f59e0b' : 'none'}
                          style={{ color: s <= ratingValue ? '#f59e0b' : 'var(--text-tertiary)' }} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handleRate(selectedPoint.id)} disabled={ratingValue < 1}
                    className="btn btn-primary text-xs py-1 px-3 disabled:opacity-40">Submit</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => setActiveTab('points')} className="flex-1 px-3 py-2 text-xs font-medium"
                  style={{ background: activeTab === 'points' ? 'var(--color-primary-500)' : 'var(--bg-card)', color: activeTab === 'points' ? 'white' : 'var(--text-secondary)' }}>
                  ♿ Points ({points.length})
                </button>
                <button onClick={() => setActiveTab('obstacles')} className="flex-1 px-3 py-2 text-xs font-medium"
                  style={{ background: activeTab === 'obstacles' ? '#ef4444' : 'var(--bg-card)', color: activeTab === 'obstacles' ? 'white' : 'var(--text-secondary)' }}>
                  ⚠️ Obstacles ({obstacles.length})
                </button>
              </div>

              {activeTab === 'points' && (
                <div className="card space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Accessibility Points</h4>
                    <button onClick={() => setShowAddPoint(true)} className="btn-ghost p-1 rounded-lg">
                      <Plus size={16} style={{ color: 'var(--color-primary-500)' }} />
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {(['all', ...Object.keys(pointTypeIcons)] as (AccessibilityPointType | 'all')[]).map((t) => (
                      <button key={t} onClick={() => setPointFilter(t)}
                        className={`btn text-[10px] py-1 px-2 ${pointFilter === t ? 'btn-primary' : 'btn-secondary'}`}>
                        {t === 'all' ? '📍 All' : `${pointTypeIcons[t]?.emoji} ${pointTypeIcons[t]?.label}`}
                      </button>
                    ))}
                  </div>
                  {points.map((p) => (
                    <button key={p.id} onClick={() => setSelectedPoint(p)}
                      className="w-full text-left flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{pointTypeIcons[p.type]?.emoji}</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{p.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#f59e0b' }}>
                        <Star size={11} fill="#f59e0b" /> {p.rating.toFixed(1)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'obstacles' && (
                <div className="card space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reported Obstacles</h4>
                    <button onClick={() => setShowAddObstacle(true)} className="btn-ghost p-1 rounded-lg">
                      <Plus size={16} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                  {obstacles.map((o) => (
                    <div key={o.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                        <div className="flex-1">
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{o.description}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{o.address}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`badge text-[9px] ${o.permanent ? 'badge-danger' : 'badge-warning'}`}>{o.permanent ? 'Permanent' : 'Temporary'}</span>
                            <button onClick={() => confirmObstacleVote(o.id)}
                              className="btn-ghost p-1.5 rounded-lg flex items-center gap-1 text-[10px] hover:text-cyan-400" style={{ color: 'var(--text-tertiary)' }}>
                              <ThumbsUp size={10} /> {o.confirmations}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Point Modal */}
      {showAddPoint && (
        <Portal>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddPoint(false)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl animate-scale-in p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AccessIcon size={18} className="text-green-500" /> Add Accessibility Point
              </h3>
              <button onClick={() => setShowAddPoint(false)} className="btn-ghost p-1 rounded-lg"><X size={18} /></button>
            </div>
            <input type="text" value={newPointName} onChange={(e) => setNewPointName(e.target.value)} placeholder="Point name"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(pointTypeIcons) as [AccessibilityPointType, typeof pointTypeIcons[string]][]).map(([key, val]) => (
                <button key={key} onClick={() => setNewPointType(key)}
                  className="flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-medium"
                  style={{ background: newPointType === key ? `${val.color}20` : 'var(--bg-secondary)', border: `1px solid ${newPointType === key ? val.color : 'var(--border-color)'}`, color: newPointType === key ? val.color : 'var(--text-secondary)' }}>
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>
            <input type="text" value={newPointAddress} onChange={(e) => setNewPointAddress(e.target.value)} placeholder="Address"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            <input type="text" value={newPointFeatures} onChange={(e) => setNewPointFeatures(e.target.value)} placeholder="Features (comma separated)"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            <button onClick={handleAddPoint} disabled={!newPointName.trim() || !newPointAddress.trim()}
              className="btn btn-primary w-full text-sm disabled:opacity-50"><Send size={14} /> Add Point</button>
          </div>
        </div>
        </Portal>
      )}

      {/* Add Obstacle Modal */}
      {showAddObstacle && (
        <Portal>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddObstacle(false)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl animate-scale-in p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertCircle size={18} className="text-red-500" /> Report Obstacle
              </h3>
              <button onClick={() => setShowAddObstacle(false)} className="btn-ghost p-1 rounded-lg"><X size={18} /></button>
            </div>
            <textarea value={newObsDesc} onChange={(e) => setNewObsDesc(e.target.value)} placeholder="Describe the obstacle..."
              rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(obstacleTypeLabels) as [ObstacleType, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setNewObsType(key)}
                  className="px-2 py-2 rounded-xl text-[11px] font-medium"
                  style={{ background: newObsType === key ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)', border: `1px solid ${newObsType === key ? '#ef4444' : 'var(--border-color)'}`, color: newObsType === key ? '#ef4444' : 'var(--text-secondary)' }}>
                  {label}
                </button>
              ))}
            </div>
            <input type="text" value={newObsAddress} onChange={(e) => setNewObsAddress(e.target.value)} placeholder="Location"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={newObsPermanent} onChange={(e) => setNewObsPermanent(e.target.checked)} className="accent-cyan-500" />
              This is a permanent obstacle
            </label>
            <button onClick={handleAddObstacle} disabled={!newObsDesc.trim() || !newObsAddress.trim()}
              className="btn w-full text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white' }}>
              <Send size={14} /> Report Obstacle
            </button>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
