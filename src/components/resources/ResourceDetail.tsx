import { X, MapPin, Phone, Clock, AlertCircle, Send, CheckCircle, Users } from 'lucide-react';
import { useState } from 'react';
import type { Resource, ResourceStatus } from '../../types';
import { addCrowdUpdate } from '../../services/resourceService';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'Open' },
  closed: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'Closed' },
  limited: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'Limited' },
};

const typeLabels: Record<string, string> = {
  hospital: '🏥 Hospital',
  pharmacy: '💊 Pharmacy',
  shelter: '🏠 Shelter',
  water: '💧 Water Station',
  fuel: '⛽ Fuel Station',
};

interface ResourceDetailProps {
  resource: Resource;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ResourceDetail({ resource, onClose, onUpdate }: ResourceDetailProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<ResourceStatus>(resource.status);
  const [updateNote, setUpdateNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitUpdate = () => {
    if (!updateNote.trim()) return;
    addCrowdUpdate(resource.id, {
      status: updateStatus,
      note: updateNote.trim(),
      userName: 'You',
    });
    setSubmitted(true);
    setShowUpdateForm(false);
    setUpdateNote('');
    onUpdate();
    setTimeout(() => setSubmitted(false), 2000);
  };

  const st = statusColors[resource.status];
  const timeSince = new Date(resource.lastVerified).toLocaleDateString();

  return (
    <div className="animate-slide-right space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {typeLabels[resource.type]}
          </span>
          <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {resource.name}
          </h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
          <X size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span
          className="badge text-sm font-semibold px-3 py-1"
          style={{ background: st.bg, color: st.text }}
        >
          ● {st.label}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Last verified: {timeSince}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <MapPin size={16} style={{ color: 'var(--color-primary-500)' }} />
          {resource.address}
        </div>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Phone size={16} style={{ color: 'var(--color-primary-500)' }} />
          {resource.phone}
        </div>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={16} style={{ color: 'var(--color-primary-500)' }} />
          {resource.hours}
        </div>
      </div>

      {/* Crowd updates */}
      {resource.crowdUpdates.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: 'var(--text-tertiary)' }}>
            <Users size={13} /> Community Updates
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {resource.crowdUpdates.slice(0, 5).map((u) => (
              <div key={u.id} className="p-2 rounded-lg text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.userName}</span>
                  <span style={{ color: statusColors[u.status]?.text }}>● {u.status}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{u.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit update */}
      {submitted && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <CheckCircle size={16} /> Update submitted! Needs 3 confirmations to change status.
        </div>
      )}

      {!showUpdateForm ? (
        <button
          onClick={() => setShowUpdateForm(true)}
          className="btn btn-secondary w-full text-sm"
        >
          <AlertCircle size={16} /> Submit Status Update
        </button>
      ) : (
        <div className="space-y-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Update Status
          </h4>
          <div className="flex gap-2">
            {(['open', 'limited', 'closed'] as ResourceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setUpdateStatus(s)}
                className="btn text-xs flex-1 capitalize"
                style={{
                  background: updateStatus === s ? statusColors[s].bg : 'var(--bg-card)',
                  color: updateStatus === s ? statusColors[s].text : 'var(--text-secondary)',
                  border: `1px solid ${updateStatus === s ? statusColors[s].text : 'var(--border-color)'}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
            placeholder="Describe what you observed..."
            rows={2}
            className="w-full p-3 rounded-lg text-sm outline-none resize-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowUpdateForm(false)} className="btn btn-secondary flex-1 text-xs">
              Cancel
            </button>
            <button onClick={handleSubmitUpdate} className="btn btn-primary flex-1 text-xs" disabled={!updateNote.trim()}>
              <Send size={14} /> Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
