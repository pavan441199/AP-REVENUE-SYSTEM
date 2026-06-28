// ============================================================
// AP Revenue ICAMS - Dashboard Page
// ============================================================

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Building2, Car, ShoppingCart, TrendingUp, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#003087', '#C8960C', '#006400', '#8B0000', '#4B0082', '#005580', '#663300'];

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  link: string;
  delay: number;
}> = ({ title, value, icon, color, bg, link, delay }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={() => navigate(link)}
      className="gov-card p-5 cursor-pointer hover:shadow-gov-lg transition-all hover:-translate-y-0.5 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:text-ap-blue transition-colors">
            {value.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <TrendingUp size={11} />
        <span>View all records →</span>
      </div>
    </motion.div>
  );
};

const DashboardPage: React.FC = () => {
  const { dashboardStats, statsLoading, loadDashboardStats, currentUser } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const actionColors: Record<string, string> = {
    LOGIN: 'bg-green-100 text-green-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    CREATE: 'bg-blue-100 text-blue-700',
    UPDATE: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
    VIEW: 'bg-purple-100 text-purple-700',
    EXPORT: 'bg-teal-100 text-teal-700',
    SEARCH: 'bg-indigo-100 text-indigo-700',
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (statsLoading || !dashboardStats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-gray-200 rounded-lg" />
          <div className="h-72 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-ap-blue rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-white text-xl font-bold font-display">
            {greeting()}, {currentUser?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-white/70 text-sm mt-0.5">
            {currentUser?.designation} · {currentUser?.district} District
          </p>
          <p className="text-ap-gold-light text-xs mt-1">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/search')}
            className="btn-gold text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            NLP Search
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="btn-secondary text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
            Reports
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Citizens" value={dashboardStats.totalCitizens} icon={<Users size={24} />} color="text-blue-600" bg="bg-blue-50" link="/citizens" delay={0.1} />
        <StatCard title="Land Records" value={dashboardStats.totalLands} icon={<MapPin size={24} />} color="text-green-600" bg="bg-green-50" link="/land-records" delay={0.15} />
        <StatCard title="Properties" value={dashboardStats.totalProperties} icon={<Building2 size={24} />} color="text-yellow-600" bg="bg-yellow-50" link="/properties" delay={0.2} />
        <StatCard title="Vehicles" value={dashboardStats.totalVehicles} icon={<Car size={24} />} color="text-red-600" bg="bg-red-50" link="/vehicles" delay={0.25} />
        <StatCard title="Ration Cards" value={dashboardStats.totalRationCards} icon={<ShoppingCart size={24} />} color="text-purple-600" bg="bg-purple-50" link="/ration-cards" delay={0.3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* District-wise Citizens Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="gov-card p-4 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ap-blue" />
            <h3 className="font-semibold text-gray-800 text-sm">Citizens by District</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboardStats.districtWiseCitizens} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="district" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0e0e0' }}
                formatter={(v: number) => [v, 'Citizens']}
              />
              <Bar dataKey="count" fill="#003087" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Land Type Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="gov-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-ap-gold" />
            <h3 className="font-semibold text-gray-800 text-sm">Land Types</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dashboardStats.landTypeDistribution}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
                labelLine={false}
              >
                {dashboardStats.landTypeDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="gov-card"
        >
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <Activity size={15} />
              <span className="text-sm font-semibold">Recent Activity</span>
            </div>
            <button onClick={() => navigate('/audit-logs')} className="text-white/70 hover:text-white text-xs">View All</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {dashboardStats.recentActivity.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`badge mt-0.5 flex-shrink-0 ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium">{log.userName.split(' ')[0]}</span> · {log.module}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Clock size={10} />
                  {format(new Date(log.timestamp), 'dd/MM HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vehicle Distribution + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* Vehicle Dist */}
          <div className="gov-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-ap-blue" />
              <h3 className="font-semibold text-gray-800 text-sm">Vehicle Distribution</h3>
            </div>
            <div className="flex gap-3">
              {dashboardStats.vehicleTypeDistribution.map((v, i) => (
                <div key={v.type} className="flex-1 rounded-lg p-3 text-center" style={{ background: i === 0 ? '#EFF6FF' : '#FFF7ED' }}>
                  <p className="text-2xl font-bold" style={{ color: i === 0 ? '#003087' : '#C8960C' }}>
                    {v.count.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{v.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="gov-card p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add Citizen', icon: <Users size={14} />, link: '/citizens', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
                { label: 'Add Land', icon: <MapPin size={14} />, link: '/land-records', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
                { label: 'Add Vehicle', icon: <Car size={14} />, link: '/vehicles', color: 'text-red-600 bg-red-50 hover:bg-red-100' },
                { label: 'NLP Search', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, link: '/search', color: 'text-ap-gold bg-yellow-50 hover:bg-yellow-100' },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.link)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${a.color}`}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
