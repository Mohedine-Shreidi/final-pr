import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Map,
  AlertTriangle,
  Search,
  Accessibility,
  Package,
  MessageCircle,
  TrendingUp,
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  Zap,
  MapPin,
  Clock,
} from 'lucide-react';
import { getReports } from '../services/reportService';
import { getResources } from '../services/resourceService';
import { getSharedItems } from '../services/sharingService';
import { getLostFoundPosts } from '../services/lostFoundService';

/* ---- Live Stats ---- */
function useLiveStats() {
  const [stats, setStats] = useState([
    { label: 'Active Reports', value: '0', change: '0 total', positive: true, icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Resources Mapped', value: '0', change: '0 open', positive: true, icon: MapPin, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Items Shared', value: '0', change: '0 available', positive: true, icon: Package, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Lost & Found', value: '0', change: '0 active', positive: true, icon: Users, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ]);

  useEffect(() => {
    async function load() {
      const [reports, items, lfPosts] = await Promise.all([
        getReports(),
        getSharedItems(),
        getLostFoundPosts(),
      ]);
      const resources = getResources();

      setStats([
        {
          label: 'Active Reports',
          value: String(reports.filter((r) => r.status !== 'resolved').length),
          change: `${reports.length} total`,
          positive: true,
          icon: FileText,
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Resources Mapped',
          value: String(resources.length),
          change: `${resources.filter((r) => r.status === 'open').length} open`,
          positive: true,
          icon: MapPin,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'Items Shared',
          value: String(items.length),
          change: `${items.filter((i) => i.available).length} available`,
          positive: true,
          icon: Package,
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        {
          label: 'Lost & Found',
          value: String(lfPosts.length),
          change: `${lfPosts.filter((p) => p.status === 'active').length} active`,
          positive: true,
          icon: Users,
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.1)',
        },
      ]);
    }
    load();
  }, []);

  return stats;
}

/* ---- Quick Actions ---- */
const quickActions = [
  {
    to: '/emergency-map',
    icon: Map,
    label: 'Emergency Map',
    description: 'Find nearby hospitals, pharmacies & shelters',
    gradient: 'linear-gradient(135deg, #0e7490, #06b6d4)',
  },
  {
    to: '/reports',
    icon: AlertTriangle,
    label: 'Report Issue',
    description: 'Report roads, lighting, water leaks & more',
    gradient: 'linear-gradient(135deg, #dc2626, #f97316)',
  },
  {
    to: '/lost-found',
    icon: Search,
    label: 'Lost & Found',
    description: 'Post or find lost items in your area',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
  },
  {
    to: '/accessibility',
    icon: Accessibility,
    label: 'Accessibility',
    description: 'Find wheelchair-friendly routes & places',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
  },
  {
    to: '/sharing',
    icon: Package,
    label: 'Community Sharing',
    description: 'Borrow or lend items with neighbors',
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
  },
  {
    to: '/assistant',
    icon: MessageCircle,
    label: 'AI Assistant',
    description: 'Ask anything about community services',
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
  },
];

/* ---- Recent Activity ---- */
const recentActivity = [
  {
    type: 'report',
    text: 'Water leak reported on Main Street',
    time: '5 min ago',
    status: 'new',
  },
  {
    type: 'found',
    text: 'Black wallet found near Central Park',
    time: '12 min ago',
    status: 'active',
  },
  {
    type: 'resource',
    text: 'City Pharmacy updated status to Open',
    time: '30 min ago',
    status: 'resolved',
  },
  {
    type: 'share',
    text: 'Power drill listed for borrowing',
    time: '1 hour ago',
    status: 'active',
  },
  {
    type: 'report',
    text: 'Pothole fixed on Oak Avenue',
    time: '2 hours ago',
    status: 'resolved',
  },
];

const statusColors: Record<string, string> = {
  new: 'badge-danger',
  active: 'badge-info',
  resolved: 'badge-success',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useLiveStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div
        className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0e7490, #06b6d4, #0891b2)',
        }}
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            transform: 'translate(-50%, 40%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-amber-300" />
            <span className="text-cyan-100 text-sm font-medium">
              Welcome back
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Smart Community Support Platform
          </h2>
          <p className="text-cyan-100/80 max-w-xl text-sm md:text-base">
            Your unified hub for emergency resources, civic reporting,
            accessibility navigation, community sharing, and AI-powered
            assistance.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => navigate('/emergency-map')}
              className="btn bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20 text-sm"
            >
              <Map size={16} />
              Open Map
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className="btn bg-white text-cyan-800 hover:bg-white/90 text-sm font-semibold"
            >
              <MessageCircle size={16} />
              Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat-card">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: stat.bg }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: stat.positive ? '#10b981' : '#ef4444' }}>
                <TrendingUp size={12} />
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3
          className="text-base font-semibold mb-4 flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Activity size={18} style={{ color: 'var(--color-primary-500)' }} />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="card card-glow text-left group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: action.gradient }}
                >
                  <action.icon size={22} className="text-white" />
                </div>
                <ArrowUpRight
                  size={18}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-primary-500)' }}
                />
              </div>
              <h4
                className="font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {action.label}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3
            className="text-base font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Clock size={18} style={{ color: 'var(--color-primary-500)' }} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.text}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {item.time}
                  </p>
                </div>
                <span className={`badge ${statusColors[item.status]} ml-3 flex-shrink-0`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Health */}
        <div className="card">
          <h3
            className="text-base font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <TrendingUp size={18} style={{ color: 'var(--color-primary-500)' }} />
            Community Health
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Report Resolution Rate', value: 78, color: '#10b981' },
              { label: 'Resource Data Freshness', value: 92, color: '#3b82f6' },
              { label: 'Lost Item Recovery Rate', value: 45, color: '#f59e0b' },
              { label: 'Accessibility Coverage', value: 34, color: '#8b5cf6' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {metric.label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {metric.value}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${metric.value}%`,
                      background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
