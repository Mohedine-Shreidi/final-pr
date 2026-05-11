import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Report, ReportCategory, ReportStatus, ReportUrgency } from '../types';

/* ---- Public API ---- */

export async function getReports(filters?: {
  category?: ReportCategory | 'all';
  status?: ReportStatus | 'all';
  search?: string;
  includeUnconfirmed?: boolean;
}): Promise<Report[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('reports').select('*');

  // Only show confirmed items to regular users
  if (!filters?.includeUnconfirmed) {
    query = query.eq('is_confirmed', true);
  }

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('[Reports] fetch error:', error.message); return []; }

  return (data || []).map(mapRow);
}

export async function getReportById(id: string): Promise<Report | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapRow(data);
}

export async function createReport(input: {
  title: string;
  description: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  lat: number;
  lng: number;
  address: string;
  images: string[];
}, userId: string, userName: string): Promise<Report | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('reports').insert({
    user_id: userId,
    user_name: userName,
    title: input.title,
    description: input.description,
    category: input.category,
    urgency: input.urgency,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    images: input.images,
    status: 'reported',
    votes: 0,
    voted_by: [],
    is_confirmed: false,
  }).select().single();

  if (error) { console.error('[Reports] create error:', error.message); return null; }
  return data ? mapRow(data) : null;
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<Report | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('reports').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();

  if (error) { console.error('[Reports] update error:', error.message); return null; }
  return data ? mapRow(data) : null;
}

export async function confirmReport(id: string, confirmed: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('reports').update({
    is_confirmed: confirmed,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  return !error;
}

export async function voteReport(id: string, userId: string): Promise<Report | null> {
  if (!isSupabaseConfigured) return null;

  // Fetch current report
  const { data: current } = await supabase.from('reports').select('*').eq('id', id).single();
  if (!current) return null;

  const votedBy: string[] = current.voted_by || [];
  if (votedBy.includes(userId)) return mapRow(current);

  votedBy.push(userId);
  const newVotes = (current.votes || 0) + 1;
  let newStatus = current.status;
  if (newVotes >= 3 && current.status === 'reported') newStatus = 'verified';

  const { data, error } = await supabase.from('reports').update({
    votes: newVotes,
    voted_by: votedBy,
    status: newStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();

  if (error) return null;
  return data ? mapRow(data) : null;
}

export async function deleteReport(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('reports').delete().eq('id', id);
  return !error;
}

/* ---- Mapper ---- */

function mapRow(row: any): Report {
  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name || '',
    title: row.title,
    description: row.description || '',
    category: row.category,
    status: row.status,
    urgency: row.urgency,
    lat: row.lat,
    lng: row.lng,
    address: row.address || '',
    images: row.images || [],
    votes: row.votes || 0,
    votedBy: row.voted_by || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    isConfirmed: row.is_confirmed ?? true,
  };
}
