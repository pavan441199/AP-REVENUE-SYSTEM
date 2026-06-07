// ============================================================
// AP Revenue ICAMS - Protected Route Component
// ============================================================

import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage_users';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission, refreshSession } = useAppStore();
  const location = useLocation();
  const activityTimer = useRef<ReturnType<typeof setTimeout>>();

  // Session refresh on user activity
  useEffect(() => {
    const handleActivity = () => {
      clearTimeout(activityTimer.current);
      activityTimer.current = setTimeout(() => {
        refreshSession();
      }, 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearTimeout(activityTimer.current);
    };
  }, [refreshSession]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 text-sm mt-2">You do not have permission to access this section.</p>
        <p className="text-gray-400 text-xs mt-1">Contact the system administrator for assistance.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
