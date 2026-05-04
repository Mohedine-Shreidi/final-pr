import { X, MapPin, Camera, AlertTriangle, Send } from 'lucide-react';
import { useState } from 'react';
import type { ReportCategory, ReportUrgency } from '../../types';
import { createReport } from '../../services/reportService';

const categoryOptions: { value: ReportCategory; label: string; icon: string }[] = [
  { value: 'roads', label: 'Roads & Potholes', icon: '🛣️' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'water_leaks', label: 'Water Leaks', icon: '💧' },
  { value: 'garbage', label: 'Garbage & Waste', icon: '🗑️' },
  { value: 'hazards', label: 'Safety Hazards', icon: '⚠️' },
];

const urgencyOptions: { value: ReportUrgency; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

interface ReportCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function ReportCreateModal({ onClose, onCreated }: ReportCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('roads');
  const [urgency, setUrgency] = useState<ReportUrgency>('medium');
  const [address, setAddress] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !address.trim()) return;

    setSubmitting(true);
    // Simulate slight delay
    setTimeout(() => {
      createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        lat: 31.95 + Math.random() * 0.03,
        lng: 35.9 + Math.random() * 0.04,
        address: address.trim(),
        images,
      });
      setSubmitting(false);
      onCreated();
    }, 500);
  };

  const isValid = title.trim() && description.trim() && address.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}>
              <AlertTriangle size={18} className="text-white" />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Report an Issue
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:ring-2 focus:ring-cyan-500/30"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: category === opt.value ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-secondary)',
                    border: `1px solid ${category === opt.value ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                    color: category === opt.value ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                  }}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Urgency Level *
            </label>
            <div className="flex gap-2">
              {urgencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: urgency === opt.value ? `${opt.color}18` : 'var(--bg-secondary)',
                    border: `1px solid ${urgency === opt.value ? opt.color : 'var(--border-color)'}`,
                    color: urgency === opt.value ? opt.color : 'var(--text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors focus:ring-2 focus:ring-cyan-500/30"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              <MapPin size={14} className="inline mr-1" /> Location *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address or landmark"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:ring-2 focus:ring-cyan-500/30"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Photos (max 3)
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
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
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="btn btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Send size={16} /> Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
