import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  isConfirmed?: boolean;
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
  isConfirmed?: boolean;
}

export interface PlaceRating {
  id: string;
  placeId: string;
  userId: string;
  score: number;
  comment: string;
  createdAt: string;
}

/* ---- Public API: Points ---- */

export async function getAccessibilityPoints(filters?: {
  type?: AccessibilityPointType | 'all';
  includeUnconfirmed?: boolean;
}): Promise<AccessibilityPoint[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('accessibility_points').select('*');

  if (!filters?.includeUnconfirmed) {
    query = query.eq('is_confirmed', true);
  }

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  query = query.order('rating', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('[Accessibility] fetch error:', error.message); return []; }
  return (data || []).map(mapPointRow);
}

export async function addAccessibilityPoint(input: {
  name: string; type: AccessibilityPointType;
  lat: number; lng: number; address: string; features: string[];
}, userId: string): Promise<AccessibilityPoint | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('accessibility_points').insert({
    name: input.name,
    type: input.type,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    features: input.features,
    rating: 0,
    rating_count: 0,
    created_by: userId,
    is_confirmed: false,
  }).select().single();

  if (error) { console.error('[Accessibility] create error:', error.message); return null; }
  return data ? mapPointRow(data) : null;
}

export async function confirmAccessibilityPoint(id: string, confirmed: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('accessibility_points').update({ is_confirmed: confirmed }).eq('id', id);
  return !error;
}

export async function rateAccessibilityPoint(pointId: string, score: number): Promise<AccessibilityPoint | null> {
  if (!isSupabaseConfigured) return null;

  const { data: current } = await supabase.from('accessibility_points').select('*').eq('id', pointId).single();
  if (!current) return null;

  const newCount = (current.rating_count || 0) + 1;
  const newRating = ((current.rating || 0) * (current.rating_count || 0) + score) / newCount;

  const { data, error } = await supabase.from('accessibility_points').update({
    rating: newRating,
    rating_count: newCount,
  }).eq('id', pointId).select().single();

  if (error) return null;
  return data ? mapPointRow(data) : null;
}

/* ---- Public API: Obstacles ---- */

export async function getObstacles(filters?: {
  includeUnconfirmed?: boolean;
}): Promise<Obstacle[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('obstacles').select('*');

  if (!filters?.includeUnconfirmed) {
    query = query.eq('is_confirmed', true);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('[Obstacles] fetch error:', error.message); return []; }
  return (data || []).map(mapObstacleRow);
}

export async function addObstacle(input: {
  description: string; type: ObstacleType;
  lat: number; lng: number; address: string; permanent: boolean;
}, userId: string): Promise<Obstacle | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('obstacles').insert({
    description: input.description,
    type: input.type,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    permanent: input.permanent,
    reported_by: userId,
    confirmations: 1,
    is_confirmed: false,
  }).select().single();

  if (error) { console.error('[Obstacles] create error:', error.message); return null; }
  return data ? mapObstacleRow(data) : null;
}

export async function confirmObstacle(id: string, confirmed: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('obstacles').update({ is_confirmed: confirmed }).eq('id', id);
  return !error;
}

export async function confirmObstacleVote(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: current } = await supabase.from('obstacles').select('confirmations').eq('id', id).single();
  if (current) {
    await supabase.from('obstacles').update({ confirmations: (current.confirmations || 0) + 1 }).eq('id', id);
  }
}

/* ---- Backward compat export for initializeAccessibilityForLocation (no-op now) ---- */
export function initializeAccessibilityForLocation(_lat: number, _lng: number) {
  // No longer needed — data comes from Supabase
}

/* ---- Mappers ---- */

function mapPointRow(row: any): AccessibilityPoint {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    address: row.address || '',
    rating: Number(row.rating) || 0,
    ratingCount: row.rating_count || 0,
    features: row.features || [],
    addedBy: row.created_by || '',
    createdAt: row.created_at,
    isConfirmed: row.is_confirmed ?? true,
  };
}

function mapObstacleRow(row: any): Obstacle {
  return {
    id: row.id,
    description: row.description,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    address: row.address || '',
    permanent: row.permanent ?? false,
    reportedBy: row.reported_by || '',
    confirmations: row.confirmations || 0,
    createdAt: row.created_at,
    isConfirmed: row.is_confirmed ?? true,
  };
}
