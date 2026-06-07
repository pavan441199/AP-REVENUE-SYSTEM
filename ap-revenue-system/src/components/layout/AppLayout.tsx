// ============================================================
// AP Revenue ICAMS - Application Layout
// ============================================================

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* AP Watermark */}
      <div className="ap-watermark" />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300`}
        style={{ marginLeft: sidebarOpen ? '260px' : '0px' }}
      >
        {/* Header */}
        <Header onMobileMenuToggle={() => setMobileMenuOpen(v => !v)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-xs text-gray-400">
          <span>Government of Andhra Pradesh | Revenue Department | ICAMS v1.0</span>
          <span>For Official Use Only | Confidential</span>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
