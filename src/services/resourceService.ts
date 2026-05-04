import { v4 as uuid } from 'uuid';
import type { Resource, CrowdUpdate, ResourceStatus } from '../types';

const STORAGE_KEY = 'civichub_resources';
const LOCATION_KEY = 'civichub_user_location';

/* ---- Dynamic Seed Data ---- */

// Generate resources near a given center point
function generateSeedResources(lat: number, lng: number): Resource[] {
  const now = new Date().toISOString();
  // Small random offsets so resources appear within ~5km of the user
  const offset = () => (Math.random() - 0.5) * 0.04;

  return [
    {
      id: uuid(), name: 'City General Hospital', type: 'hospital', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Main St, Downtown',
      phone: '+1 555-100-1000', hours: '24/7', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Central Medical Center', type: 'hospital', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'University Blvd',
      phone: '+1 555-100-2000', hours: '24/7', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'MedPlus Pharmacy', type: 'pharmacy', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Commerce Ave #12',
      phone: '+1 555-200-1234', hours: '8:00 AM - 10:00 PM', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Green Crescent Pharmacy', type: 'pharmacy', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Gardens District',
      phone: '+1 555-200-5678', hours: '9:00 AM - 11:00 PM', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Community Shelter A', type: 'shelter', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Central Park Area',
      phone: '+1 555-300-0001', hours: '6:00 PM - 8:00 AM', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Emergency Shelter B', type: 'shelter', status: 'limited',
      lat: lat + offset(), lng: lng + offset(), address: 'North Road',
      phone: '+1 555-300-0002', hours: '24/7', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Central Water Station', type: 'water', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Old Town Market',
      phone: '+1 555-400-0001', hours: '24/7', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'Municipal Water Point', type: 'water', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Sports Complex',
      phone: '+1 555-400-0002', hours: '6:00 AM - 10:00 PM', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'QuickFuel Station', type: 'fuel', status: 'open',
      lat: lat + offset(), lng: lng + offset(), address: 'Highway Exit 5',
      phone: '+1 555-500-0001', hours: '6:00 AM - 12:00 AM', lastVerified: now, crowdUpdates: [],
    },
    {
      id: uuid(), name: 'CityGas Station', type: 'fuel', status: 'closed',
      lat: lat + offset(), lng: lng + offset(), address: 'West Circle',
      phone: '+1 555-500-0002', hours: '24/7', lastVerified: now, crowdUpdates: [],
    },
  ];
}

function load(): Resource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  // Generate resources near user's detected location
  const savedLoc = localStorage.getItem(LOCATION_KEY);
  let lat = 0, lng = 0;
  if (savedLoc) {
    const loc = JSON.parse(savedLoc);
    lat = loc.lat;
    lng = loc.lng;
  }

  const seed = generateSeedResources(lat || 31.955, lng || 35.915);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function save(data: Resource[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---- Real Places API Data ---- */

export async function fetchRealPlacesFromGoogle(lat: number, lng: number): Promise<Resource[]> {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    return generateSeedResources(lat, lng);
  }

  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
  
  const typesToSearch = [
    { type: 'hospital', query: 'hospital' },
    { type: 'pharmacy', query: 'pharmacy' },
    { type: 'fuel', query: 'gas_station' },
  ];

  const allResources: Resource[] = [];

  const searchPromises = typesToSearch.map(({ type, query }) => {
    return new Promise<void>((resolve) => {
      service.nearbySearch(
        {
          location: { lat, lng },
          radius: 15000, // Increased to 15km
          type: query as any,
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 15).forEach((place) => { // Increased to 15 per type
              allResources.push({
                id: place.place_id || uuid(),
                name: place.name || 'Unknown Location',
                type: type as any,
                status: place.business_status === 'CLOSED_TEMPORARILY' ? 'closed' : 'open',
                lat: place.geometry?.location?.lat() || lat,
                lng: place.geometry?.location?.lng() || lng,
                address: place.vicinity || 'Unknown Address',
                phone: 'Contact via Google',
                hours: place.opening_hours?.isOpen() ? 'Open Now' : 'Check hours',
                lastVerified: new Date().toISOString(),
                crowdUpdates: [],
              });
            });
          }
          resolve();
        }
      );
    });
  });

  await Promise.all(searchPromises);

  // Add a few custom types that aren't easily found on Google Maps
  allResources.push({
    id: uuid(), name: 'Community Center Shelter', type: 'shelter', status: 'open',
    lat: lat + 0.01, lng: lng - 0.01, address: 'Main District',
    phone: 'Local Authority', hours: '24/7', lastVerified: new Date().toISOString(), crowdUpdates: [],
  });
  
  allResources.push({
    id: uuid(), name: 'Emergency Water Point', type: 'water', status: 'open',
    lat: lat - 0.01, lng: lng + 0.01, address: 'Public Square',
    phone: 'Local Authority', hours: '24/7', lastVerified: new Date().toISOString(), crowdUpdates: [],
  });

  return allResources;
}

/**
 * Call this once when the user's geolocation is obtained
 * to regenerate seed data around their real location using Google Places API.
 */
export async function initializeResourcesForLocation(lat: number, lng: number) {
  const locKey = localStorage.getItem(LOCATION_KEY);
  const existing = localStorage.getItem(STORAGE_KEY);
  
  // Force refresh if they have the old fake data ("City General Hospital")
  const hasFakeData = existing && existing.includes('City General Hospital');
  
  // Force refresh if they previously ran this when Places API was disabled and only got the 1-2 fallback items
  const isMissingPlaces = existing && JSON.parse(existing).length <= 3;

  // Regenerate if location is new, resources never generated, has fake data, or is missing places
  if (!existing || !locKey || hasFakeData || isMissingPlaces) {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng }));
    const realData = await fetchRealPlacesFromGoogle(lat, lng);
    if (realData.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(realData));
    }
  }
}

/* ---- Public API ---- */

export function getResources(filters?: {
  type?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
}): Resource[] {
  let resources = load();

  if (filters?.type && filters.type !== 'all') {
    resources = resources.filter((r) => r.type === filters.type);
  }
  if (filters?.status && filters.status !== 'all') {
    resources = resources.filter((r) => r.status === filters.status);
  }
  if (filters?.lat && filters?.lng && filters?.radius) {
    resources = resources.filter((r) => {
      const dist = haversine(filters.lat!, filters.lng!, r.lat, r.lng);
      return dist <= filters.radius!;
    });
  }

  return resources;
}

export function getResourceById(id: string): Resource | undefined {
  return load().find((r) => r.id === id);
}

export function addCrowdUpdate(
  resourceId: string,
  update: { status: ResourceStatus; note: string; userName: string }
): Resource | undefined {
  const resources = load();
  const idx = resources.findIndex((r) => r.id === resourceId);
  if (idx === -1) return undefined;

  const crowdUpdate: CrowdUpdate = {
    id: uuid(),
    userId: 'current-user',
    userName: update.userName,
    status: update.status,
    note: update.note,
    timestamp: new Date().toISOString(),
    confirmations: 1,
  };

  resources[idx].crowdUpdates.unshift(crowdUpdate);

  // Auto-update status if 3+ recent updates agree
  const recentUpdates = resources[idx].crowdUpdates.slice(0, 5);
  const statusCounts: Record<string, number> = {};
  recentUpdates.forEach((u) => {
    statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;
  });
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count >= 3) {
      resources[idx].status = status as ResourceStatus;
      resources[idx].lastVerified = new Date().toISOString();
      break;
    }
  }

  save(resources);
  return resources[idx];
}

/* ---- Helpers ---- */

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
