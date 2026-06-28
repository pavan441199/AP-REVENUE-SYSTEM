// ============================================================
// AP Revenue ICAMS - Header Component
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, Menu, ChevronRight, User2, Settings, LogOut, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { logAudit } from '../../services/authService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/citizens': 'Citizens',
  '/land-records': 'Land Records',
  '/properties': 'House Properties',
  '/vehicles': 'Vehicles',
  '/ration-cards': 'Ration Cards',
  '/search': 'NLP Search',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/audit-logs': 'Audit Logs',
  '/profile': 'My Profile',
};

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { currentUser, notifications, unreadCount, markAllRead, dismissNotification, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Page';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    if (currentUser) {
      await logAudit(currentUser.userId, currentUser.fullName, 'LOGOUT', 'Auth', 'User logged out');
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const notifTypeIcon: Record<string, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm z-10 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0 flex-1">
        <span className="text-gray-400 text-xs">Revenue Dept.</span>
        <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-ap-blue text-xs truncate">{currentPage}</span>
      </div>

      {/* Portal title - mobile */}
      <div className="sm:hidden flex-1">
        <span className="font-bold text-ap-blue text-sm">AP Revenue ICAMS</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Quick search */}
        <button
          onClick={() => navigate('/search')}
          className="hidden sm:flex btn-icon items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-md text-gray-400 hover:text-ap-blue hover:border-ap-blue text-xs"
        >
          <Search size={14} />
          <span className="hidden lg:inline text-xs text-gray-400">Quick Search...</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
            className="btn-icon relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-gov-lg border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-ap-blue text-white">
                <span className="font-semibold text-sm">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-white/70 hover:text-white">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-100 flex gap-3 ${!n.read ? 'bg-blue-50' : ''}`}
                    >
                      <span className="text-base flex-shrink-0">{notifTypeIcon[n.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(n.timestamp), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-ap-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{currentUser?.fullName?.split(' ')[0]}</p>
              <p className="text-xs text-gray-400 leading-tight capitalize">{currentUser?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-gov-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="text-sm font-semibold text-gray-800">{currentUser?.fullName}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
                <p className="text-xs text-ap-blue mt-0.5">{currentUser?.district} · {currentUser?.designation}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/profile'); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User2 size={15} />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t mt-1"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
