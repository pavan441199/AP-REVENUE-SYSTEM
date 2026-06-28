import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Download, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Vehicle } from '../types';
import { vehicleDB, auditDB } from '../services/dbService';
import { useAppStore } from '../store/appStore';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { exportVehiclesToExcel } from '../services/reportService';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'LPG', 'Hybrid'] as const;
const VEHICLE_TYPES = ['Two Wheeler', 'Four Wheeler'] as const;

const schema = z.object({
  aadhaarNumber: z.string().length(12, '12 digits').regex(/^\d+$/),
  vehicleType: z.enum(VEHICLE_TYPES),
  registrationNumber: z.string().min(1, 'Required').toUpperCase(),
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  variant: z.string().optional(),
  year: z.coerce.number().int().min(1990).max(2030),
  color: z.string().min(1, 'Required'),
  engineNumber: z.string().min(1, 'Required'),
  chassisNumber: z.string().min(1, 'Required'),
  fuelType: z.enum(FUEL_TYPES),
  seatingCapacity: z.coerce.number().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  marketValue: z.coerce.number().optional(),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
const PAGE_SIZE = 12;

const VehiclesPage: React.FC = () => {
  const { currentUser, hasPermission } = useAppStore();
  const [records, setRecords] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'Two Wheeler' | 'Four Wheeler'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canWrite = hasPermission('create');
  const canDelete = hasPermission('delete');
  const canExport = hasPermission('export');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: 'Four Wheeler', fuelType: 'Petrol' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setRecords(await vehicleDB.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => {
    if (tab !== 'all' && r.vehicleType !== tab) return false;
    const q = search.toLowerCase();
    return !q || r.registrationNumber.toLowerCase().includes(q) || r.make.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) || r.aadhaarNumber.includes(q);
  });

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const openEdit = (r: Vehicle) => { setEditing(r); reset(r as any); setModalOpen(true); };
  const openAdd = () => { setEditing(null); reset({ vehicleType: 'Four Wheeler', fuelType: 'Petrol' }); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const userId = currentUser?.id || 'system';
    if (editing) {
      await vehicleDB.update({ ...editing, ...data, updatedBy: userId, updatedAt: now });
      toast.success('Vehicle updated');
    } else {
      await vehicleDB.create({ id: uuidv4(), citizenId: '', ...data, createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now });
      toast.success('Vehicle added');
    }
    await auditDB.add({ id: uuidv4(), userId, userName: currentUser?.fullName || 'System', action: editing ? 'UPDATE' : 'CREATE', module: 'Vehicles', details: `${editing ? 'Updated' : 'Created'} vehicle ${data.registrationNumber}`, timestamp: now });
    setSaving(false); setModalOpen(false); load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await vehicleDB.delete(deleteTarget.id);
    toast.success('Vehicle deleted');
    setDeleting(false); setDeleteTarget(null); load();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalValue = filtered.reduce((s, r) => s + (r.marketValue || 0), 0);
  const twoWheelers = records.filter(r => r.vehicleType === 'Two Wheeler').length;
  const fourWheelers = records.filter(r => r.vehicleType === 'Four Wheeler').length;

  const handleExport = async () => {
    try { await exportVehiclesToExcel(); toast.success('Exported'); }
    catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-sm text-gray-500">{records.length} total vehicles</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Register Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: records.length },
          { label: 'Two Wheelers', value: twoWheelers },
          { label: 'Four Wheelers', value: fourWheelers },
          { label: 'Estimated Value', value: formatCurrency(totalValue) },
        ].map(s => (
          <div key={s.label} className="gov-card text-center">
            <div className="text-2xl font-bold text-ap-blue">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="gov-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['all', 'Two Wheeler', 'Four Wheeler'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-ap-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="gov-input pl-9 py-2" placeholder="Search reg. no., make, model, Aadhaar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Reg. Number</th>
                <th>Make / Model</th>
                <th>Type</th>
                <th>Year</th>
                <th>Color</th>
                <th>Fuel</th>
                <th>Market Value</th>
                <th>Insurance Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <Car size={40} className="mx-auto mb-2 text-gray-200" />No vehicles found
                </td></tr>
              ) : pageData.map(r => {
                const insExpired = r.insuranceExpiry && new Date(r.insuranceExpiry) < new Date();
                return (
                  <tr key={r.id}>
                    <td className="font-medium text-ap-blue font-mono">{r.registrationNumber}</td>
                    <td>{r.make} {r.model}{r.variant ? ` (${r.variant})` : ''}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.vehicleType === 'Four Wheeler' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                      }`}>{r.vehicleType}</span>
                    </td>
                    <td>{r.year}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: r.color.toLowerCase() }} />
                        {r.color}
                      </div>
                    </td>
                    <td>{r.fuelType}</td>
                    <td>{r.marketValue ? formatCurrency(r.marketValue) : '—'}</td>
                    <td>
                      {r.insuranceExpiry ? (
                        <span className={`text-xs font-medium ${insExpired ? 'text-red-600' : 'text-green-600'}`}>
                          {insExpired ? '⚠ Expired' : r.insuranceExpiry}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {canWrite && <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit size={14} /></button>}
                        {canDelete && <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Register Vehicle'} size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Register'}</button>
          </div>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}>
          <div>
            <label className="label-text">Aadhaar Number *</label>
            <input {...register('aadhaarNumber')} className="gov-input" maxLength={12} />
            {errors.aadhaarNumber && <p className="err-text">{errors.aadhaarNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Vehicle Type *</label>
            <select {...register('vehicleType')} className="gov-input">
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Registration Number *</label>
            <input {...register('registrationNumber')} className="gov-input font-mono uppercase" placeholder="AP 39 AX 1234" />
            {errors.registrationNumber && <p className="err-text">{errors.registrationNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Make *</label>
            <input {...register('make')} className="gov-input" placeholder="e.g. Hero, Maruti" />
            {errors.make && <p className="err-text">{errors.make.message}</p>}
          </div>
          <div>
            <label className="label-text">Model *</label>
            <input {...register('model')} className="gov-input" />
            {errors.model && <p className="err-text">{errors.model.message}</p>}
          </div>
          <div>
            <label className="label-text">Variant</label>
            <input {...register('variant')} className="gov-input" />
          </div>
          <div>
            <label className="label-text">Year *</label>
            <input {...register('year')} type="number" min={1990} max={2030} className="gov-input" />
            {errors.year && <p className="err-text">{errors.year.message}</p>}
          </div>
          <div>
            <label className="label-text">Color *</label>
            <input {...register('color')} className="gov-input" />
            {errors.color && <p className="err-text">{errors.color.message}</p>}
          </div>
          <div>
            <label className="label-text">Engine Number *</label>
            <input {...register('engineNumber')} className="gov-input font-mono" />
            {errors.engineNumber && <p className="err-text">{errors.engineNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Chassis Number *</label>
            <input {...register('chassisNumber')} className="gov-input font-mono" />
            {errors.chassisNumber && <p className="err-text">{errors.chassisNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Fuel Type *</label>
            <select {...register('fuelType')} className="gov-input">
              {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Market Value (₹)</label>
            <input {...register('marketValue')} type="number" className="gov-input" />
          </div>
          <div>
            <label className="label-text">Insurance Number</label>
            <input {...register('insuranceNumber')} className="gov-input" />
          </div>
          <div>
            <label className="label-text">Insurance Expiry</label>
            <input {...register('insuranceExpiry')} type="date" className="gov-input" />
          </div>
          <div className="md:col-span-2">
            <label className="label-text">Remarks</label>
            <textarea {...register('remarks')} className="gov-input" rows={2} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="Delete Vehicle" message={`Delete vehicle ${deleteTarget?.registrationNumber}? This cannot be undone.`}
        confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
};

export default VehiclesPage;
