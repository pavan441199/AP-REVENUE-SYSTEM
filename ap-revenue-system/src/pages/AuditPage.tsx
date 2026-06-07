import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { AuditLog } from '../types';
import { auditDB } from '../services/dbService';
import { format } from 'date-fns';

const MODULES = ['Citizens', 'LandRecords', 'Properties', 'Vehicles', 'RationCards', 'Users', 'Auth'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW'];
const PAGE_SIZE = 20;

const actionBadge = (action: string) => {
  const map: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    EXPORT: 'bg-orange-100 text-orange-700',
    VIEW: 'bg-teal-100 text-teal-600',
  };
  return map[action] || 'bg-gray-100 text-gray-600';
};

const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLogs(await auditDB.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.userName.toLowerCase().includes(q) && !l.details.toLowerCase().includes(q) && !(l.userId || '').toLowerCase().includes(q)) return false;
    if (moduleFilter && l.module !== moduleFilter) return false;
    if (actionFilter && l.action !== actionFilter) return false;
    if (dateFrom && new Date(l.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(l.timestamp) > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  });

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleExportCSV = () => {
    const header = ['Timestamp', 'User', 'Action', 'Module', 'Details', 'IP'];
    const rows = filtered.map(l => [
      l.timestamp, l.userName, l.action, l.module, l.details, l.ipAddress || ''
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch(''); setModuleFilter(''); setActionFilter(''); setDateFrom(''); setDateTo('');
  };

  const hasFilters = search || moduleFilter || actionFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Trail</h1>
          <p className="text-sm text-gray-500">{logs.length} total log entries</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="gov-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="gov-input pl-9 py-2" placeholder="Search by user or details..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="gov-input py-2" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            {MODULES.map(m => <option key={m}>{m}</option>)}
          </select>
          <select className="gov-input py-2" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">From:</label>
            <input type="date" className="gov-input py-2 flex-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">To:</label>
            <input type="date" className="gov-input py-2 flex-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {hasFilters && (
            <div className="flex items-center">
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <Filter size={14} /> Clear filters
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400">{filtered.length} records match current filters</div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <Shield size={40} className="mx-auto mb-2 text-gray-200" />No audit logs found
                </td></tr>
              ) : pageData.map((l, i) => (
                <tr key={l.id || i}>
                  <td className="text-xs text-gray-500 whitespace-nowrap font-mono">
                    {format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-ap-blue/10 flex items-center justify-center text-ap-blue text-xs font-bold flex-shrink-0">
                        {l.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{l.userName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionBadge(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="text-sm text-gray-600">{l.module}</td>
                  <td className="text-sm text-gray-700 max-w-xs truncate" title={l.details}>{l.details}</td>
                  <td className="text-xs text-gray-400 font-mono">{l.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="px-3">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
