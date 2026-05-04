import { useState, useEffect } from 'react';
import {
  Shield, Users, FileText, BarChart3, Eye, Ban, CheckCircle, TrendingUp,
  AlertTriangle, MapPin, Package, Search, Activity, Clock, RefreshCw,
  Trash2, Settings, X, Star, Globe,
} from 'lucide-react';
import { getReports } from '../services/reportService';
import { getResources } from '../services/resourceService';
import { getLostFoundPosts } from '../services/lostFoundService';
import { getSharedItems } from '../services/sharingService';
import { getAccessibilityPoints, getObstacles } from '../services/accessibilityService';
import { getNotifications } from '../services/notificationService';
import type { Report } from '../types';

type AdminTab = 'overview' | 'moderation' | 'analytics' | 'users';

interface ModerationItem {
  id: string;
  title: string;
  user: string;
  type: 'spam' | 'inappropriate' | 'duplicate' | 'fake';
  source: 'report' | 'lost_found' | 'resource' | 'sharing';
  time: string;
  status: 'pending' | 'approved' | 'rejected';
}

const seedModeration: ModerationItem[] = [
  { id: '1', title: 'Suspicious pharmacy listing — unverified address', user: 'user_anon42', type: 'fake', source: 'resource', time: '25 min ago', status: 'pending' },
  { id: '2', title: 'Spam report — non-existent pothole on Elm St', user: 'troll_123', type: 'spam', source: 'report', time: '1 hour ago', status: 'pending' },
  { id: '3', title: 'Inappropriate description in lost item post', user: 'anon_user5', type: 'inappropriate', source: 'lost_found', time: '2 hours ago', status: 'pending' },
  { id: '4', title: 'Duplicate resource — same pharmacy listed twice', user: 'helper_bot', type: 'duplicate', source: 'resource', time: '3 hours ago', status: 'pending' },
  { id: '5', title: 'Misleading sharing item — fake pricing', user: 'scam_acct', type: 'fake', source: 'sharing', time: '5 hours ago', status: 'pending' },
];

const seedUsers = [
  { id: 'u1', name: 'Ahmad K.', email: 'ahmad@mail.com', role: 'user', trust: 92, reports: 12, items: 3, joined: '2025-08-15' },
  { id: 'u2', name: 'Sara M.', email: 'sara@mail.com', role: 'volunteer', trust: 97, reports: 28, items: 5, joined: '2025-06-22' },
  { id: 'u3', name: 'Omar B.', email: 'omar@mail.com', role: 'authority', trust: 100, reports: 45, items: 2, joined: '2025-04-10' },
  { id: 'u4', name: 'Noor A.', email: 'noor@mail.com', role: 'user', trust: 85, reports: 7, items: 1, joined: '2025-11-02' },
  { id: 'u5', name: 'Lina H.', email: 'lina@mail.com', role: 'user', trust: 78, reports: 3, items: 4, joined: '2026-01-18' },
  { id: 'u6', name: 'Khaled R.', email: 'khaled@mail.com', role: 'volunteer', trust: 95, reports: 19, items: 6, joined: '2025-09-05' },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  user: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  volunteer: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
  authority: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  admin: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
};

