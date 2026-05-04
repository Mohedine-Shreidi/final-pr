import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Search,
  Accessibility,
  Package,
  MessageCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/emergency-map', icon: Map, label: 'Emergency Map' },
  { to: '/reports', icon: AlertTriangle, label: 'Reports' },
  { to: '/lost-found', icon: Search, label: 'Lost & Found' },
  { to: '/accessibility', icon: Accessibility, label: 'Accessibility' },
  { to: '/sharing', icon: Package, label: 'Sharing' },
  { to: '/assistant', icon: MessageCircle, label: 'AI Assistant' },
];

const adminItems = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`sidebar fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap size={20} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap animate-fade-in">
              CivicHub
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className={`mb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
            {!collapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Main Menu
              </span>
            )}
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          <div className="my-4 border-t border-white/5" />

          <div className={`mb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
            {!collapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Admin
              </span>
            )}
          </div>

          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="hidden md:block p-3 border-t border-white/5">
          <button
            onClick={onToggle}
            className="sidebar-link w-full justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
