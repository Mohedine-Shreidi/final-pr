import { v4 as uuid } from 'uuid';
import type { Report, ReportCategory, ReportStatus, ReportUrgency } from '../types';

const STORAGE_KEY = 'civichub_reports';

/* ---- Seed Data ---- */
const seedReports: Report[] = [
  {
    id: uuid(), userId: 'u1', userName: 'Ahmad K.',
    title: 'Large pothole on Elm Street',
    description: 'Deep pothole causing traffic hazards, multiple vehicles damaged.',
    category: 'roads', status: 'reported', urgency: 'high',
    lat: 31.9550, lng: 35.9120, address: 'Elm Street & 5th Ave',
    images: [], votes: 12, votedBy: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: uuid(), userId: 'u2', userName: 'Sara M.',
    title: 'Broken streetlight near park entrance',
    description: 'The streetlight has been out for 3 days, very dark and unsafe at night.',
    category: 'lighting', status: 'in_progress', urgency: 'medium',
    lat: 31.9600, lng: 35.9250, address: 'Central Park Entrance',
    images: [], votes: 8, votedBy: [],
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuid(), userId: 'u3', userName: 'Omar B.',
    title: 'Water leak at intersection',
    description: 'Water continuously leaking from main pipe, flooding the sidewalk.',
    category: 'water_leaks', status: 'reported', urgency: 'high',
    lat: 31.9480, lng: 35.9180, address: 'Main St & Oak Ave',
    images: [], votes: 23, votedBy: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuid(), userId: 'u4', userName: 'Noor A.',
    title: 'Overflowing garbage bins at Market Square',
    description: 'Multiple bins overflowing for 2 days, attracting pests.',
    category: 'garbage', status: 'verified', urgency: 'low',
    lat: 31.9520, lng: 35.9080, address: 'Market Square',
    images: [], votes: 5, votedBy: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: uuid(), userId: 'u5', userName: 'Lina H.',
    title: 'Exposed wiring on utility pole',
    description: 'Dangerous exposed wires hanging low, risk of electrocution.',
    category: 'hazards', status: 'resolved', urgency: 'critical',
    lat: 31.9680, lng: 35.9350, address: 'Industrial Avenue',
    images: [], votes: 34, votedBy: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuid(), userId: 'u1', userName: 'Ahmad K.',
    title: 'Sinkhole forming on residential road',
    description: 'Small sinkhole appearing, getting larger with each rain.',
    category: 'roads', status: 'reported', urgency: 'critical',
    lat: 31.9560, lng: 35.9300, address: 'Zahran Street',
    images: [], votes: 18, votedBy: [],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

function load(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedReports));
  return seedReports;
}

function save(data: Report[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---- Public API ---- */

export function getReports(filters?: {
  category?: ReportCategory | 'all';
  status?: ReportStatus | 'all';
  search?: string;
}): Report[] {
  let reports = load();

  if (filters?.category && filters.category !== 'all') {
    reports = reports.filter((r) => r.category === filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    reports = reports.filter((r) => r.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    reports = reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
    );
  }

  return reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getReportById(id: string): Report | undefined {
  return load().find((r) => r.id === id);
}

export function createReport(data: {
  title: string;
  description: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  lat: number;
  lng: number;
  address: string;
  images: string[];
}): Report {
  const reports = load();
  const report: Report = {
    id: uuid(),
    userId: 'current-user',
    userName: 'You',
    ...data,
    status: 'reported',
    votes: 0,
    votedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  reports.unshift(report);
  save(reports);
  return report;
}

export function updateReportStatus(id: string, status: ReportStatus): Report | undefined {
  const reports = load();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  reports[idx].status = status;
  reports[idx].updatedAt = new Date().toISOString();
  save(reports);
  return reports[idx];
}

export function voteReport(id: string): Report | undefined {
  const reports = load();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;

  const userId = 'current-user';
  if (reports[idx].votedBy.includes(userId)) return reports[idx]; // Already voted

  reports[idx].votes += 1;
  reports[idx].votedBy.push(userId);

  // Auto-verify if 3+ votes
  if (reports[idx].votes >= 3 && reports[idx].status === 'reported') {
    reports[idx].status = 'verified';
  }

  reports[idx].updatedAt = new Date().toISOString();
  save(reports);
  return reports[idx];
}

export function deleteReport(id: string): boolean {
  const reports = load();
  const filtered = reports.filter((r) => r.id !== id);
  if (filtered.length === reports.length) return false;
  save(filtered);
  return true;
}
