import { useState, useEffect } from 'react';
import {
  Plus, MapPin, ThumbsUp, Clock, AlertTriangle,
  Search, LayoutGrid, Map as MapIcon, Eye, CheckCircle,
  Image, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getReports, voteReport, updateReportStatus, deleteReport } from '../services/reportService';
import ReportCreateModal from '../components/reports/ReportCreateModal';
import Portal from '../components/layout/Portal';
import type { Report, ReportCategory, ReportStatus } from '../types';

const categories: { value: ReportCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'roads', label: '🛣️ Roads' },
  { value: 'lighting', label: '💡 Lighting' },
  { value: 'water_leaks', label: '💧 Water Leaks' },
  { value: 'garbage', label: '🗑️ Garbage' },
  { value: 'hazards', label: '⚠️ Hazards' },
];



const statusStyles: Record<string, { badge: string; label: string; color: string }> = {
  reported: { badge: 'badge-warning', label: 'Reported', color: '#f59e0b' },
  verified: { badge: 'badge-info', label: 'Verified', color: '#3b82f6' },
  in_progress: { badge: 'badge-info', label: 'In Progress', color: '#8b5cf6' },
  resolved: { badge: 'badge-success', label: 'Resolved', color: '#10b981' },
};

const urgencyColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Reports() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ReportCategory | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<ReportStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [view, setView] = useState<'grid' | 'map'>('grid');

  const loadReports = async () => {
    const data = await getReports({
      category: activeCategory,
      status: activeStatus,
      search: search || undefined,
    });
    setReports(data);
  };

  const loadAllReports = async () => {
    const data = await getReports();
    setAllReports(data);
  };

  useEffect(() => {
    loadReports();
    loadAllReports();
  }, [activeCategory, activeStatus, search]);

  const handleVote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (user) await voteReport(id, user.id);
    loadReports();
  };

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    await updateReportStatus(id, status);
    loadReports();
    setSelectedReport(null);
  };

  const handleDeleteReport = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this report?');
    if (confirm) {
      await deleteReport(id);
      setSelectedReport(null);
      loadReports();
    }
  };

  /* ---- Report counts by status ---- */
  const countByStatus = {
    reported: allReports.filter((r) => r.status === 'reported').length,
    verified: allReports.filter((r) => r.status === 'verified').length,
    in_progress: allReports.filter((r) => r.status === 'in_progress').length,
    resolved: allReports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(countByStatus).map(([status, count]) => {
          const st = statusStyles[status];
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(activeStatus === status ? 'all' : status as ReportStatus)}
              className="card py-3 cursor-pointer"
              style={{
                borderColor: activeStatus === status ? st.color : undefined,
                boxShadow: activeStatus === status ? `0 0 12px ${st.color}30` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                <div className="w-3 h-3 rounded-full" style={{ background: st.color }} />
              </div>
              <p className="text-xs mt-1 capitalize" style={{ color: 'var(--text-tertiary)' }}>{st.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl border flex-1 min-w-[200px] max-w-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`btn text-xs ${activeCategory === cat.value ? 'btn-primary' : 'btn-secondary'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setView('grid')}
              className="px-3 py-2"
              style={{ background: view === 'grid' ? 'var(--color-primary-500)' : 'var(--bg-card)', color: view === 'grid' ? 'white' : 'var(--text-secondary)' }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('map')}
              className="px-3 py-2"
              style={{ background: view === 'map' ? 'var(--color-primary-500)' : 'var(--bg-card)', color: view === 'map' ? 'white' : 'var(--text-secondary)' }}
            >
              <MapIcon size={16} />
            </button>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">
            <Plus size={14} /> New Report
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
      </p>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="card card-glow cursor-pointer group"
            >
              {/* Image area */}
              {report.images.length > 0 ? (
                <div className="w-full h-36 rounded-xl mb-3 overflow-hidden">
                  <img src={report.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                  <Image size={24} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              )}

              {/* Status + Urgency */}
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${statusStyles[report.status]?.badge} text-[10px]`}>
                  {statusStyles[report.status]?.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: urgencyColors[report.urgency] }} />
                  <span className="text-[10px] capitalize" style={{ color: 'var(--text-tertiary)' }}>
                    {report.urgency}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h4 className="text-sm font-semibold mb-1 group-hover:text-cyan-500 transition-colors line-clamp-2"
                style={{ color: 'var(--text-primary)' }}>
                {report.title}
              </h4>
              <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {report.description}
              </p>

              <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <MapPin size={12} /> {report.address}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                <button
                  onClick={(e) => handleVote(e, report.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{
                    color: report.votedBy.includes('current-user') ? 'var(--color-primary-500)' : undefined,
                  }}
                >
                  <ThumbsUp size={13} /> {report.votes}
                </button>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {timeAgo(report.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {/* New report card */}
          <button
            onClick={() => setShowCreate(true)}
            className="card border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-400 transition-colors"
            style={{ minHeight: '250px', borderColor: 'var(--border-color)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <AlertTriangle size={24} style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Report a new issue
            </p>
          </button>
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <div className="card p-0 overflow-hidden" style={{ height: '500px' }}>
          <div className="relative w-full h-full rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0c1929 0%, #142438 40%, #1a3050 100%)' }}>
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`h${i}`} className="absolute w-full border-t border-cyan-400/30" style={{ top: `${(i + 1) * 8}%` }} />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={`v${i}`} className="absolute h-full border-l border-cyan-400/30" style={{ left: `${(i + 1) * 6}%` }} />
              ))}
            </div>
            {reports.map((r) => {
              const x = 10 + ((r.lng - 35.9) * 1200) % 80;
              const y = 10 + ((r.lat - 31.94) * 1200) % 75;
              return (
                <button key={r.id} onClick={() => setSelectedReport(r)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                  style={{ left: `${Math.min(Math.max(x, 5), 95)}%`, top: `${Math.min(Math.max(y, 5), 90)}%` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-transform"
                    style={{ background: urgencyColors[r.urgency], border: `2px solid ${statusStyles[r.status]?.color}` }}>
                    <AlertTriangle size={14} className="text-white" />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {r.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <Portal>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <span className={`badge ${statusStyles[selectedReport.status]?.badge}`}>
                  {statusStyles[selectedReport.status]?.label}
                </span>
                <button onClick={() => setSelectedReport(null)} className="btn-ghost p-1 rounded-lg text-sm"
                  style={{ color: 'var(--text-secondary)' }}>✕</button>
              </div>

              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedReport.title}
              </h3>

              {selectedReport.images.length > 0 && (
                <div className="w-full h-48 rounded-xl overflow-hidden">
                  <img src={selectedReport.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedReport.description}
              </p>

              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2"><MapPin size={15} style={{ color: 'var(--color-primary-500)' }} /> {selectedReport.address}</div>
                <div className="flex items-center gap-2"><Clock size={15} style={{ color: 'var(--color-primary-500)' }} /> {timeAgo(selectedReport.createdAt)}</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: urgencyColors[selectedReport.urgency] }} />
                  <span className="capitalize">{selectedReport.urgency} urgency</span>
                </div>
              </div>

              {/* Vote */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { handleVote(e, selectedReport.id); setSelectedReport({ ...selectedReport, votes: selectedReport.votes + 1, votedBy: [...selectedReport.votedBy, 'current-user'] }); }}
                  className="btn btn-secondary text-sm flex-1"
                  disabled={selectedReport.votedBy.includes('current-user')}
                >
                  <ThumbsUp size={16} /> {selectedReport.votes} Confirm
                </button>
                <button className="btn btn-primary text-sm flex-1">
                  <Eye size={16} /> Track
                </button>
              </div>

              {/* Status actions */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {(['reported', 'verified', 'in_progress', 'resolved'] as ReportStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedReport.id, s)}
                      className="btn text-xs capitalize"
                      style={{
                        background: selectedReport.status === s ? `${statusStyles[s].color}20` : 'var(--bg-secondary)',
                        color: selectedReport.status === s ? statusStyles[s].color : 'var(--text-secondary)',
                        border: `1px solid ${selectedReport.status === s ? statusStyles[s].color : 'var(--border-color)'}`,
                      }}
                    >
                      {s === 'resolved' && <CheckCircle size={12} />}
                      {statusStyles[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {user && user.id === selectedReport.userId && (
                <div className="pt-2 border-t mt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <button onClick={() => handleDeleteReport(selectedReport.id)} className="btn text-xs w-full justify-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    <Trash2 size={14} className="mr-1" /> Delete Report
                  </button>
                </div>
              )}

              <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Reported by {selectedReport.userName} · {new Date(selectedReport.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Create Modal */}
      {showCreate && (
        <ReportCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadReports(); }}
        />
      )}
    </div>
  );
}
