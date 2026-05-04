import { v4 as uuid } from 'uuid';

/* ===== Types ===== */

export type AccessibilityPointType = 'ramp' | 'elevator' | 'restroom' | 'entrance' | 'parking' | 'pathway';
export type ObstacleType = 'stairs' | 'construction' | 'narrow_path' | 'broken_ramp' | 'no_curb_cut' | 'steep_slope';

export interface AccessibilityPoint {
  id: string;
  name: string;
  type: AccessibilityPointType;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  ratingCount: number;
  features: string[];
  addedBy: string;
  createdAt: string;
}

export interface Obstacle {
  id: string;
  description: string;
  type: ObstacleType;
  lat: number;
  lng: number;
  address: string;
  permanent: boolean;
  reportedBy: string;
  confirmations: number;
  createdAt: string;
}

export interface PlaceRating {
  id: string;
  placeId: string;
  userId: string;
  score: number; // 1–5
  comment: string;
  createdAt: string;
}

const POINTS_KEY = 'civichub_accessibility_points';
const OBSTACLES_KEY = 'civichub_obstacles';
const LOCATION_KEY = 'civichub_accessibility_location';

/* ---- Dynamic Seed Data ---- */

function generateSeedPoints(lat: number, lng: number): AccessibilityPoint[] {
  const offset = () => (Math.random() - 0.5) * 0.04;
  return [
    { id: uuid(), name: 'City Hall Main Ramp', type: 'ramp', lat: lat + offset(), lng: lng + offset(), address: 'City Hall, Front Entrance', rating: 4.5, ratingCount: 12, features: ['Gentle slope', 'Handrails both sides', 'Non-slip surface'], addedBy: 'admin', createdAt: new Date(Date.now() - 2592000000).toISOString() },
    { id: uuid(), name: 'Mall Elevator B2-Ground', type: 'elevator', lat: lat + offset(), lng: lng + offset(), address: 'City Mall, East Wing', rating: 3.8, ratingCount: 8, features: ['Wide doors', 'Voice announce', 'Braille buttons'], addedBy: 'u2', createdAt: new Date(Date.now() - 1728000000).toISOString() },
    { id: uuid(), name: 'Central Park Restroom', type: 'restroom', lat: lat + offset(), lng: lng + offset(), address: 'Central Park, North Gate', rating: 4.2, ratingCount: 15, features: ['Wheelchair accessible', 'Grab bars', 'Emergency button'], addedBy: 'u3', createdAt: new Date(Date.now() - 864000000).toISOString() },
    { id: uuid(), name: 'Train Station Platform Lift', type: 'elevator', lat: lat + offset(), lng: lng + offset(), address: 'Central Station, Platform 2', rating: 4.0, ratingCount: 20, features: ['Staff assisted', 'Wide platform', 'Level boarding'], addedBy: 'admin', createdAt: new Date(Date.now() - 5184000000).toISOString() },
    { id: uuid(), name: 'Library Side Entrance', type: 'entrance', lat: lat + offset(), lng: lng + offset(), address: 'Public Library, South Side', rating: 4.7, ratingCount: 6, features: ['Auto doors', 'No step', 'Wide doorway'], addedBy: 'u5', createdAt: new Date(Date.now() - 432000000).toISOString() },
    { id: uuid(), name: 'Hospital Accessible Parking', type: 'parking', lat: lat + offset(), lng: lng + offset(), address: 'City General Hospital', rating: 4.3, ratingCount: 10, features: ['Reserved spots', 'Level surface', 'Close to entrance'], addedBy: 'admin', createdAt: new Date(Date.now() - 3456000000).toISOString() },
    { id: uuid(), name: 'Riverside Accessible Path', type: 'pathway', lat: lat + offset(), lng: lng + offset(), address: 'Riverside Walk, Section A', rating: 3.5, ratingCount: 18, features: ['Paved surface', 'Flat terrain', 'Rest benches'], addedBy: 'u1', createdAt: new Date(Date.now() - 1296000000).toISOString() },
    { id: uuid(), name: 'University Main Ramp', type: 'ramp', lat: lat + offset(), lng: lng + offset(), address: 'University Main Building', rating: 4.1, ratingCount: 9, features: ['Moderate slope', 'Handrails', 'Covered'], addedBy: 'u4', createdAt: new Date(Date.now() - 604800000).toISOString() },
  ];
}

