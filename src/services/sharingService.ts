import { v4 as uuid } from 'uuid';
import type { SharedItem, ItemCondition } from '../types';

const ITEMS_KEY = 'civichub_shared_items';
const REQUESTS_KEY = 'civichub_borrow_requests';

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

/* ---- Seed Data ---- */

const seedItems: SharedItem[] = [
  { id: uuid(), userId: 'u1', userName: 'Ahmad K.', title: 'Power Drill (Bosch Professional)', description: 'Bosch GSB 13 RE, 600W impact drill. Comes with carrying case and 10 drill bits. Perfect for home projects.', category: 'Tools', condition: 'good', available: true, lat: 31.9510, lng: 35.9210, deposit: 20, rating: 4.8, images: [], createdAt: new Date(Date.now() - 604800000).toISOString() },
  { id: uuid(), userId: 'u2', userName: 'Sara M.', title: 'Epson Projector (HD)', description: 'Epson EB-W06 WXGA projector, 3700 lumens. Great for presentations and movie nights. HDMI cable included.', category: 'Electronics', condition: 'excellent', available: true, lat: 31.9580, lng: 35.9250, deposit: 50, rating: 4.5, images: [], createdAt: new Date(Date.now() - 1209600000).toISOString() },
  { id: uuid(), userId: 'u3', userName: 'Omar B.', title: 'Complete First Aid Kit', description: 'Professional 200-piece first aid kit. Includes bandages, antiseptic, scissors, emergency blanket, and more.', category: 'Medical', condition: 'new', available: false, lat: 31.9450, lng: 35.9100, deposit: 0, rating: 5.0, images: [], createdAt: new Date(Date.now() - 2592000000).toISOString() },
  { id: uuid(), userId: 'u4', userName: 'Noor A.', title: 'KitchenAid Stand Mixer', description: 'KitchenAid Artisan 5-quart stand mixer in red. Includes wire whip, flat beater, and dough hook.', category: 'Kitchen', condition: 'good', available: true, lat: 31.9520, lng: 35.9180, deposit: 30, rating: 4.2, images: [], createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: uuid(), userId: 'u5', userName: 'Lina H.', title: 'Camping Tent (4-Person)', description: 'Coleman Sundome 4-person tent. Easy setup, weather-resistant. Used 3 times, in great condition.', category: 'Sports', condition: 'good', available: true, lat: 31.9600, lng: 35.9300, deposit: 40, rating: 3.9, images: [], createdAt: new Date(Date.now() - 864000000).toISOString() },
  { id: uuid(), userId: 'u6', userName: 'Khaled R.', title: 'Programming Books Bundle (5 books)', description: 'Clean Code, Design Patterns, DDIA, Pragmatic Programmer, and Algorithms. All in good condition.', category: 'Books', condition: 'good', available: true, lat: 31.9540, lng: 35.9150, deposit: 0, rating: 4.6, images: [], createdAt: new Date(Date.now() - 1728000000).toISOString() },
  { id: uuid(), userId: 'u1', userName: 'Ahmad K.', title: 'Pressure Washer (Karcher)', description: 'Karcher K5 pressure washer. Great for cleaning cars, patios, and outdoor furniture. All attachments included.', category: 'Tools', condition: 'excellent', available: true, lat: 31.9530, lng: 35.9200, deposit: 35, rating: 4.4, images: [], createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: uuid(), userId: 'u7', userName: 'Dina T.', title: 'Yoga Mat + Resistance Bands', description: 'Extra thick yoga mat (6mm) with 5 resistance bands of varying strengths. Includes carrying bag.', category: 'Sports', condition: 'excellent', available: true, lat: 31.9570, lng: 35.9230, deposit: 0, rating: 4.9, images: [], createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const seedRequests: BorrowRequest[] = [
  { id: uuid(), itemId: seedItems[2].id, requesterId: 'current-user', requesterName: 'You', status: 'approved', message: 'Need it for a community first aid training.', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

function loadItems(): SharedItem[] {
  try { const raw = localStorage.getItem(ITEMS_KEY); if (raw) return JSON.parse(raw); } catch {}
  localStorage.setItem(ITEMS_KEY, JSON.stringify(seedItems));
  return seedItems;
}
function saveItems(data: SharedItem[]) { localStorage.setItem(ITEMS_KEY, JSON.stringify(data)); }

function loadRequests(): BorrowRequest[] {
  try { const raw = localStorage.getItem(REQUESTS_KEY); if (raw) return JSON.parse(raw); } catch {}
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(seedRequests));
  return seedRequests;
}
function saveRequests(data: BorrowRequest[]) { localStorage.setItem(REQUESTS_KEY, JSON.stringify(data)); }

/* ---- Items API ---- */

export function getSharedItems(filters?: {
  category?: string;
  search?: string;
  availableOnly?: boolean;
}): SharedItem[] {
  let items = loadItems();
  if (filters?.category && filters.category !== 'All') {
    items = items.filter((i) => i.category === filters.category);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }
  if (filters?.availableOnly) {
    items = items.filter((i) => i.available);
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getItemById(id: string): SharedItem | undefined {
  return loadItems().find((i) => i.id === id);
}

export function createItem(data: {
  title: string; description: string; category: string;
  condition: ItemCondition; deposit: number; images: string[];
}): SharedItem {
  const items = loadItems();
  const item: SharedItem = {
    id: uuid(), userId: 'current-user', userName: 'You',
    ...data, available: true,
    lat: 31.95 + Math.random() * 0.03,
    lng: 35.9 + Math.random() * 0.04,
    rating: 0, createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  saveItems(items);
  return item;
}

/* ---- Borrow Requests API ---- */

export function getBorrowRequests(itemId?: string): BorrowRequest[] {
  const reqs = loadRequests();
  if (itemId) return reqs.filter((r) => r.itemId === itemId);
  return reqs;
}

export function createBorrowRequest(itemId: string, message: string): BorrowRequest {
  const requests = loadRequests();
  const req: BorrowRequest = {
    id: uuid(), itemId, requesterId: 'current-user', requesterName: 'You',
    status: 'pending', message, createdAt: new Date().toISOString(),
  };
  requests.unshift(req);
  saveRequests(requests);
  return req;
}

export function updateRequestStatus(reqId: string, status: BorrowRequest['status']): void {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === reqId);
  if (idx !== -1) {
    requests[idx].status = status;
    if (status === 'returned') requests[idx].returnDate = new Date().toISOString();

    // If approved, mark item as unavailable
    if (status === 'approved') {
      const items = loadItems();
      const itemIdx = items.findIndex((i) => i.id === requests[idx].itemId);
      if (itemIdx !== -1) { items[itemIdx].available = false; saveItems(items); }
    }
    // If returned, mark item as available
    if (status === 'returned') {
      const items = loadItems();
      const itemIdx = items.findIndex((i) => i.id === requests[idx].itemId);
      if (itemIdx !== -1) { items[itemIdx].available = true; saveItems(items); }
    }

    saveRequests(requests);
  }
}

/* ---- Reviews (stored inline for simplicity) ---- */

const REVIEWS_KEY = 'civichub_reviews';

function loadReviews(): Review[] {
  try { const raw = localStorage.getItem(REVIEWS_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [];
}
function saveReviews(data: Review[]) { localStorage.setItem(REVIEWS_KEY, JSON.stringify(data)); }

export function getReviews(itemId: string): Review[] {
  return loadReviews().filter((r) => r.itemId === itemId);
}

export function addReview(itemId: string, rating: number, comment: string): Review {
  const reviews = loadReviews();
  const review: Review = {
    id: uuid(), itemId, userId: 'current-user', userName: 'You',
    rating, comment, createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);
  saveReviews(reviews);

  // Update item rating
  const items = loadItems();
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx !== -1) {
    const itemReviews = reviews.filter((r) => r.itemId === itemId);
    items[idx].rating = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
    saveItems(items);
  }

  return review;
}