const typeStyles: Record<string, { badge: string }> = {
  spam: { badge: 'badge-danger' },
  inappropriate: { badge: 'badge-warning' },
  duplicate: { badge: 'badge-info' },
  fake: { badge: 'badge-danger' },
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [modItems, setModItems] = useState<ModerationItem[]>(seedModeration);
  const [userSearch, setUserSearch] = useState('');

  // Live stats from services
  const reports = getReports();
  const resources = getResources();
  const lfPosts = getLostFoundPosts();
  const sharedItems = getSharedItems();
  const accPoints = getAccessibilityPoints();
  const obstacles = getObstacles();

  const pendingMod = modItems.filter((m) => m.status === 'pending').length;
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length;
  const activeReports = reports.filter((r) => r.status !== 'resolved').length;

  const handleModAction = (id: string, action: 'approved' | 'rejected') => {
    setModItems((prev) => prev.map((m) => m.id === id ? { ...m, status: action } : m));
  };

  const filteredUsers = seedUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Chart data (simulated weekly)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const reportData = [3, 5, 2, 8, 4, 6, 1];
  const maxVal = Math.max(...reportData);

  const tabs: { value: AdminTab; label: string; icon: typeof Shield }[] = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'moderation', label: `Moderation (${pendingMod})`, icon: Shield },
    { value: 'analytics', label: 'Analytics', icon: TrendingUp },
    { value: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Platform management & analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success text-[10px]">System Online</span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>v1.0.0</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className="flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{
              background: activeTab === tab.value ? 'var(--color-primary-500)' : 'var(--bg-card)',
              color: activeTab === tab.value ? 'white' : 'var(--text-secondary)',
            }}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Reports', value: reports.length, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', sub: `${activeReports} active` },
              { label: 'Resources', value: resources.length, icon: MapPin, color: '#10b981', bg: 'rgba(16,185,129,0.1)', sub: `${resources.filter((r) => r.status === 'open').length} open` },
              { label: 'Moderation Queue', value: pendingMod, icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', sub: 'pending review' },
              { label: 'Community Score', value: '94%', icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', sub: 'health index' },
            ].map((stat) => (
              <div key={stat.label} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</div>
                <div className="text-[10px]" style={{ color: stat.color }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Lost & Found', value: lfPosts.length, color: '#8b5cf6' },
              { label: 'Shared Items', value: sharedItems.length, color: '#f97316' },
              { label: 'Access Points', value: accPoints.length, color: '#06b6d4' },
              { label: 'Obstacles', value: obstacles.length, color: '#ef4444' },
              { label: 'Resolved', value: resolvedReports, color: '#10b981' },
            ].map((s) => (
              <div key={s.label} className="card py-3 text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mini chart + Recent Moderation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={16} style={{ color: 'var(--color-primary-500)' }} /> Weekly Reports
              </h4>
              <div className="flex items-end gap-2 h-32">
                {reportData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg transition-all duration-700"
                      style={{ height: `${(val / maxVal) * 100}%`, background: `linear-gradient(to top, #06b6d4, #3b82f6)`, minHeight: '8px' }} />
                    <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Globe size={16} style={{ color: 'var(--color-primary-500)' }} /> Platform Health
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Report Resolution', value: Math.round((resolvedReports / Math.max(reports.length, 1)) * 100), color: '#10b981' },
                  { label: 'Resource Accuracy', value: 92, color: '#3b82f6' },
                  { label: 'Item Recovery Rate', value: Math.round((lfPosts.filter((p) => p.status === 'claimed').length / Math.max(lfPosts.length, 1)) * 100), color: '#f59e0b' },
                  { label: 'Content Quality', value: Math.round(((modItems.length - pendingMod) / Math.max(modItems.length, 1)) * 100), color: '#8b5cf6' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                      <span className="font-semibold" style={{ color: m.color }}>{m.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.value}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODERATION TAB === */}
      {activeTab === 'moderation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {pendingMod} items pending review
            </p>
          </div>
          {modItems.map((item) => (
            <div key={item.id} className="card flex items-center justify-between gap-3"
              style={{ opacity: item.status !== 'pending' ? 0.5 : 1 }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.type === 'spam' || item.type === 'fake' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)' }}>
                  <AlertTriangle size={16} style={{ color: item.type === 'spam' || item.type === 'fake' ? '#ef4444' : '#f59e0b' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>by {item.user}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>· {item.time}</span>
                    <span className={`badge text-[9px] ${typeStyles[item.type]?.badge}`}>{item.type}</span>
                    <span className="badge text-[9px]" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>{item.source}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.status === 'pending' ? (
                  <>
                    <button onClick={() => handleModAction(item.id, 'approved')}
                      className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button onClick={() => handleModAction(item.id, 'rejected')}
                      className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Ban size={12} /> Reject
                    </button>
                  </>
                ) : (
                  <span className={`badge text-[10px] ${item.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === ANALYTICS TAB === */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Category breakdown */}
          <div className="card">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 size={16} style={{ color: 'var(--color-primary-500)' }} /> Report Categories
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Roads & Potholes', count: reports.filter((r) => r.category === 'roads').length, color: '#3b82f6', emoji: '🛣️' },
                { label: 'Street Lighting', count: reports.filter((r) => r.category === 'lighting').length, color: '#f59e0b', emoji: '💡' },
                { label: 'Water Leaks', count: reports.filter((r) => r.category === 'water_leaks').length, color: '#06b6d4', emoji: '💧' },
                { label: 'Garbage', count: reports.filter((r) => r.category === 'garbage').length, color: '#10b981', emoji: '🗑️' },
                { label: 'Hazards', count: reports.filter((r) => r.category === 'hazards').length, color: '#ef4444', emoji: '⚠️' },
              ].map((cat) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span className="text-lg">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                      <span className="font-semibold" style={{ color: cat.color }}>{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max((cat.count / Math.max(reports.length, 1)) * 100, 5)}%`, background: cat.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status distribution + Resource types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Report Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Reported', count: reports.filter((r) => r.status === 'reported').length, color: '#ef4444' },
                  { label: 'Verified', count: reports.filter((r) => r.status === 'verified').length, color: '#f59e0b' },
                  { label: 'In Progress', count: reports.filter((r) => r.status === 'in_progress').length, color: '#3b82f6' },
                  { label: 'Resolved', count: resolvedReports, color: '#10b981' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: `${s.color}10` }}>
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Resource Types</h4>
              <div className="space-y-2">
                {[
                  { label: 'Hospitals', count: resources.filter((r) => r.type === 'hospital').length, emoji: '🏥' },
                  { label: 'Pharmacies', count: resources.filter((r) => r.type === 'pharmacy').length, emoji: '💊' },
                  { label: 'Shelters', count: resources.filter((r) => r.type === 'shelter').length, emoji: '🏠' },
                  { label: 'Water', count: resources.filter((r) => r.type === 'water').length, emoji: '💧' },
                  { label: 'Fuel', count: resources.filter((r) => r.type === 'fuel').length, emoji: '⛽' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                    <span className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>{t.emoji} {t.label}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Urgency distribution */}
          <div className="card">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Urgency Distribution</h4>
            <div className="flex gap-3">
              {[
                { label: 'Critical', count: reports.filter((r) => r.urgency === 'critical').length, color: '#ef4444' },
                { label: 'High', count: reports.filter((r) => r.urgency === 'high').length, color: '#f97316' },
                { label: 'Medium', count: reports.filter((r) => r.urgency === 'medium').length, color: '#f59e0b' },
                { label: 'Low', count: reports.filter((r) => r.urgency === 'low').length, color: '#10b981' },
              ].map((u) => (
                <div key={u.label} className="flex-1 p-3 rounded-xl text-center" style={{ background: `${u.color}10`, border: `1px solid ${u.color}30` }}>
                  <div className="text-xl font-bold" style={{ color: u.color }}>{u.count}</div>
                  <div className="text-[10px] font-medium" style={{ color: u.color }}>{u.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === USERS TAB === */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border flex-1 max-w-sm"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
              <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..." className="bg-transparent outline-none text-sm flex-1"
                style={{ color: 'var(--text-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{filteredUsers.length} users</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['User', 'Role', 'Trust Score', 'Reports', 'Items', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase"
                      style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-[9px] capitalize" style={roleColors[user.role]}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${user.trust}%`,
                            background: user.trust >= 90 ? '#10b981' : user.trust >= 70 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user.trust}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{user.reports}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{user.items}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.joined}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost p-1.5 rounded-lg hover:text-cyan-500" title="View"><Eye size={14} /></button>
                        <button className="btn-ghost p-1.5 rounded-lg hover:text-red-500" title="Ban"><Ban size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