function generateSeedObstacles(lat: number, lng: number): Obstacle[] {
  const offset = () => (Math.random() - 0.5) * 0.04;
  return [
    { id: uuid(), description: 'Construction blocking sidewalk — detour required via back street', type: 'construction', lat: lat + offset(), lng: lng + offset(), address: '3rd Ave near Market', permanent: false, reportedBy: 'u1', confirmations: 5, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: uuid(), description: 'Broken ramp — metal plate missing, unsafe for wheelchair', type: 'broken_ramp', lat: lat + offset(), lng: lng + offset(), address: 'Metro Station East Entrance', permanent: false, reportedBy: 'u3', confirmations: 8, createdAt: new Date(Date.now() - 604800000).toISOString() },
    { id: uuid(), description: 'No curb cut at crosswalk — must use next intersection', type: 'no_curb_cut', lat: lat + offset(), lng: lng + offset(), address: 'King St & Queen St intersection', permanent: true, reportedBy: 'u2', confirmations: 12, createdAt: new Date(Date.now() - 2592000000).toISOString() },
    { id: uuid(), description: 'Steep slope on sidewalk — difficult for manual wheelchair', type: 'steep_slope', lat: lat + offset(), lng: lng + offset(), address: 'University Hill Road', permanent: true, reportedBy: 'u4', confirmations: 6, createdAt: new Date(Date.now() - 1296000000).toISOString() },
  ];
}

function loadPoints(): AccessibilityPoint[] {
  try { const raw = localStorage.getItem(POINTS_KEY); if (raw) return JSON.parse(raw); } catch {}
  
  const savedLoc = localStorage.getItem(LOCATION_KEY);
  let lat = 31.955, lng = 35.915;
  if (savedLoc) { const loc = JSON.parse(savedLoc); lat = loc.lat; lng = loc.lng; }
  
  const seed = generateSeedPoints(lat, lng);
  localStorage.setItem(POINTS_KEY, JSON.stringify(seed));
  return seed;
}

function savePoints(data: AccessibilityPoint[]) { localStorage.setItem(POINTS_KEY, JSON.stringify(data)); }

function loadObstacles(): Obstacle[] {
  try { const raw = localStorage.getItem(OBSTACLES_KEY); if (raw) return JSON.parse(raw); } catch {}
  
  const savedLoc = localStorage.getItem(LOCATION_KEY);
  let lat = 31.955, lng = 35.915;
  if (savedLoc) { const loc = JSON.parse(savedLoc); lat = loc.lat; lng = loc.lng; }
  
  const seed = generateSeedObstacles(lat, lng);
  localStorage.setItem(OBSTACLES_KEY, JSON.stringify(seed));
  return seed;
}

function saveObstacles(data: Obstacle[]) { localStorage.setItem(OBSTACLES_KEY, JSON.stringify(data)); }

export function initializeAccessibilityForLocation(lat: number, lng: number) {
  const existingPoints = localStorage.getItem(POINTS_KEY);
  const locKey = localStorage.getItem(LOCATION_KEY);
  
  // Force refresh if they have hardcoded Amman coordinates in the saved points
  const hasAmmanData = existingPoints && existingPoints.includes('31.954');

  if (!existingPoints || !locKey || hasAmmanData) {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng }));
    localStorage.setItem(POINTS_KEY, JSON.stringify(generateSeedPoints(lat, lng)));
    localStorage.setItem(OBSTACLES_KEY, JSON.stringify(generateSeedObstacles(lat, lng)));
  }
}

/* ---- Public API: Points ---- */

export function getAccessibilityPoints(filters?: { type?: AccessibilityPointType | 'all' }): AccessibilityPoint[] {
  let points = loadPoints();
  if (filters?.type && filters.type !== 'all') {
    points = points.filter((p) => p.type === filters.type);
  }
  return points.sort((a, b) => b.rating - a.rating);
}

export function addAccessibilityPoint(data: {
  name: string; type: AccessibilityPointType;
  lat: number; lng: number; address: string; features: string[];
}): AccessibilityPoint {
  const points = loadPoints();
  const point: AccessibilityPoint = {
    id: uuid(), ...data, rating: 0, ratingCount: 0, addedBy: 'current-user',
    createdAt: new Date().toISOString(),
  };
  points.unshift(point);
  savePoints(points);
  return point;
}

export function rateAccessibilityPoint(pointId: string, score: number): AccessibilityPoint | undefined {
  const points = loadPoints();
  const idx = points.findIndex((p) => p.id === pointId);
  if (idx === -1) return undefined;
  const p = points[idx];
  p.rating = (p.rating * p.ratingCount + score) / (p.ratingCount + 1);
  p.ratingCount += 1;
  savePoints(points);
  return p;
}

/* ---- Public API: Obstacles ---- */

export function getObstacles(): Obstacle[] {
  return loadObstacles().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addObstacle(data: {
  description: string; type: ObstacleType;
  lat: number; lng: number; address: string; permanent: boolean;
}): Obstacle {
  const obstacles = loadObstacles();
  const obs: Obstacle = {
    id: uuid(), ...data, reportedBy: 'current-user', confirmations: 1,
    createdAt: new Date().toISOString(),
  };
  obstacles.unshift(obs);
  saveObstacles(obstacles);
  return obs;
}

export function confirmObstacle(id: string): void {
  const obstacles = loadObstacles();
  const idx = obstacles.findIndex((o) => o.id === id);
  if (idx !== -1) { obstacles[idx].confirmations += 1; saveObstacles(obstacles); }
}
