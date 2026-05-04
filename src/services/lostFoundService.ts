import { v4 as uuid } from 'uuid';
import type { LostFoundPost, LFType, LFCategory, LFStatus } from '../types';

const STORAGE_KEY = 'civichub_lostfound';

/* ---- Seed Data ---- */
const seedPosts: LostFoundPost[] = [
  {
    id: uuid(), userId: 'u1', userName: 'Ahmad K.', type: 'lost',
    title: 'Black leather wallet with ID cards',
    description: 'Lost my black leather wallet near the coffee shop on Rainbow Street. Contains national ID, driver license, and two credit cards. Has a small scratch on the front.',
    category: 'ids', status: 'active', lat: 31.9510, lng: 35.9210,
    location: 'Rainbow Street, Downtown', images: [],
    dateLostFound: new Date(Date.now() - 86400000).toISOString(),
    views: 45, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuid(), userId: 'u2', userName: 'Sara M.', type: 'found',
    title: 'Set of car keys with blue keychain',
    description: 'Found a set of 3 keys on a ring with a blue rubber keychain near the Central Park fountain. One key appears to be a Toyota car key.',
    category: 'keys', status: 'active', lat: 31.9580, lng: 35.9250,
    location: 'Central Park, near fountain', images: [],
    dateLostFound: new Date(Date.now() - 43200000).toISOString(),
    views: 32, createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: uuid(), userId: 'u3', userName: 'Omar B.', type: 'lost',
    title: 'Golden retriever, answers to Max',
    description: 'Missing golden retriever, male, 3 years old, wearing a red collar with tags. Very friendly. Last seen near the Riverside Walk area. Name is Max.',
    category: 'pets', status: 'active', lat: 31.9450, lng: 35.9100,
    location: 'Riverside Walk', images: [],
    dateLostFound: new Date(Date.now() - 172800000).toISOString(),
    views: 128, createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: uuid(), userId: 'u4', userName: 'Noor A.', type: 'found',
    title: 'iPhone 15 Pro in black case',
    description: 'Found an iPhone 15 Pro Max in a black silicone case at Bus Stop #7 on University Boulevard. Screen is locked. Has a cracked screen protector.',
    category: 'electronics', status: 'active', lat: 31.9620, lng: 35.9300,
    location: 'Bus Stop #7, University Blvd', images: [],
    dateLostFound: new Date(Date.now() - 7200000).toISOString(),
    views: 67, createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: uuid(), userId: 'u5', userName: 'Lina H.', type: 'lost',
    title: 'Blue backpack with laptop inside',
    description: 'Left my navy blue Jansport backpack at the university library, 2nd floor study area. Contains a Dell laptop, charger, notebooks, and a pencil case.',
    category: 'bags', status: 'active', lat: 31.9560, lng: 35.9180,
    location: 'University Library, 2nd floor', images: [],
    dateLostFound: new Date(Date.now() - 3600000).toISOString(),
    views: 89, createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuid(), userId: 'u6', userName: 'Khaled R.', type: 'found',
    title: 'Brown leather wallet with cash',
    description: 'Found a brown leather wallet on the sidewalk near Gardens District. Contains some cash and what appears to be a student ID card.',
    category: 'ids', status: 'active', lat: 31.9490, lng: 35.9150,
    location: 'Gardens District, Main Road', images: [],
    dateLostFound: new Date(Date.now() - 14400000).toISOString(),
    views: 23, createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: uuid(), userId: 'u2', userName: 'Sara M.', type: 'lost',
    title: 'Silver Samsung Galaxy S24',
    description: 'Lost my silver Samsung Galaxy S24 phone somewhere between the market and bus station. It has a clear case with flower stickers on the back.',
    category: 'electronics', status: 'matched', lat: 31.9530, lng: 35.9090,
    location: 'Market to Bus Station area', images: [],
    dateLostFound: new Date(Date.now() - 259200000).toISOString(),
    views: 156, createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: uuid(), userId: 'u7', userName: 'Dina T.', type: 'found',
    title: 'Passport — Jordanian',
    description: 'Found a Jordanian passport near the post office on King Hussein Street. Will not share the name publicly for privacy.',
    category: 'documents', status: 'claimed', lat: 31.9570, lng: 35.9200,
    location: 'Post Office, King Hussein St', images: [],
    dateLostFound: new Date(Date.now() - 432000000).toISOString(),
    views: 210, createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

function load(): LostFoundPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
  return seedPosts;
}

function save(data: LostFoundPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---- Public API ---- */

export function getLostFoundPosts(filters?: {
  type?: LFType | 'all';
  category?: LFCategory | 'all';
  status?: LFStatus | 'all';
  search?: string;
}): LostFoundPost[] {
  let posts = load();

  if (filters?.type && filters.type !== 'all') {
    posts = posts.filter((p) => p.type === filters.type);
  }
  if (filters?.category && filters.category !== 'all') {
    posts = posts.filter((p) => p.category === filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    posts = posts.filter((p) => p.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }

  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getLostFoundById(id: string): LostFoundPost | undefined {
  return load().find((p) => p.id === id);
}

export function createLostFoundPost(data: {
  type: LFType;
  title: string;
  description: string;
  category: LFCategory;
  location: string;
  images: string[];
  dateLostFound: string;
}): LostFoundPost {
  const posts = load();
  const post: LostFoundPost = {
    id: uuid(),
    userId: 'current-user',
    userName: 'You',
    ...data,
    status: 'active',
    lat: 31.95 + Math.random() * 0.03,
    lng: 35.9 + Math.random() * 0.04,
    views: 0,
    createdAt: new Date().toISOString(),
  };
  posts.unshift(post);
  save(posts);
  return post;
}

export function updateLostFoundStatus(id: string, status: LFStatus): LostFoundPost | undefined {
  const posts = load();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  posts[idx].status = status;
  save(posts);
  return posts[idx];
}

export function incrementViews(id: string): void {
  const posts = load();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    posts[idx].views += 1;
    save(posts);
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

export function findMatches(postId: string, maxResults = 5): MatchResult[] {
  const posts = load();
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

    // Text similarity (0–50 points)
    const textSim = jaccardSimilarity(sourceTokens, candTokens);
    score += textSim * 50;
    if (textSim > 0.15) reasons.push(`Text similarity: ${(textSim * 100).toFixed(0)}%`);

    // Same category (0–25 points)
    if (source.category === candidate.category) {
      score += 25;
      reasons.push('Same category');
    }

    // Location proximity (0–15 points)
    const dist = haversine(source.lat, source.lng, candidate.lat, candidate.lng);
    if (dist < 1) {
      score += 15;
      reasons.push(`Very close (${dist.toFixed(1)} km)`);
    } else if (dist < 3) {
      score += 10;
      reasons.push(`Nearby (${dist.toFixed(1)} km)`);
    } else if (dist < 5) {
      score += 5;
      reasons.push(`In area (${dist.toFixed(1)} km)`);
    }

    // Date proximity (0–10 points)
    const daysDiff = Math.abs(
      new Date(source.dateLostFound).getTime() - new Date(candidate.dateLostFound).getTime()
    ) / 86400000;
    if (daysDiff < 1) {
      score += 10;
      reasons.push('Same day');
    } else if (daysDiff < 3) {
      score += 7;
      reasons.push(`${Math.ceil(daysDiff)} days apart`);
    } else if (daysDiff < 7) {
      score += 3;
      reasons.push(`${Math.ceil(daysDiff)} days apart`);
    }

    return { post: candidate, score, reasons };
  });

  return results
    .filter((r) => r.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
