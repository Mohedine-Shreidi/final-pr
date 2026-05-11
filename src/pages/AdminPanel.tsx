import { useState, useEffect } from 'react';
import {
  Shield, Users, FileText, BarChart3, Ban, CheckCircle, TrendingUp,
  AlertTriangle, MapPin, Search, Activity, Star, Globe
} from 'lucide-react';
import { getReports, confirmReport, deleteReport } from '../services/reportService';
import { getResources } from '../services/resourceService';
import { getLostFoundPosts, confirmLostFoundPost } from '../services/lostFoundService';
import { getSharedItems, confirmItem } from '../services/sharingService';
import { getAccessibilityPoints, getObstacles, confirmAccessibilityPoint, confirmObstacle } from '../services/accessibilityService';
import { supabase } from '../lib/supabase';
import type { Report } from '../types';

type AdminTab = 'overview' | 'moderation' | 'analytics' | 'users';

interface UserReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  item_id?: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

interface ModerationItem {
  id: string;
  title: string;
  user: string;
  source: 'report' | 'lost_found' | 'sharing' | 'obstacle' | 'accessibility';
  time: string;
  isConfirmed: boolean;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  trust_score: number;
  created_at: string;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  user: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  volunteer: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
  authority: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  admin: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [modItems, setModItems] = useState<ModerationItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);

  // Stats
  const [reports, setReports] = useState<Report[]>([]);
  const [lfCount, setLfCount] = useState(0);
  const [sharedCount, setSharedCount] = useState(0);
  const [accCount, setAccCount] = useState(0);
  const [obstCount, setObstCount] = useState(0);
  const [userReports, setUserReports] = useState<UserReportRow[]>([]);

  const resources = getResources();

  // Load all data
  const loadData = async () => {
    // Reports (including unconfirmed)
    const allReports = await getReports({ includeUnconfirmed: true });
    setReports(allReports);

    // Unconfirmed items for moderation queue
    const [unconfReports, unconfLF, unconfShared, unconfObs, unconfAcc] = await Promise.all([
      getReports({ includeUnconfirmed: true }),
      getLostFoundPosts({ includeUnconfirmed: true }),
      getSharedItems({ includeUnconfirmed: true }),
      (async () => { const { getObstacles } = await import('../services/accessibilityService'); return getObstacles({ includeUnconfirmed: true }); })(),
      (async () => { const { getAccessibilityPoints } = await import('../services/accessibilityService'); return getAccessibilityPoints({ includeUnconfirmed: true }); })(),
    ]);

    const confirmedLF = await getLostFoundPosts();
    const confirmedShared = await getSharedItems();
    const confirmedAcc = await getAccessibilityPoints();
    const confirmedObs = await getObstacles();
    setLfCount(confirmedLF.length);
    setSharedCount(confirmedShared.length);
    setAccCount(confirmedAcc.length);
    setObstCount(confirmedObs.length);

    // Build moderation queue from unconfirmed items
    const queue: ModerationItem[] = [];
    unconfReports.filter(r => !r.isConfirmed).forEach(r => queue.push({ id: r.id, title: r.title, user: r.userName, source: 'report', time: timeAgo(r.createdAt), isConfirmed: false }));
    unconfLF.filter(p => !p.isConfirmed).forEach(p => queue.push({ id: p.id, title: p.title, user: p.userName, source: 'lost_found', time: timeAgo(p.createdAt), isConfirmed: false }));
    unconfShared.filter(i => !i.isConfirmed).forEach(i => queue.push({ id: i.id, title: i.title, user: i.userName, source: 'sharing', time: timeAgo(i.createdAt), isConfirmed: false }));
    unconfObs.filter(o => !o.isConfirmed).forEach(o => queue.push({ id: o.id, title: o.description, user: 'Community', source: 'obstacle', time: timeAgo(o.createdAt), isConfirmed: false }));
    unconfAcc.filter(a => !a.isConfirmed).forEach(a => queue.push({ id: a.id, title: a.name, user: 'Community', source: 'accessibility', time: timeAgo(a.createdAt), isConfirmed: false }));
    setModItems(queue);

    // Load users from profiles table
    const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (profileData) {
      setUsers(profileData.map((p: any) => ({ id: p.id, name: p.name || '', email: p.email || '', role: p.role || 'user', trust_score: p.trust_score || 0, created_at: p.created_at })));
    }

    // Load user reports (faulty item reports)
    const { data: urData } = await supabase.from('user_reports').select('*').order('created_at', { ascending: false });
    if (urData && profileData) {
      const profileMap = Object.fromEntries((profileData as any[]).map((p: any) => [p.id, p.name || 'Unknown']));
      setUserReports(urData.map((r: any) => ({
        id: r.id,
        reporter_id: r.reporter_id,
        reported_user_id: r.reported_user_id,
        item_id: r.item_id,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
        reporter_name: profileMap[r.reporter_id] || 'Unknown',
        reported_name: profileMap[r.reported_user_id] || 'Unknown',
      })));
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (item: ModerationItem) => {
    let ok = false;
    switch (item.source) {
      case 'report': ok = await confirmReport(item.id, true); break;
      case 'lost_found': ok = await confirmLostFoundPost(item.id, true); break;
      case 'sharing': ok = await confirmItem(item.id, true); break;
      case 'obstacle': ok = await confirmObstacle(item.id, true); break;
      case 'accessibility': ok = await confirmAccessibilityPoint(item.id, true); break;
    }
    if (ok) loadData();
  };

  const handleReject = async (item: ModerationItem) => {
    // For now, reject = delete for reports, or just leave unconfirmed
    if (item.source === 'report') await deleteReport(item.id);
    setModItems(prev => prev.filter(m => m.id !== item.id));
  };

  const handleGrantAdmin = async (userId: string) => {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    loadData();
  };

  const pendingMod = modItems.length;
  const pendingUserReports = userReports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const activeReports = reports.filter(r => r.status !== 'resolved').length;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const reportData = [3, 5, 2, 8, 4, 6, 1];
  const maxVal = Math.max(...reportData);

  const sourceColors: Record<string, { bg: string; text: string }> = {
    report: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    lost_found: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
    sharing: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    obstacle: { bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
    accessibility: { bg: 'rgba(6,182,212,0.1)', text: '#06b6d4' },
  };

  const tabs: { value: AdminTab; label: string; icon: typeof Shield }[] = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'moderation', label: `Moderation (${pendingMod + pendingUserReports})`, icon: Shield },
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
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Platform management & moderation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success text-[10px]">System Online</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Reports', value: reports.length, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', sub: `${activeReports} active` },
              { label: 'Resources', value: resources.length, icon: MapPin, color: '#10b981', bg: 'rgba(16,185,129,0.1)', sub: `${resources.filter(r => r.status === 'open').length} open` },
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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Lost & Found', value: lfCount, color: '#8b5cf6' },
              { label: 'Shared Items', value: sharedCount, color: '#f97316' },
              { label: 'Access Points', value: accCount, color: '#06b6d4' },
              { label: 'Obstacles', value: obstCount, color: '#ef4444' },
              { label: 'Resolved', value: resolvedReports, color: '#10b981' },
            ].map((s) => (
              <div key={s.label} className="card py-3 text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={16} style={{ color: 'var(--color-primary-500)' }} /> Weekly Reports
              </h4>
              <div className="flex items-end gap-2 h-32">
                {reportData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg transition-all duration-700"
                      style={{ height: `${(val / maxVal) * 100}%`, background: 'linear-gradient(to top, #06b6d4, #3b82f6)', minHeight: '8px' }} />
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
                  { label: 'Content Quality', value: 95, color: '#8b5cf6' },
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
            <button onClick={loadData} className="btn btn-secondary text-xs"><Activity size={12} /> Refresh</button>
          </div>

          {modItems.length === 0 && (
            <div className="card text-center py-12">
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#10b981' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No items pending moderation</p>
            </div>
          )}

          {modItems.map((item) => (
            <div key={`${item.source}-${item.id}`} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: sourceColors[item.source]?.bg }}>
                  <AlertTriangle size={16} style={{ color: sourceColors[item.source]?.text }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>by {item.user}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>· {item.time}</span>
                    <span className="badge text-[9px]" style={{ background: sourceColors[item.source]?.bg, color: sourceColors[item.source]?.text }}>{item.source.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleApprove(item)}
                  className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <CheckCircle size={12} /> Approve
                </button>
                <button onClick={() => handleReject(item)}
                  className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <Ban size={12} /> Reject
                </button>
              </div>
            </div>
          ))}

          {/* User Reports Section */}
          {userReports.filter(r => r.status === 'pending').length > 0 && (
            <>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: '#f59e0b' }}>
                  <AlertTriangle size={14} /> User Conduct Reports ({userReports.filter(r => r.status === 'pending').length} pending)
                </p>
              </div>
              {userReports.filter(r => r.status === 'pending').map((ur) => (
                <div key={ur.id} className="card border-l-2" style={{ borderLeftColor: '#f59e0b' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge text-[9px]" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Faulty Return / Conduct</span>
                      </div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--color-primary-500)' }}>{ur.reporter_name}</span> reported <span style={{ color: '#ef4444' }}>{ur.reported_name}</span>
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ur.reason}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(ur.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={async () => {
                          await supabase.from('user_reports').update({ status: 'resolved' }).eq('id', ur.id);
                          loadData();
                        }}
                        className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <CheckCircle size={12} /> Resolve
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.from('user_reports').update({ status: 'reviewed' }).eq('id', ur.id);
                          loadData();
                        }}
                        className="btn text-[10px] py-1.5 px-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Ban size={12} /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* === ANALYTICS TAB === */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="card">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 size={16} style={{ color: 'var(--color-primary-500)' }} /> Report Categories
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Roads & Potholes', count: reports.filter(r => r.category === 'roads').length, color: '#3b82f6', emoji: '🛣️' },
                { label: 'Street Lighting', count: reports.filter(r => r.category === 'lighting').length, color: '#f59e0b', emoji: '💡' },
                { label: 'Water Leaks', count: reports.filter(r => r.category === 'water_leaks').length, color: '#06b6d4', emoji: '💧' },
                { label: 'Garbage', count: reports.filter(r => r.category === 'garbage').length, color: '#10b981', emoji: '🗑️' },
                { label: 'Hazards', count: reports.filter(r => r.category === 'hazards').length, color: '#ef4444', emoji: '⚠️' },
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Report Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Reported', count: reports.filter(r => r.status === 'reported').length, color: '#ef4444' },
                  { label: 'Verified', count: reports.filter(r => r.status === 'verified').length, color: '#f59e0b' },
                  { label: 'In Progress', count: reports.filter(r => r.status === 'in_progress').length, color: '#3b82f6' },
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
                  { label: 'Hospitals', count: resources.filter(r => r.type === 'hospital').length, emoji: '🏥' },
                  { label: 'Pharmacies', count: resources.filter(r => r.type === 'pharmacy').length, emoji: '💊' },
                  { label: 'Shelters', count: resources.filter(r => r.type === 'shelter').length, emoji: '🏠' },
                  { label: 'Water', count: resources.filter(r => r.type === 'water').length, emoji: '💧' },
                  { label: 'Fuel', count: resources.filter(r => r.type === 'fuel').length, emoji: '⛽' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                    <span className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>{t.emoji} {t.label}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.count}</span>
                  </div>
                ))}
              </div>
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
                  {['User', 'Role', 'Trust', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase"
                      style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                          {u.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-[9px] capitalize" style={{ background: (roleColors[u.role] || roleColors.user).bg, color: (roleColors[u.role] || roleColors.user).text }}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{u.trust_score}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.role !== 'admin' && (
                          <button onClick={() => handleGrantAdmin(u.id)}
                            className="btn text-[10px] py-1 px-2" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            <Shield size={10} /> Make Admin
                          </button>
                        )}
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
