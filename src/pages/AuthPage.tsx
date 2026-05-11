import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle,
} from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
      else navigate('/');
    } else {
      if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, name);
      if (err) setError(err);
      else setSuccess('Account created! Check your email to verify, then sign in.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center px-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1929, #0e7490, #06b6d4)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl">
              <Zap size={28} className="text-white" />
            </div>
            <span className="text-white font-bold text-3xl tracking-tight">CivicHub</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Community<br />Support Platform
          </h1>
          <p className="text-cyan-200 text-lg leading-relaxed max-w-md mx-auto">
            Emergency resources, civic reporting, accessibility navigation, community sharing, 
            and AI-powered assistance — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-8 justify-center">
            {['🗺️ Emergency Map', '📝 Civic Reports', '♿ Accessibility', '📦 Sharing', '🤖 AI Assistant'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>CivicHub</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {mode === 'login' ? 'Sign in to access your community dashboard' : 'Join your community today'}
            </p>
          </div>

          {/* Demo mode banner */}
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <div style={{ color: '#f59e0b' }}>
                <p className="font-semibold">Demo Mode</p>
                <p className="mt-0.5 opacity-80">
                  Supabase is not configured. Add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file 
                  to enable real authentication.
                </p>
                <button onClick={() => navigate('/')} className="mt-2 underline font-medium">
                  Continue in Demo Mode →
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <User size={18} style={{ color: 'var(--text-tertiary)' }} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera" className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: 'var(--text-primary)' }} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <Lock size={18} style={{ color: 'var(--text-tertiary)' }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: 'var(--text-primary)' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn-ghost p-0.5">
                  {showPassword ? <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} /> : <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <CheckCircle size={14} /> {success}
              </div>
            )}

            <button type="submit" disabled={loading || !isSupabaseConfigured}
              className="btn btn-primary w-full text-sm py-3 disabled:opacity-50">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  className="font-semibold" style={{ color: 'var(--color-primary-500)' }}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="font-semibold" style={{ color: 'var(--color-primary-500)' }}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
