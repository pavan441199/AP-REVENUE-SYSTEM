// ============================================================
// AP Revenue ICAMS - Loading Screen Component
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-ap-blue flex flex-col items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-ap-gold" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-ap-gold" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 z-10"
      >
        {/* Logo / Emblem */}
        <div className="w-24 h-24 rounded-full border-4 border-ap-gold flex items-center justify-center bg-white/10">
          <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="#C8960C" strokeWidth="2.5" />
            <circle cx="40" cy="40" r="28" stroke="#C8960C" strokeWidth="1.5" />
            <circle cx="40" cy="25" r="8" stroke="#C8960C" strokeWidth="2" />
            <path d="M26 38 Q40 55 54 38" stroke="#C8960C" strokeWidth="2" fill="none" />
            <path d="M30 60 L40 45 L50 60" stroke="#C8960C" strokeWidth="1.5" fill="none" />
            <text x="40" y="76" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#C8960C" fontFamily="serif">AP GOVT</text>
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white font-display tracking-wide"
          >
            Government of Andhra Pradesh
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-ap-gold-light text-sm mt-1 font-medium"
          >
            Revenue Department
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-white/70 text-xs mt-1"
          >
            Integrated Citizen Asset Management System
          </motion.p>
        </div>

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-ap-gold"
                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <p className="text-white/60 text-xs tracking-widest uppercase">Initializing System...</p>
        </motion.div>

        {/* Version */}
        <div className="text-white/30 text-xs absolute bottom-8">
          ICAMS v1.0 | For Official Use Only
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
