import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SharedItem, ItemCondition } from '../types';

export interface BorrowRequest {
  id: string;
  itemId: string;
  requesterId: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'denied' | 'returned';
  message: string;
  createdAt: string;
  returnDate?: string;
}

export interface Review {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/* ---- Items API ---- */

export async function getSharedItems(filters?: {
  category?: string;
  search?: string;
  availableOnly?: boolean;
  includeUnconfirmed?: boolean;
  postedBy?: string;
}): Promise<SharedItem[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('shared_items').select('*');

  if (!filters?.includeUnconfirmed) {
    query = query.eq('is_confirmed', true);
  }

  if (filters?.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }
  if (filters?.availableOnly) {
    query = query.eq('available', true);
  }
  if (filters?.postedBy) {
    query = query.eq('user_id', filters.postedBy);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('[Sharing] fetch error:', error.message); return []; }
  return (data || []).map(mapItemRow);
}

export async function getItemById(id: string): Promise<SharedItem | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const { data, error } = await supabase.from('shared_items').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapItemRow(data);
}

export async function createItem(input: {
  title: string; description: string; category: string;
  condition: ItemCondition; deposit: number; images: string[];
  lat: number; lng: number;
}, userId: string, userName: string): Promise<SharedItem | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('shared_items').insert({
    user_id: userId,
    user_name: userName,
    title: input.title,
    description: input.description,
    category: input.category,
    condition: input.condition,
    deposit: input.deposit,
    images: input.images,
    lat: input.lat,
    lng: input.lng,
    available: true,
    rating: 0,
    is_confirmed: false,
  }).select().single();

  if (error) { console.error('[Sharing] create error:', error.message); return null; }
  return data ? mapItemRow(data) : null;
}

export async function confirmItem(id: string, confirmed: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('shared_items').update({ is_confirmed: confirmed }).eq('id', id);
  return !error;
}

export async function deleteItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('shared_items').delete().eq('id', id);
  return !error;
}

export async function setItemAvailability(id: string, available: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('shared_items').update({ available }).eq('id', id);
  return !error;
}

export async function getItemsBorrowedByUser(userId: string): Promise<SharedItem[]> {
  if (!isSupabaseConfigured) return [];
  // Find approved/returned requests for this user
  const { data: reqs } = await supabase.from('borrow_requests')
    .select('item_id')
    .eq('borrower_id', userId)
    .in('status', ['approved', 'returned']);
    
  if (!reqs || reqs.length === 0) return [];
  const itemIds = reqs.map(r => r.item_id);
  
  const { data, error } = await supabase.from('shared_items')
    .select('*')
    .in('id', itemIds);
    
  if (error || !data) return [];
  return data.map(mapItemRow);
}

/* ---- Borrow Requests API ---- */

export async function getBorrowRequests(itemId?: string): Promise<BorrowRequest[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('borrow_requests').select('*');
  if (itemId) query = query.eq('item_id', itemId);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map(mapRequestRow);
}

export async function createBorrowRequest(itemId: string, message: string, userId: string, userName: string): Promise<BorrowRequest | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('borrow_requests').insert({
    item_id: itemId,
    borrower_id: userId,
    borrower_name: userName,
    message,
    status: 'pending',
  }).select().single();

  if (error) return null;
  return data ? mapRequestRow(data) : null;
}

export async function updateRequestStatus(reqId: string, status: BorrowRequest['status']): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('borrow_requests').update({ status }).eq('id', reqId);

  // Update item availability
  if (status === 'approved' || status === 'returned') {
    const { data: req } = await supabase.from('borrow_requests').select('item_id').eq('id', reqId).single();
    if (req) {
      await supabase.from('shared_items').update({ available: status === 'returned' }).eq('id', req.item_id);
    }
  }
}

/* ---- Reviews ---- */

export async function getReviews(itemId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('item_reviews').select('*').eq('item_id', itemId).order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapReviewRow);
}

export async function addReview(itemId: string, rating: number, comment: string, userId: string, userName: string): Promise<Review | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.from('item_reviews').insert({
    item_id: itemId,
    reviewer_id: userId,
    reviewer_name: userName,
    rating,
    comment,
  }).select().single();

  if (error) return null;

  // Update average rating on the item
  const reviews = await getReviews(itemId);
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await supabase.from('shared_items').update({ rating: avg }).eq('id', itemId);

  return data ? mapReviewRow(data) : null;
}

/* ---- User Reports ---- */

export async function createUserReport(reporterId: string, reportedUserId: string, reason: string, itemId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    item_id: itemId,
    reason,
    status: 'pending'
  });
  if (error) { console.error('[UserReport] create error:', error.message); return false; }
  return true;
}

/* ---- Mappers ---- */

function mapItemRow(row: any): SharedItem {
  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name || '',
    title: row.title,
    description: row.description || '',
    category: row.category || 'Other',
    condition: row.condition || 'good',
    available: row.available ?? true,
    lat: row.lat || 0,
    lng: row.lng || 0,
    deposit: Number(row.deposit) || 0,
    rating: Number(row.rating) || 0,
    images: row.images || [],
    createdAt: row.created_at,
    isConfirmed: row.is_confirmed ?? true,
  };
}

function mapRequestRow(row: any): BorrowRequest {
  return {
    id: row.id,
    itemId: row.item_id,
    requesterId: row.borrower_id,
    requesterName: row.borrower_name || '',
    status: row.status,
    message: row.message || '',
    createdAt: row.created_at,
  };
}

function mapReviewRow(row: any): Review {
  return {
    id: row.id,
    itemId: row.item_id,
    userId: row.reviewer_id || '',
    userName: row.reviewer_name || '',
    rating: row.rating,
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}
