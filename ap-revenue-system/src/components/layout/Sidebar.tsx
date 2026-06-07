// ============================================================
// AP Revenue ICAMS - Sidebar Component
// ============================================================

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, MapPin, Building2, Car, ShoppingCart,
  Search, FileBarChart2, UserCog, ClipboardList, ChevronRight,
  LogOut, User2, X, Menu
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { logAudit } from '../../services/authService';
import toast from 'react-hot-toast';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { path: '/citizens', label: 'Citizens', icon: <Users size={16} /> },
  { path: '/land-records', label: 'Land Records', icon: <MapPin size={16} /> },
  { path: '/properties', label: 'Properties', icon: <Building2 size={16} /> },
  { path: '/vehicles', label: 'Vehicles', icon: <Car size={16} /> },
  { path: '/ration-cards', label: 'Ration Cards', icon: <ShoppingCart size={16} /> },
];

const UTILITY_ITEMS: NavItem[] = [
  { path: '/search', label: 'NLP Search', icon: <Search size={16} />, badge: 'AI' },
  { path: '/reports', label: 'Reports', icon: <FileBarChart2 size={16} /> },
  { path: '/users', label: 'User Management', icon: <UserCog size={16} />, requiredPermission: 'manage_users' },
  { path: '/audit-logs', label: 'Audit Logs', icon: <ClipboardList size={16} /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { currentUser, sidebarOpen, toggleSidebar, logout, hasPermission } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (currentUser) {
      await logAudit(currentUser.userId, currentUser.fullName, 'LOGOUT', 'Auth', 'User logged out');
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const roleColors: Record<string, string> = {
    administrator: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    revenue_officer: 'bg-green-400/20 text-green-300 border-green-400/30',
    data_entry_operator: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    read_only_officer: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  };

  const roleLabels: Record<string, string> = {
    administrator: 'Administrator',
    revenue_officer: 'Revenue Officer',
    data_entry_operator: 'Data Entry Op.',
    read_only_officer: 'Read Only Officer',
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="flex-shrink-0 bg-ap-blue-dark px-4 py-4">
        <div className="flex items-center gap-3">
          {/* AP Emblem SVG */}
          <div className="w-10 h-10 rounded-full border-2 border-ap-gold flex-shrink-0 bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#C8960C" strokeWidth="1.5" />
              <circle cx="20" cy="12" r="5" stroke="#C8960C" strokeWidth="1.5" />
              <path d="M11 21 Q20 30 29 21" stroke="#C8960C" strokeWidth="1.5" fill="none" />
              <path d="M14 32 L20 24 L26 32" stroke="#C8960C" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold leading-tight">Govt. of Andhra Pradesh</p>
            <p className="text-ap-gold-light text-xs leading-tight truncate">Revenue Dept. · ICAMS</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden md:flex text-white/60 hover:text-white p-1 rounded"
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
          <button onClick={onMobileClose} className="md:hidden text-white/60 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-0.5 bg-ap-gold flex-shrink-0" />

      {/* User info */}
      {currentUser && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-ap-gold/30 border border-ap-gold/50 flex items-center justify-center flex-shrink-0">
              <span className="text-ap-gold font-bold text-sm">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{currentUser.fullName}</p>
              <p className="text-white/50 text-xs truncate">{currentUser.designation}</p>
            </div>
          </div>
          <div className={`mt-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${roleColors[currentUser.role] || roleColors.read_only_officer}`}>
            {roleLabels[currentUser.role]}
          </div>
        </div>
      )}

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Main Navigation */}
        <p className="px-2 py-1 text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Main</p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-ap-gold text-white font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="my-3 border-t border-white/10" />

        {/* Utility Navigation */}
        <p className="px-2 py-1 text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Tools</p>
        {UTILITY_ITEMS.map(item => {
          if (item.requiredPermission === 'manage_users' && !hasPermission('manage_users')) {
            return null;
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-ap-gold text-white font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex-shrink-0 border-t border-white/10 p-3 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <User2 size={16} />
          <span className="text-sm">My Profile</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full sidebar-nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="hidden md:flex fixed left-0 top-0 bottom-0 z-20 w-[260px] flex-col bg-ap-blue shadow-gov-lg"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed left-0 top-0 bottom-0 z-40 w-[260px] flex flex-col bg-ap-blue shadow-gov-lg"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
