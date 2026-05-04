import { useState, useEffect } from 'react';
import {
  Plus, Search as SearchIcon, MapPin, Clock, Eye, Image,
  Sparkles, ArrowRight, X, ChevronRight,
} from 'lucide-react';
import { getLostFoundPosts, findMatches, updateLostFoundStatus, incrementViews } from '../services/lostFoundService';
import LFCreateModal from '../components/lostfound/LFCreateModal';
import type { LostFoundPost, LFType, LFCategory, LFStatus } from '../types';
import type { MatchResult } from '../services/lostFoundService';

const tabs: { value: LFType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lost', label: '😢 Lost' },
  { value: 'found', label: '😊 Found' },
];

const categories: { value: LFCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ids', label: '🪪 IDs' },
  { value: 'keys', label: '🔑 Keys' },
  { value: 'pets', label: '🐾 Pets' },
  { value: 'electronics', label: '📱 Electronics' },
  { value: 'documents', label: '📄 Documents' },
  { value: 'bags', label: '🎒 Bags' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'other', label: '📦 Other' },
];

const statusStyles: Record<string, { badge: string; label: string }> = {
  active: { badge: 'badge-info', label: 'Active' },
  matched: { badge: 'badge-warning', label: 'Matched' },
  claimed: { badge: 'badge-success', label: 'Claimed' },
  closed: { badge: 'badge-danger', label: 'Closed' },
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

export default function LostFound() {
  const [activeTab, setActiveTab] = useState<LFType | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<LFCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<LostFoundPost | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const loadPosts = () => {
    const data = getLostFoundPosts({
      type: activeTab,
      category: activeCategory,
      search: search || undefined,
    });
    setPosts(data);
  };

  useEffect(() => { loadPosts(); }, [activeTab, activeCategory, search]);

  const handleSelectPost = (post: LostFoundPost) => {
    incrementViews(post.id);
    setSelectedPost(post);
    const m = findMatches(post.id);
    setMatches(m);
  };

  const handleStatusChange = (id: string, status: LFStatus) => {
    updateLostFoundStatus(id, status);
    loadPosts();
    setSelectedPost(null);
  };

  // Counts
  const allPosts = getLostFoundPosts();
  const lostCount = allPosts.filter((p) => p.type === 'lost' && p.status === 'active').length;
  const foundCount = allPosts.filter((p) => p.type === 'found' && p.status === 'active').length;
  const matchedCount = allPosts.filter((p) => p.status === 'matched').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{lostCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active Lost</div>
        </div>
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{foundCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active Found</div>
        </div>
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{matchedCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Matched</div>
        </div>
      </div>

      {/* Tabs + Create */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="px-5 py-2 text-sm font-medium transition-colors"
              style={{
                background: activeTab === tab.value ? 'var(--color-primary-500)' : 'var(--bg-card)',
                color: activeTab === tab.value ? 'white' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">
          <Plus size={14} /> Post Item
        </button>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border flex-1 min-w-[200px] max-w-md"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <SearchIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lost & found items..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
              className={`btn text-xs ${activeCategory === cat.value ? 'btn-primary' : 'btn-secondary'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {posts.length} item{posts.length !== 1 ? 's' : ''}
      </p>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div key={post.id} onClick={() => handleSelectPost(post)}
            className="card card-glow cursor-pointer group">
            {post.images.length > 0 ? (
              <div className="w-full h-32 rounded-xl mb-3 overflow-hidden">
                <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                <Image size={24} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className="badge text-[10px] font-bold"
                style={{
                  background: post.type === 'lost' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: post.type === 'lost' ? '#ef4444' : '#10b981',
                }}>
                {post.type.toUpperCase()}
              </span>
              <span className={`badge ${statusStyles[post.status]?.badge} text-[10px]`}>
                {statusStyles[post.status]?.label}
              </span>
            </div>

            <h4 className="text-sm font-semibold mb-1 group-hover:text-cyan-500 transition-colors line-clamp-1"
              style={{ color: 'var(--text-primary)' }}>
              {post.title}
            </h4>
            <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {post.description}
            </p>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center gap-1"><MapPin size={12} /> {post.location}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(post.createdAt)}</span>
              <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail + Match Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge text-xs font-bold px-3 py-1"
                    style={{
                      background: selectedPost.type === 'lost' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: selectedPost.type === 'lost' ? '#ef4444' : '#10b981',
                    }}>
                    {selectedPost.type.toUpperCase()}
                  </span>
                  <span className={`badge ${statusStyles[selectedPost.status]?.badge} text-xs`}>
                    {statusStyles[selectedPost.status]?.label}
                  </span>
                </div>
                <button onClick={() => setSelectedPost(null)} className="btn-ghost p-1 rounded-lg">
                  <X size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedPost.title}
              </h3>

              {selectedPost.images.length > 0 && (
                <div className="w-full h-48 rounded-xl overflow-hidden">
                  <img src={selectedPost.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {selectedPost.description}
              </p>

              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2"><MapPin size={15} className="text-cyan-500" /> {selectedPost.location}</div>
                <div className="flex items-center gap-2"><Clock size={15} className="text-cyan-500" /> {new Date(selectedPost.dateLostFound).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><Eye size={15} className="text-cyan-500" /> {selectedPost.views} views</div>
              </div>

              {/* AI Matches */}
              {matches.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary-500)' }}>
                    <Sparkles size={16} /> AI-Suggested Matches ({matches.length})
                  </h4>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div key={match.post.id}
                        className="p-3 rounded-xl cursor-pointer hover:shadow-md transition-all"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                        onClick={() => handleSelectPost(match.post)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="badge text-[9px] font-bold"
                                style={{
                                  background: match.post.type === 'found' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: match.post.type === 'found' ? '#10b981' : '#ef4444',
                                }}>
                                {match.post.type.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--color-primary-500)' }}>
                                {match.score.toFixed(0)}% match
                              </span>
                            </div>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {match.post.title}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {match.reasons.join(' · ')}
                            </p>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matches.length === 0 && selectedPost.status === 'active' && (
                <div className="p-3 rounded-xl text-center text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                  <Sparkles size={16} className="mx-auto mb-1 opacity-50" />
                  No matches found yet. We'll notify you when a potential match appears.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedPost.status === 'active' && (
                  <button onClick={() => handleStatusChange(selectedPost.id, 'matched')}
                    className="btn btn-secondary flex-1 text-xs">Mark as Matched</button>
                )}
                {(selectedPost.status === 'active' || selectedPost.status === 'matched') && (
                  <button onClick={() => handleStatusChange(selectedPost.id, 'claimed')}
                    className="btn btn-primary flex-1 text-xs">Mark as Claimed</button>
                )}
              </div>

              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Posted by {selectedPost.userName} · {timeAgo(selectedPost.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <LFCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadPosts(); }}
        />
      )}
    </div>
  );
}
