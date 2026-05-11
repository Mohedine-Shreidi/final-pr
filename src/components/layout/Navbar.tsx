import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Menu, Check, Settings, User, LogOut } from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GlobalSearch from './GlobalSearch';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '../../services/notificationService';

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/emergency-map': 'Emergency Map',
  '/reports': 'Reports',
  '/lost-found': 'Lost & Found',
  '/accessibility': 'Accessibility',
  '/sharing': 'Community Sharing',
  '/assistant': 'AI Assistant',
  '/admin': 'Admin Panel',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

const typeIcons: Record<string, { emoji: string; color: string }> = {
  match: { emoji: '🔍', color: '#8b5cf6' },
  report_update: { emoji: '📋', color: '#3b82f6' },
  borrow_request: { emoji: '📦', color: '#f59e0b' },
  system: { emoji: '⚡', color: '#06b6d4' },
  crowd_update: { emoji: '👥', color: '#10b981' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { isDark, toggle } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const pageTitle = pageTitles[location.pathname] || 'CivicHub';

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshNotifs = () => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id);
    refreshNotifs();
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    refreshNotifs();
  };

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="glass sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6"
      style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuToggle} className="btn-ghost p-2 rounded-lg md:hidden" aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <GlobalSearch />

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); refreshNotifs(); }}
            className="btn-ghost p-2.5 rounded-xl relative"
            style={{ color: 'var(--text-secondary)' }}
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: '#ef4444', border: '2px solid var(--bg-primary)' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] font-medium flex items-center gap-1"
                    style={{ color: 'var(--color-primary-500)' }}>
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const icon = typeIcons[notif.type] || typeIcons.system;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)] transition-colors border-b"
                        style={{
                          borderColor: 'var(--border-light)',
                          background: notif.read ? undefined : 'rgba(6, 182, 212, 0.03)',
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                          style={{ background: `${icon.color}15` }}>
                          {icon.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1.5" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="btn-ghost p-2.5 rounded-xl"
          style={{ color: 'var(--text-secondary)' }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 group">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
              {profile?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.name || 'User'}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{profile?.email || ''}</p>
              </div>
              <div className="py-1">
                {[
                  { label: 'Profile', icon: User, path: '/profile' },
                  { label: 'Settings', icon: Settings, path: '/settings' },
                ].map((item) => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    <item.icon size={14} /> {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t py-1" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => { signOut(); setShowUserMenu(false); navigate('/auth'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
                  style={{ color: '#ef4444' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
