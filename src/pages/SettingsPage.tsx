import { useState } from 'react';
import {
  Settings as SettingsIcon, Bell, Moon, Sun, Globe, Shield, Lock,
  Smartphone, Mail, Eye, Save, ToggleLeft, ToggleRight,
  Palette, MapPin, Volume2, VolumeX, FileText, Package, Monitor,
} from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: typeof Bell;
  color: string;
}

function SettingToggle({ label, description, enabled, onToggle, icon: Icon, color }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
        </div>
      </div>
      <button onClick={onToggle} className="transition-colors">
        {enabled
          ? <ToggleRight size={28} style={{ color: '#10b981' }} />
          : <ToggleLeft size={28} style={{ color: 'var(--text-tertiary)' }} />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [notifications, setNotifications] = useState({
    reports: true,
    lostFound: true,
    sharing: true,
    accessibility: false,
    email: false,
    sound: true,
  });
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showLocation: false,
    showActivity: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0e7490, #06b6d4)' }}>
            <SettingsIcon size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Manage your preferences</p>
          </div>
        </div>
        <button onClick={handleSave} className="btn btn-primary text-xs">
          {saved ? <><span className="w-4 h-4 text-green-300">✓</span> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Palette size={16} style={{ color: '#8b5cf6' }} /> Appearance
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on eyes' },
            { value: 'light' as const, label: 'Light', icon: Sun, desc: 'Classic look' },
            { value: 'system' as const, label: 'System', icon: Monitor, desc: 'Auto detect' },
          ].map((opt) => (
            <button key={opt.value} onClick={() => setTheme(opt.value)}
              className="p-3 rounded-xl text-center transition-all"
              style={{
                background: theme === opt.value ? 'rgba(6,182,212,0.1)' : 'var(--bg-secondary)',
                border: `2px solid ${theme === opt.value ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
              }}>
              <opt.icon size={20} className="mx-auto mb-1" style={{ color: theme === opt.value ? 'var(--color-primary-500)' : 'var(--text-secondary)' }} />
              <p className="text-xs font-semibold" style={{ color: theme === opt.value ? 'var(--color-primary-500)' : 'var(--text-primary)' }}>{opt.label}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Bell size={16} style={{ color: '#f59e0b' }} /> Notifications
        </h3>
        <SettingToggle label="Report Updates" description="Get notified when your reports change status"
          enabled={notifications.reports} onToggle={() => toggleNotif('reports')} icon={FileText} color="#3b82f6" />
        <SettingToggle label="Lost & Found Matches" description="Alert when potential matches are found"
          enabled={notifications.lostFound} onToggle={() => toggleNotif('lostFound')} icon={Eye} color="#8b5cf6" />
        <SettingToggle label="Sharing Requests" description="Borrow requests and return reminders"
          enabled={notifications.sharing} onToggle={() => toggleNotif('sharing')} icon={Package} color="#f97316" />
        <SettingToggle label="Accessibility Updates" description="New points and obstacle reports nearby"
          enabled={notifications.accessibility} onToggle={() => toggleNotif('accessibility')} icon={MapPin} color="#06b6d4" />
        <SettingToggle label="Email Notifications" description="Receive updates via email"
          enabled={notifications.email} onToggle={() => toggleNotif('email')} icon={Mail} color="#10b981" />
        <SettingToggle label="Sound Effects" description="Play sounds for new notifications"
          enabled={notifications.sound} onToggle={() => toggleNotif('sound')} icon={notifications.sound ? Volume2 : VolumeX} color="#ef4444" />
      </div>

      {/* Privacy */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield size={16} style={{ color: '#10b981' }} /> Privacy
        </h3>
        <SettingToggle label="Public Profile" description="Allow other users to see your profile"
          enabled={privacy.showProfile} onToggle={() => togglePrivacy('showProfile')} icon={Eye} color="#3b82f6" />
        <SettingToggle label="Share Location" description="Show your general area on maps"
          enabled={privacy.showLocation} onToggle={() => togglePrivacy('showLocation')} icon={MapPin} color="#ef4444" />
        <SettingToggle label="Activity Visibility" description="Let others see your recent activity"
          enabled={privacy.showActivity} onToggle={() => togglePrivacy('showActivity')} icon={Globe} color="#8b5cf6" />
      </div>

      {/* Account */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Lock size={16} style={{ color: '#ef4444' }} /> Account
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Change Password</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>→</span>
          </button>
          <button className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</span>
            </div>
            <span className="badge text-[9px] badge-warning">Not Enabled</span>
          </button>
          <button className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Language</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>English (US)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
