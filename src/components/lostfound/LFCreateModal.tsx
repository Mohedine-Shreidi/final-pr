import { X, MapPin, Camera, Send, Search, Package } from 'lucide-react';
import { useState } from 'react';
import type { LFType, LFCategory } from '../../types';
import { createLostFoundPost } from '../../services/lostFoundService';
import { addNotification } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import Portal from '../layout/Portal';

const categoryOptions: { value: LFCategory; label: string; icon: string }[] = [
  { value: 'ids', label: 'IDs & Cards', icon: '🪪' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'pets', label: 'Pets', icon: '🐾' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'bags', label: 'Bags', icon: '🎒' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'other', label: 'Other', icon: '📦' },
];

interface LFCreateModalProps {
  initialType?: LFType;
  onClose: () => void;
  onCreated: () => void;
}

export default function LFCreateModal({ initialType = 'lost', onClose, onCreated }: LFCreateModalProps) {
  const { user, profile } = useAuth();
  const [type, setType] = useState<LFType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LFCategory>('ids');
  const [location, setLocation] = useState('');
  const [dateLostFound, setDateLostFound] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 3 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim() || !user) return;

    setSubmitting(true);
    const post = await createLostFoundPost({
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      images,
      dateLostFound: new Date(dateLostFound).toISOString(),
      lat: 31.95 + Math.random() * 0.03,
      lng: 35.9 + Math.random() * 0.04,
    }, user.id, profile?.name || 'User');

    if (post) {
      addNotification({
        type: 'match',
        title: type === 'lost' ? 'Looking for matches...' : 'Checking for owners...',
        message: `Your ${type} item "${post.title}" has been posted. We're scanning for potential matches.`,
        link: '/lost-found',
      });
    }

    setSubmitting(false);
    onCreated();
  };

  const isValid = title.trim() && description.trim() && location.trim();

  return (
    <Portal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: type === 'lost' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #10b981, #34d399)' }}>
              {type === 'lost' ? <Search size={18} className="text-white" /> : <Package size={18} className="text-white" />}
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Post {type === 'lost' ? 'Lost' : 'Found'} Item
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            {(['lost', 'found'] as LFType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold transition-colors capitalize"
                style={{
                  background: type === t
                    ? (t === 'lost' ? '#ef4444' : '#10b981')
                    : 'var(--bg-secondary)',
                  color: type === t ? 'white' : 'var(--text-secondary)',
                }}
              >
                {t === 'lost' ? '😢 I Lost' : '😊 I Found'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              What did you {type}? *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'lost' ? 'e.g., Black leather wallet' : 'e.g., Set of keys found at park'}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Category *</label>
            <div className="grid grid-cols-4 gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-medium transition-all"
                  style={{
                    background: category === opt.value ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-secondary)',
                    border: `1px solid ${category === opt.value ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                    color: category === opt.value ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include color, size, brand, distinguishing marks, contents..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-cyan-500/30"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              More detail = better AI matching results
            </p>
          </div>

          {/* Location + Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <MapPin size={13} className="inline mr-1" /> Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where did you lose/find it?"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                📅 Date
              </label>
              <input
                type="date"
                value={dateLostFound}
                onChange={(e) => setDateLostFound(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Photos (max 3)</label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors"
                  style={{ borderColor: 'var(--border-color)' }}>
                  <Camera size={18} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Add</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={!isValid || submitting}
            className="btn w-full py-3 text-sm font-semibold disabled:opacity-50"
            style={{
              background: type === 'lost'
                ? 'linear-gradient(135deg, #ef4444, #f97316)'
                : 'linear-gradient(135deg, #10b981, #34d399)',
              color: 'white',
            }}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              <><Send size={16} /> Post {type === 'lost' ? 'Lost' : 'Found'} Item</>
            )}
          </button>
        </form>
      </div>
    </div>
    </Portal>
  );
}
