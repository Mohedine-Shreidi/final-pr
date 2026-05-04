import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'civichub_notifications';

export interface Notification {
  id: string;
  type: 'match' | 'report_update' | 'borrow_request' | 'system' | 'crowd_update';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

/* ---- Seed ---- */
const seedNotifications: Notification[] = [
  {
    id: uuid(), type: 'match',
    title: 'Potential match found!',
    message: 'A found wallet near Gardens District may match your lost item.',
    link: '/lost-found', read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: uuid(), type: 'report_update',
    title: 'Report status updated',
    message: 'Your report "Water leak at intersection" is now In Progress.',
    link: '/reports', read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuid(), type: 'crowd_update',
    title: 'Resource status changed',
    message: 'MedPlus Pharmacy status updated to "Open" by community.',
    link: '/emergency-map', read: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: uuid(), type: 'system',
    title: 'Welcome to CivicHub!',
    message: 'Start by exploring the emergency map or reporting an issue.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function load(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedNotifications));
  return seedNotifications;
}

function save(data: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getNotifications(): Notification[] {
  return load().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadCount(): number {
  return load().filter((n) => !n.read).length;
}

export function markAsRead(id: string): void {
  const notifs = load();
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifs[idx].read = true;
    save(notifs);
  }
}

export function markAllAsRead(): void {
  const notifs = load();
  notifs.forEach((n) => (n.read = true));
  save(notifs);
}

export function addNotification(data: {
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
}): Notification {
  const notifs = load();
  const notif: Notification = {
    id: uuid(),
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.unshift(notif);
  save(notifs);
  return notif;
}
