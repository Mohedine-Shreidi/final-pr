import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Portal from './Portal';
import { getResources } from '../../services/resourceService';
import { getReports } from '../../services/reportService';
import { getLostFoundPosts } from '../../services/lostFoundService';
import { getSharedItems } from '../../services/sharingService';
import { getAccessibilityPoints } from '../../services/accessibilityService';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'resource' | 'report' | 'lost_found' | 'sharing' | 'accessibility';
  icon: string;
  link: string;
}

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  resource: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', label: 'Resource' },
  report: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: 'Report' },
  lost_found: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', label: 'Lost & Found' },
  sharing: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: 'Sharing' },
  accessibility: { bg: 'rgba(6,182,212,0.1)', text: '#06b6d4', label: 'Accessibility' },
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    
    const loadResults = async () => {
      const q = query.toLowerCase();
      const all: SearchResult[] = [];

      // Resources
      getResources().forEach((r) => {
        if (r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)) {
          all.push({ id: r.id, title: r.name, subtitle: `${r.type} · ${r.status} · ${r.address}`, type: 'resource', icon: '🗺️', link: '/emergency-map' });
        }
      });

      try {
        const [reports, posts, items, points] = await Promise.all([
          getReports(),
          getLostFoundPosts(),
          getSharedItems(),
          getAccessibilityPoints()
        ]);

        // Reports
        reports.forEach((r) => {
          if (r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) {
            all.push({ id: r.id, title: r.title, subtitle: `${r.category} · ${r.status} · ${r.address}`, type: 'report', icon: '📝', link: '/reports' });
          }
        });

        // Lost & Found
        posts.forEach((p) => {
          if (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
            all.push({ id: p.id, title: p.title, subtitle: `${p.type} · ${p.category} · ${p.location}`, type: 'lost_found', icon: '🔍', link: '/lost-found' });
          }
        });

        // Sharing
        items.forEach((i) => {
          if (i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) {
            all.push({ id: i.id, title: i.title, subtitle: `${i.category} · ${i.condition} · ${i.available ? 'Available' : 'Borrowed'}`, type: 'sharing', icon: '📦', link: '/sharing' });
          }
        });

        // Accessibility
        points.forEach((p) => {
          if (p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)) {
            all.push({ id: p.id, title: p.name, subtitle: `${p.type} · ★ ${p.rating.toFixed(1)} · ${p.address}`, type: 'accessibility', icon: '♿', link: '/accessibility' });
          }
        });

        setResults(all.slice(0, 12));
      } catch (err) {
        console.error("Search error", err);
      }
    };

    loadResults();
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.link);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="btn-ghost p-2.5 rounded-xl flex items-center gap-2"
        style={{ color: 'var(--text-secondary)' }} title="Search (Ctrl+K)">
        <Search size={19} />
      </button>
    );
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <Search size={20} style={{ color: 'var(--color-primary-500)' }} />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, reports, items, places..."
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }} />
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-mono"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>ESC</kbd>
          <button onClick={() => setOpen(false)} className="btn-ghost p-1 rounded-lg sm:hidden">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No results found for "{query}"
            </div>
          ) : (
            results.map((r) => {
              const type = typeColors[r.type];
              return (
                <button key={r.id} onClick={() => handleSelect(r)}
                  className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-tertiary)] transition-colors border-b"
                  style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-lg">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{r.subtitle}</p>
                  </div>
                  <span className="badge text-[9px] flex-shrink-0" style={{ background: type.bg, color: type.text }}>
                    {type.label}
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!query.trim() && (
          <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Search across all modules: resources, reports, lost items, shared items, accessibility points
            </p>
          </div>
        )}
      </div>
    </div>
    </Portal>
  );
}
