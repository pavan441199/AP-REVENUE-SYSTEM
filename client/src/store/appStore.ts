// ============================================================
// AP Revenue ICAMS - Global State Management (Zustand)
// ============================================================

import { create } from 'zustand';
import { AuthSession, User, Notification, DashboardStats, UserRole } from '../types';
import { getSession, clearSession, refreshSession } from '../services/authService';
import { userDB } from '../services/dbService';

interface AppState {
  // Auth
  session: AuthSession | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // UI State
  sidebarOpen: boolean;
  notifications: Notification[];
  unreadCount: number;

  // Dashboard
  dashboardStats: DashboardStats | null;
  statsLoading: boolean;

  // Actions
  setSession: (session: AuthSession, user: User) => void;
  logout: () => void;
  checkSession: () => Promise<boolean>;
  refreshSession: () => void;
  toggleSidebar: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  loadDashboardStats: () => Promise<void>;
  hasPermission: (action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage_users') => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  sidebarOpen: true,
  notifications: [],
  unreadCount: 0,
  dashboardStats: null,
  statsLoading: false,

  setSession: (session, user) => {
    set({ session, currentUser: user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearSession();
    set({ session: null, currentUser: null, isAuthenticated: false, dashboardStats: null });
  },

  checkSession: async () => {
    const session = getSession();
    if (!session) {
      set({ isAuthenticated: false, isLoading: false });
      return false;
    }
    try {
      const user = await userDB.getByUserId(session.userRef);
      if (user) {
        set({ session, currentUser: user, isAuthenticated: true, isLoading: false });
        return true;
      }
    } catch {}
    set({ isAuthenticated: false, isLoading: false });
    return false;
  },

  refreshSession: () => {
    refreshSession();
    const session = getSession();
    if (session) set({ session });
  },

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  addNotification: (notif) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    set(state => ({
      notifications: [newNotif, ...state.notifications].slice(0, 20),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  dismissNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id),
    unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
  })),

  loadDashboardStats: async () => {
    set({ statsLoading: true });
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load dashboard stats');
      const stats = await res.json();
      set({ dashboardStats: stats, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  hasPermission: (action) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    const permissions: Record<UserRole, string[]> = {
      administrator: ['create', 'read', 'update', 'delete', 'export', 'manage_users'],
      revenue_officer: ['create', 'read', 'update', 'export'],
      data_entry_operator: ['create', 'read', 'update'],
      read_only_officer: ['read', 'export'],
    };
    return permissions[currentUser.role]?.includes(action) ?? false;
  },
}));
