import { useState } from 'react';
import {
  User, Star, FileText, Package, Search as SearchIcon, MapPin, Shield,
  Calendar, Mail, Award, TrendingUp, Eye, Clock, Heart, Edit3,
  Camera, CheckCircle, AlertTriangle, Accessibility,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getReports } from '../services/reportService';
import { getLostFoundPosts } from '../services/lostFoundService';
import { getSharedItems } from '../services/sharingService';

type ProfileTab = 'activity' | 'reports' | 'items' | 'badges';

const currentUser = {
  id: 'u-current',
  name: 'Alex Rivera',
  email: 'alex.rivera@email.com',
  role: 'volunteer' as const,
  trustScore: 94,
  memberSince: 'Jun 2025',
  bio: 'Active community member, volunteer firefighter, and accessibility advocate. Passionate about making our neighborhood safer and more inclusive.',
  location: 'Central District, Amman',
  reportsSubmitted: 0,
  itemsShared: 0,
  lfPosts: 0,
  helpfulVotes: 47,
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  total: number;
  color: string;
}

const badges: Badge[] = [
  { id: 'b1', name: 'First Responder', description: 'Submit your first emergency report', icon: '🚨', earned: true, progress: 1, total: 1, color: '#ef4444' },
  { id: 'b2', name: 'Good Samaritan', description: 'Help return 3 lost items', icon: '🤝', earned: false, progress: 1, total: 3, color: '#10b981' },
  { id: 'b3', name: 'Community Builder', description: 'Share 5 items with neighbors', icon: '🏗️', earned: false, progress: 3, total: 5, color: '#3b82f6' },
  { id: 'b4', name: 'Accessibility Champion', description: 'Rate 10 accessibility points', icon: '♿', earned: false, progress: 4, total: 10, color: '#8b5cf6' },
  { id: 'b5', name: 'Watchdog', description: 'Submit 10 verified reports', icon: '🔍', earned: true, progress: 10, total: 10, color: '#f59e0b' },
  { id: 'b6', name: 'Trusted Voice', description: 'Reach trust score of 90+', icon: '⭐', earned: true, progress: 94, total: 90, color: '#06b6d4' },
  { id: 'b7', name: 'Resource Hunter', description: 'Verify 5 resource statuses', icon: '🗺️', earned: false, progress: 2, total: 5, color: '#14b8a6' },
  { id: 'b8', name: 'Power User', description: 'Use all 6 platform modules', icon: '⚡', earned: true, progress: 6, total: 6, color: '#f97316' },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
  const [isEditing, setIsEditing] = useState(false);
  const { profile } = useAuth();

  const userName = profile?.name || 'User';
  const userEmail = profile?.email || '';
  const userRole = profile?.role || 'user';
  const userTrust = profile?.trust_score ?? 50;
  const userInitials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';

  const reports = getReports();
  const lfPosts = getLostFoundPosts();
  const sharedItems = getSharedItems();

  // Simulate user's activity
  const userReports = reports.slice(0, 3);
  const userItems = sharedItems.slice(0, 3);

  const recentActivity = [
    { action: 'Submitted a report', detail: 'Water leak on Main Street', time: '2 hours ago', icon: '📝', color: '#3b82f6' },
    { action: 'Shared an item', detail: 'Power Drill (Bosch)', time: '1 day ago', icon: '📦', color: '#f59e0b' },
    { action: 'Found a wallet', detail: 'Black leather wallet near park', time: '2 days ago', icon: '🔍', color: '#8b5cf6' },
    { action: 'Rated accessibility point', detail: 'City Hall Main Ramp — 4.5★', time: '3 days ago', icon: '♿', color: '#06b6d4' },
    { action: 'Confirmed obstacle', detail: 'Construction on Oak Ave', time: '4 days ago', icon: '⚠️', color: '#ef4444' },
    { action: 'Borrowed an item', detail: 'Camping Tent (4-Person)', time: '5 days ago', icon: '🏕️', color: '#10b981' },
  ];

  const tabs: { value: ProfileTab; label: string; icon: typeof User }[] = [
    { value: 'activity', label: 'Activity', icon: Clock },
    { value: 'reports', label: 'My Reports', icon: FileText },
    { value: 'items', label: 'My Items', icon: Package },
    { value: 'badges', label: 'Badges', icon: Award },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Profile header */}
      <div className="card relative overflow-hidden">
        {/* Banner */}
        <div className="absolute inset-x-0 top-0 h-24 rounded-t-xl"
          style={{ background: 'linear-gradient(135deg, #0e7490, #06b6d4, #3b82f6)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative pt-14 px-1">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: '4px solid var(--bg-card)' }}>
                {userInitials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'var(--color-primary-500)' }}>
                <Camera size={12} className="text-white" />
              </button>
            </div>
            <div className="flex-1 mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{userName}</h2>
                <span className="badge text-[9px] capitalize" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {userRole}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <MapPin size={11} /> Central District · <Calendar size={11} /> Joined {memberSince}
              </p>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary text-xs">
              <Edit3 size={13} /> Edit Profile
            </button>
          </div>

          {/* Bio */}
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Active community member and accessibility advocate. Passionate about making our neighborhood safer and more inclusive.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Trust Score', value: `${userTrust}/100`, icon: Star, color: '#f59e0b' },
              { label: 'Reports', value: String(userReports.length), icon: FileText, color: '#3b82f6' },
              { label: 'Items Shared', value: String(userItems.length), icon: Package, color: '#f97316' },
              { label: 'Helpful Votes', value: String(currentUser.helpfulVotes), icon: Heart, color: '#ef4444' },
              { label: 'Badges Earned', value: `${badges.filter((b) => b.earned).length}/${badges.length}`, icon: Award, color: '#8b5cf6' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <stat.icon size={16} className="mx-auto mb-1" style={{ color: stat.color }} />
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className="flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{
              background: activeTab === tab.value ? 'var(--color-primary-500)' : 'var(--bg-card)',
              color: activeTab === tab.value ? 'white' : 'var(--text-secondary)',
            }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="card space-y-1">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={16} style={{ color: 'var(--color-primary-500)' }} /> Recent Activity
          </h4>
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: `${a.color}15` }}>{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.action}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{a.detail}</p>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{a.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {userReports.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <AlertTriangle size={16} style={{ color: '#3b82f6' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {r.category} · {r.address} · 👍 {r.votes} votes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge text-[9px] ${
                  r.status === 'resolved' ? 'badge-success' : r.status === 'in_progress' ? 'badge-info' : 'badge-warning'
                }`}>{r.status}</span>
                <span className={`badge text-[9px] ${
                  r.urgency === 'critical' ? 'badge-danger' : r.urgency === 'high' ? 'badge-warning' : 'badge-info'
                }`}>{r.urgency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {userItems.map((item) => (
            <div key={item.id} className="card text-center">
              <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}>
                <Package size={28} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <h5 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h5>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.category}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`badge text-[9px] ${item.available ? 'badge-success' : 'badge-warning'}`}>
                  {item.available ? 'Available' : 'Borrowed'}
                </span>
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
                  ★ {item.rating.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge) => (
            <div key={badge.id} className="card flex items-center gap-3"
              style={{ opacity: badge.earned ? 1 : 0.65 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: badge.earned ? `${badge.color}15` : 'var(--bg-tertiary)' }}>
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{badge.name}</h5>
                  {badge.earned && <CheckCircle size={12} style={{ color: '#10b981' }} />}
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{badge.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((badge.progress / badge.total) * 100, 100)}%`, background: badge.color }} />
                  </div>
                  <span className="text-[9px] font-semibold" style={{ color: badge.earned ? badge.color : 'var(--text-tertiary)' }}>
                    {badge.progress}/{badge.total}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
