// ============================================================
// AP Revenue ICAMS - Main Application Entry
// ============================================================

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CitizensPage from './pages/CitizensPage';
import CitizenDetailPage from './pages/CitizenDetailPage';
import LandRecordsPage from './pages/LandRecordsPage';
import PropertiesPage from './pages/PropertiesPage';
import VehiclesPage from './pages/VehiclesPage';
import RationCardsPage from './pages/RationCardsPage';
import SearchPage from './pages/SearchPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { checkSession, isLoading } = useAppStore();

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '13px', maxWidth: '400px' },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/citizens" element={<CitizensPage />} />
            <Route path="/citizens/:id" element={<CitizenDetailPage />} />
            <Route path="/land-records" element={<LandRecordsPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/ration-cards" element={<RationCardsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={
              <ProtectedRoute requiredPermission="manage_users">
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="/audit-logs" element={<AuditPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
