import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { LostFoundPost, LFType, LFCategory, LFStatus } from '../types';

/* ---- Public API ---- */

export async function getLostFoundPosts(filters?: {
  type?: LFType | 'all';
  category?: LFCategory | 'all';
  status?: LFStatus | 'all';
  search?: string;
  includeUnconfirmed?: boolean;
}): Promise<LostFoundPost[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('lost_found_posts').select('*');

  if (!filters?.includeUnconfirmed) {
    query = query.eq('is_confirmed', true);
  }

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('[LostFound] fetch error:', error.message); return []; }
  return (data || []).map(mapRow);
}

export async function getLostFoundById(id: string): Promise<LostFoundPost | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const { data, error } = await supabase.from('lost_found_posts').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapRow(data);
}

export async function createLostFoundPost(input: {
  type: LFType;
  title: string;
  description: string;
  category: LFCategory;
  location: string;
  images: string[];
  dateLostFound: string;
  lat: number;
  lng: number;
}, userId: string, userName: string): Promise<LostFoundPost | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('lost_found_posts').insert({
    user_id: userId,
    user_name: userName,
    type: input.type,
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    images: input.images,
    date_lost_found: input.dateLostFound,
    lat: input.lat,
    lng: input.lng,
    status: 'active',
    views: 0,
    is_confirmed: false,
  }).select().single();

  if (error) { console.error('[LostFound] create error:', error.message); return null; }
  return data ? mapRow(data) : null;
}

export async function updateLostFoundStatus(id: string, status: LFStatus): Promise<LostFoundPost | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('lost_found_posts').update({ status }).eq('id', id).select().single();
  if (error) return null;
  return data ? mapRow(data) : null;
}

export async function confirmLostFoundPost(id: string, confirmed: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('lost_found_posts').update({ is_confirmed: confirmed }).eq('id', id);
  return !error;
}

export async function deleteLostFoundPost(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('lost_found_posts').delete().eq('id', id);
  return !error;
}

export async function incrementViews(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: current } = await supabase.from('lost_found_posts').select('views').eq('id', id).single();
  if (current) {
    await supabase.from('lost_found_posts').update({ views: (current.views || 0) + 1 }).eq('id', id);
  }
}

/* ---- AI Matching ---- */

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface MatchResult {
  post: LostFoundPost;
  score: number;
  reasons: string[];
}

export async function findMatches(postId: string, maxResults = 5): Promise<MatchResult[]> {
  const posts = await getLostFoundPosts();
  const source = posts.find((p) => p.id === postId);
  if (!source) return [];

  const oppositeType: LFType = source.type === 'lost' ? 'found' : 'lost';
  const candidates = posts.filter(
    (p) => p.type === oppositeType && p.status === 'active' && p.id !== postId
  );

  const sourceTokens = tokenize(`${source.title} ${source.description}`);

  const results: MatchResult[] = candidates.map((candidate) => {
    const candTokens = tokenize(`${candidate.title} ${candidate.description}`);
    let score = 0;
    const reasons: string[] = [];

    const textSim = jaccardSimilarity(sourceTokens, candTokens);
    score += textSim * 50;
    if (textSim > 0.15) reasons.push(`Text similarity: ${(textSim * 100).toFixed(0)}%`);

    if (source.category === candidate.category) {
      score += 25;
      reasons.push('Same category');
    }

    const dist = haversine(source.lat, source.lng, candidate.lat, candidate.lng);
    if (dist < 1) { score += 15; reasons.push(`Very close (${dist.toFixed(1)} km)`); }
    else if (dist < 3) { score += 10; reasons.push(`Nearby (${dist.toFixed(1)} km)`); }
    else if (dist < 5) { score += 5; reasons.push(`In area (${dist.toFixed(1)} km)`); }

    const daysDiff = Math.abs(
      new Date(source.dateLostFound).getTime() - new Date(candidate.dateLostFound).getTime()
    ) / 86400000;
    if (daysDiff < 1) { score += 10; reasons.push('Same day'); }
    else if (daysDiff < 3) { score += 7; reasons.push(`${Math.ceil(daysDiff)} days apart`); }
    else if (daysDiff < 7) { score += 3; reasons.push(`${Math.ceil(daysDiff)} days apart`); }

    return { post: candidate, score, reasons };
  });

  return results
    .filter((r) => r.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/* ---- Mapper ---- */

function mapRow(row: any): LostFoundPost {
  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name || '',
    type: row.type,
    title: row.title,
    description: row.description || '',
    category: row.category,
    status: row.status,
    lat: row.lat,
    lng: row.lng,
    location: row.location || '',
    images: row.images || [],
    dateLostFound: row.date_lost_found || '',
    views: row.views || 0,
    createdAt: row.created_at,
    isConfirmed: row.is_confirmed ?? true,
  };
}
