import { useState, useEffect } from 'react';
import {
  Plus, Search as SearchIcon, Star, X, Send, Package, Check,
  Clock, Image, Tag, Shield, ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  getSharedItems, createItem, createBorrowRequest,
  getBorrowRequests, updateRequestStatus, getReviews, addReview,
  type BorrowRequest, type Review,
} from '../services/sharingService';
import type { SharedItem, ItemCondition } from '../types';

const categoryTabs = ['All', 'Tools', 'Electronics', 'Kitchen', 'Sports', 'Books', 'Medical', 'Other'];

const conditionColors: Record<string, { bg: string; text: string }> = {
  new: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  excellent: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  good: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  fair: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' },
  poor: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Sharing() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [items, setItems] = useState<SharedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowMessage, setBorrowMessage] = useState('');
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Tools');
  const [newCondition, setNewCondition] = useState<ItemCondition>('good');
  const [newDeposit, setNewDeposit] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = () => {
    const data = getSharedItems({ category: activeCategory, search: search || undefined, availableOnly });
    setItems(data);
  };

  useEffect(() => { loadItems(); }, [activeCategory, search, availableOnly]);

  const handleSelectItem = (item: SharedItem) => {
    setSelectedItem(item);
    setBorrowRequests(getBorrowRequests(item.id));
    setReviews(getReviews(item.id));
    setShowBorrowForm(false);
    setShowReviewForm(false);
  };

  const handleBorrow = () => {
    if (!selectedItem || !borrowMessage.trim()) return;
    createBorrowRequest(selectedItem.id, borrowMessage.trim());
    setBorrowMessage('');
    setShowBorrowForm(false);
    setBorrowRequests(getBorrowRequests(selectedItem.id));
    loadItems();
  };

  const handleReview = () => {
    if (!selectedItem || reviewRating < 1) return;
    addReview(selectedItem.id, reviewRating, reviewComment.trim());
    setReviewRating(0);
    setReviewComment('');
    setShowReviewForm(false);
    setReviews(getReviews(selectedItem.id));
    loadItems();
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      createItem({
        title: newTitle.trim(), description: newDesc.trim(),
        category: newCategory, condition: newCondition,
        deposit: newDeposit, images: [],
      });
      setShowCreate(false);
      setNewTitle(''); setNewDesc('');
      setSubmitting(false);
      loadItems();
    }, 500);
  };

  const availCount = getSharedItems({ availableOnly: true }).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-500)' }}>{items.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Items</div>
        </div>
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{availCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Available Now</div>
        </div>
        <div className="card py-3">
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{categoryTabs.length - 1}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Categories</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border flex-1 min-w-[200px] max-w-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <SearchIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..." className="bg-transparent outline-none text-sm flex-1"
              style={{ color: 'var(--text-primary)' }} />
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="accent-cyan-500" />
            Available only
          </label>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs"><Plus size={14} /> Share Item</button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {categoryTabs.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`btn text-xs ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}>{cat}</button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} onClick={() => handleSelectItem(item)} className="card card-glow cursor-pointer group">
            {item.images.length > 0 ? (
              <div className="w-full h-32 rounded-xl mb-3 overflow-hidden">
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                <Package size={24} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className="badge text-[10px]" style={{ background: conditionColors[item.condition]?.bg, color: conditionColors[item.condition]?.text }}>
                {item.condition}
              </span>
              <span className={`badge text-[10px] ${item.available ? 'badge-success' : 'badge-danger'}`}>
                {item.available ? 'Available' : 'Borrowed'}
              </span>
            </div>

            <h4 className="text-sm font-semibold mb-1 group-hover:text-cyan-500 transition-colors line-clamp-1"
              style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
            <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>

            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <div className="flex items-center gap-2">
                {item.rating > 0 && (
                  <span className="flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
                    <Star size={11} fill="#f59e0b" /> {item.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1"><Tag size={11} /> {item.category}</span>
              </div>
              {item.deposit > 0 && (
                <span className="flex items-center gap-1"><Shield size={11} /> ${item.deposit} deposit</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge text-xs" style={{ background: conditionColors[selectedItem.condition]?.bg, color: conditionColors[selectedItem.condition]?.text }}>
                    {selectedItem.condition}
                  </span>
                  <span className={`badge text-xs ${selectedItem.available ? 'badge-success' : 'badge-danger'}`}>
                    {selectedItem.available ? 'Available' : 'Borrowed'}
                  </span>
                </div>
                <button onClick={() => setSelectedItem(null)} className="btn-ghost p-1 rounded-lg">
                  <X size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedItem.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedItem.description}</p>

              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Tag size={14} className="text-cyan-500" /> {selectedItem.category}</span>
                {selectedItem.rating > 0 && (
                  <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                    <Star size={14} fill="#f59e0b" /> {selectedItem.rating.toFixed(1)}
                  </span>
                )}
                {selectedItem.deposit > 0 && (
                  <span className="flex items-center gap-1"><Shield size={14} className="text-cyan-500" /> ${selectedItem.deposit} deposit</span>
                )}
              </div>

              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Shared by {selectedItem.userName} · {timeAgo(selectedItem.createdAt)}
              </p>

              {/* Borrow Request */}
              {selectedItem.available && !showBorrowForm && (
                <button onClick={() => setShowBorrowForm(true)} className="btn btn-primary w-full text-sm">
                  <Package size={16} /> Request to Borrow
                </button>
              )}

              {showBorrowForm && (
                <div className="p-3 rounded-xl space-y-3" style={{ background: 'var(--bg-tertiary)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Send Borrow Request</p>
                  <textarea value={borrowMessage} onChange={(e) => setBorrowMessage(e.target.value)}
                    placeholder="Why do you need this item? When will you return it?"
                    rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowBorrowForm(false)} className="btn btn-secondary flex-1 text-xs">Cancel</button>
                    <button onClick={handleBorrow} disabled={!borrowMessage.trim()} className="btn btn-primary flex-1 text-xs disabled:opacity-40">
                      <Send size={13} /> Send Request
                    </button>
                  </div>
                </div>
              )}

              {/* Borrow Requests */}
              {borrowRequests.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Borrow Requests</h4>
                  {borrowRequests.map((req) => (
                    <div key={req.id} className="p-2 rounded-lg mb-1 flex items-center justify-between"
                      style={{ background: 'var(--bg-secondary)' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{req.requesterName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{req.message}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {req.status === 'pending' ? (
                          <>
                            <button onClick={() => { updateRequestStatus(req.id, 'approved'); setBorrowRequests(getBorrowRequests(selectedItem.id)); loadItems(); }}
                              className="btn text-[10px] py-1 px-2" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              <Check size={10} /> Approve
                            </button>
                            <button onClick={() => { updateRequestStatus(req.id, 'denied'); setBorrowRequests(getBorrowRequests(selectedItem.id)); }}
                              className="btn text-[10px] py-1 px-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              <X size={10} /> Deny
                            </button>
                          </>
                        ) : req.status === 'approved' ? (
                          <button onClick={() => { updateRequestStatus(req.id, 'returned'); setBorrowRequests(getBorrowRequests(selectedItem.id)); loadItems(); }}
                            className="btn text-[10px] py-1 px-2" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            <RefreshCw size={10} /> Mark Returned
                          </button>
                        ) : (
                          <span className={`badge text-[9px] ${req.status === 'returned' ? 'badge-success' : 'badge-danger'}`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Reviews</h4>
                  {reviews.map((r) => (
                    <div key={r.id} className="p-2 rounded-lg mb-1" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{r.userName}</span>
                        <span className="text-[10px]" style={{ color: '#f59e0b' }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                      {r.comment && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Review */}
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} className="btn btn-secondary w-full text-xs">
                  <Star size={14} /> Leave a Review
                </button>
              ) : (
                <div className="p-3 rounded-xl space-y-3" style={{ background: 'var(--bg-tertiary)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Rate this item</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star size={22} fill={s <= reviewRating ? '#f59e0b' : 'none'}
                          style={{ color: s <= reviewRating ? '#f59e0b' : 'var(--text-tertiary)' }} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..." rows={2}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  <button onClick={handleReview} disabled={reviewRating < 1}
                    className="btn btn-primary w-full text-xs disabled:opacity-40">Submit Review</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  <Package size={18} className="text-white" />
                </div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Share an Item</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Item name"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Describe the item..." rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {categoryTabs.filter((c) => c !== 'All').map((cat) => (
                    <button key={cat} onClick={() => setNewCategory(cat)}
                      className={`btn text-xs ${newCategory === cat ? 'btn-primary' : 'btn-secondary'}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Condition</label>
                <div className="flex gap-2">
                  {(['new', 'excellent', 'good', 'fair', 'poor'] as ItemCondition[]).map((c) => (
                    <button key={c} onClick={() => setNewCondition(c)}
                      className="btn flex-1 text-xs capitalize"
                      style={{ background: newCondition === c ? conditionColors[c].bg : 'var(--bg-secondary)',
                        color: newCondition === c ? conditionColors[c].text : 'var(--text-secondary)',
                        border: `1px solid ${newCondition === c ? conditionColors[c].text : 'var(--border-color)'}` }}>{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Deposit ($)</label>
                <input type="number" value={newDeposit} onChange={(e) => setNewDeposit(Number(e.target.value))} min={0}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>

              <button onClick={handleCreate} disabled={!newTitle.trim() || !newDesc.trim() || submitting}
                className="btn btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</>
                  : <><Send size={16} /> Share Item</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
