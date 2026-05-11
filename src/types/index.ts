/* ===== Shared types for the entire platform ===== */

export type ResourceType = 'hospital' | 'pharmacy' | 'shelter' | 'water' | 'fuel';
export type ResourceStatus = 'open' | 'closed' | 'limited';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  hours: string;
  lastVerified: string;
  crowdUpdates: CrowdUpdate[];
}

export interface CrowdUpdate {
  id: string;
  userId: string;
  userName: string;
  status: ResourceStatus;
  note: string;
  timestamp: string;
  confirmations: number;
}

/* ===== Reports ===== */

export type ReportCategory = 'roads' | 'lighting' | 'water_leaks' | 'garbage' | 'hazards';
export type ReportStatus = 'reported' | 'verified' | 'in_progress' | 'resolved';
export type ReportUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface Report {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  urgency: ReportUrgency;
  lat: number;
  lng: number;
  address: string;
  images: string[];
  votes: number;
  votedBy: string[];
  createdAt: string;
  updatedAt: string;
  isConfirmed?: boolean;
}

/* ===== Lost & Found ===== */

export type LFType = 'lost' | 'found';
export type LFCategory = 'ids' | 'keys' | 'pets' | 'electronics' | 'documents' | 'bags' | 'clothing' | 'other';
export type LFStatus = 'active' | 'matched' | 'claimed' | 'closed';

export interface LostFoundPost {
  id: string;
  userId: string;
  userName: string;
  type: LFType;
  title: string;
  description: string;
  category: LFCategory;
  status: LFStatus;
  lat: number;
  lng: number;
  location: string;
  images: string[];
  dateLostFound: string;
  views: number;
  createdAt: string;
  isConfirmed?: boolean;
}

/* ===== Sharing ===== */

export type ItemCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';

export interface SharedItem {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  condition: ItemCondition;
  available: boolean;
  lat: number;
  lng: number;
  distance?: string;
  deposit: number;
  rating: number;
  images: string[];
  createdAt: string;
  isConfirmed?: boolean;
}

/* ===== User ===== */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  trustScore: number;
  role: 'user' | 'volunteer' | 'authority' | 'admin';
  createdAt: string;
}

/* ===== Chat ===== */

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  context: string;
  createdAt: string;
  updatedAt: string;
  // UI helpers
  otherUserName?: string;
  lastMessage?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/* ===== User Reports ===== */

export type UserReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  itemId?: string;
  reason: string;
  status: UserReportStatus;
  createdAt: string;
}
