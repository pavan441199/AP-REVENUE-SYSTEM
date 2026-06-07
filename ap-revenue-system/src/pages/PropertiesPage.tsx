import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Download, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { HouseProperty } from '../types';
import { propertyDB, auditDB } from '../services/dbService';
import { useAppStore } from '../store/appStore';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { exportCitizensToExcel } from '../services/reportService';

const DISTRICTS = ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Kadapa', 'Kurnool', 'Anantapur', 'Srikakulam', 'Vizianagaram'];
const PROPERTY_TYPES = ['Independent House', 'Flat', 'Commercial', 'Apartment', 'Villa', 'Row House'] as const;
const ENCUMBRANCE_TYPES = ['Clear', 'Mortgaged', 'Disputed', 'Court Order'] as const;

const schema = z.object({
  aadhaarNumber: z.string().length(12, '12 digits').regex(/^\d+$/),
  propertyId: z.string().min(1, 'Required'),
  doorNo: z.string().min(1, 'Required'),
  street: z.string().min(1, 'Required'),
  village: z.string().min(1, 'Required'),
  mandal: z.string().min(1, 'Required'),
  district: z.string().min(1, 'Required'),
  propertyType: z.enum(PROPERTY_TYPES),
  builtUpArea: z.coerce.number().positive(),
  plotArea: z.coerce.number().optional(),
  floors: z.coerce.number().int().min(1),
  constructionYear: z.coerce.number().optional(),
  marketValue: z.coerce.number().min(0),
  annualRentalValue: z.coerce.number().optional(),
  encumbranceStatus: z.enum(ENCUMBRANCE_TYPES),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
const PAGE_SIZE = 12;

const PropertiesPage: React.FC = () => {
  const { currentUser, hasPermission } = useAppStore();
  const [records, setRecords] = useState<HouseProperty[]>([]);
  const [filtered, setFiltered] = useState<HouseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HouseProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HouseProperty | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canWrite = hasPermission('create');
  const canDelete = hasPermission('delete');
  const canExport = hasPermission('export');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { district: '', propertyType: 'Independent House', encumbranceStatus: 'Clear', floors: 1 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await propertyDB.getAll();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let data = [...records];
    const q = search.toLowerCase();
    if (q) data = data.filter(r =>
      r.propertyId.toLowerCase().includes(q) ||
      r.aadhaarNumber.includes(q) ||
      r.doorNo.toLowerCase().includes(q) ||
      r.street.toLowerCase().includes(q) ||
      r.village.toLowerCase().includes(q)
    );
    if (districtFilter) data = data.filter(r => r.district === districtFilter);
    if (typeFilter) data = data.filter(r => r.propertyType === typeFilter);
    setFiltered(data);
    setPage(1);
  }, [records, search, districtFilter, typeFilter]);

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const openEdit = (r: HouseProperty) => {
    setEditing(r);
    reset({ ...r });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({ district: '', propertyType: 'Independent House', encumbranceStatus: 'Clear', floors: 1 });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const userId = currentUser?.id || 'system';
    if (editing) {
      await propertyDB.update({ ...editing, ...data, updatedBy: userId, updatedAt: now });
      toast.success('Property updated');
    } else {
      await propertyDB.create({ id: uuidv4(), citizenId: '', ...data, createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now });
      toast.success('Property added');
    }
    await auditDB.add({ id: uuidv4(), userId, userName: currentUser?.fullName || 'System', action: editing ? 'UPDATE' : 'CREATE', module: 'Properties', details: `${editing ? 'Updated' : 'Created'} property ${data.propertyId}`, timestamp: now });
    setSaving(false); setModalOpen(false); load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await propertyDB.delete(deleteTarget.id);
    toast.success('Property deleted');
    setDeleting(false); setDeleteTarget(null); load();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalValue = filtered.reduce((s, r) => s + r.marketValue, 0);

  const handleExport = async () => {
    try { await exportCitizensToExcel(); toast.success('Exported'); }
    catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">House Properties</h1>
          <p className="text-sm text-gray-500">{records.length} total properties</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Property
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: filtered.length },
          { label: 'Independent Houses', value: filtered.filter(r => r.propertyType === 'Independent House').length },
          { label: 'Flats / Apartments', value: filtered.filter(r => ['Flat', 'Apartment'].includes(r.propertyType)).length },
          { label: 'Estimated Total Value', value: formatCurrency(totalValue) },
        ].map(s => (
          <div key={s.label} className="gov-card text-center">
            <div className="text-2xl font-bold text-ap-blue">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="gov-card">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="gov-input pl-9 py-2" placeholder="Search property ID, Aadhaar, address..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="gov-input py-2 min-w-36" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="gov-input py-2 min-w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Property ID</th>
                <th>Address</th>
                <th>District</th>
                <th>Type</th>
                <th>Area (sq ft)</th>
                <th>Floors</th>
                <th>Market Value</th>
                <th>Encumbrance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <Home size={40} className="mx-auto mb-2 text-gray-200" />No properties found
                </td></tr>
              ) : pageData.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-ap-blue">{r.propertyId}</td>
                  <td className="text-sm">{r.doorNo}, {r.street}, {r.village}</td>
                  <td>{r.district}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">{r.propertyType}</span>
                  </td>
                  <td>{r.builtUpArea.toLocaleString()}</td>
                  <td>{r.floors}</td>
                  <td>{formatCurrency(r.marketValue)}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.encumbranceStatus === 'Clear' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{r.encumbranceStatus}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {canWrite && <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit size={14} /></button>}
                      {canDelete && <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  </td>
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Property' : 'Add Property'} size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Property'}</button>
          </div>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}>
          <div>
            <label className="label-text">Aadhaar Number *</label>
            <input {...register('aadhaarNumber')} className="gov-input" placeholder="12 digits" maxLength={12} />
            {errors.aadhaarNumber && <p className="err-text">{errors.aadhaarNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Property ID *</label>
            <input {...register('propertyId')} className="gov-input" placeholder="e.g. PROP/GNT/2023/001" />
            {errors.propertyId && <p className="err-text">{errors.propertyId.message}</p>}
          </div>
          <div>
            <label className="label-text">Door No. *</label>
            <input {...register('doorNo')} className="gov-input" />
            {errors.doorNo && <p className="err-text">{errors.doorNo.message}</p>}
          </div>
          <div>
            <label className="label-text">Street *</label>
            <input {...register('street')} className="gov-input" />
            {errors.street && <p className="err-text">{errors.street.message}</p>}
          </div>
          <div>
            <label className="label-text">Village *</label>
            <input {...register('village')} className="gov-input" />
            {errors.village && <p className="err-text">{errors.village.message}</p>}
          </div>
          <div>
            <label className="label-text">Mandal *</label>
            <input {...register('mandal')} className="gov-input" />
            {errors.mandal && <p className="err-text">{errors.mandal.message}</p>}
          </div>
          <div>
            <label className="label-text">District *</label>
            <select {...register('district')} className="gov-input">
              <option value="">Select</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.district && <p className="err-text">{errors.district.message}</p>}
          </div>
          <div>
            <label className="label-text">Property Type *</label>
            <select {...register('propertyType')} className="gov-input">
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Built-up Area (sq ft) *</label>
            <input {...register('builtUpArea')} type="number" className="gov-input" />
            {errors.builtUpArea && <p className="err-text">{errors.builtUpArea.message}</p>}
          </div>
          <div>
            <label className="label-text">Plot Area (sq ft)</label>
            <input {...register('plotArea')} type="number" className="gov-input" />
          </div>
          <div>
            <label className="label-text">Number of Floors *</label>
            <input {...register('floors')} type="number" min={1} className="gov-input" />
            {errors.floors && <p className="err-text">{errors.floors.message}</p>}
          </div>
          <div>
            <label className="label-text">Construction Year</label>
            <input {...register('constructionYear')} type="number" min={1900} max={2030} className="gov-input" />
          </div>
          <div>
            <label className="label-text">Market Value (₹) *</label>
            <input {...register('marketValue')} type="number" className="gov-input" />
            {errors.marketValue && <p className="err-text">{errors.marketValue.message}</p>}
          </div>
          <div>
            <label className="label-text">Annual Rental Value (₹)</label>
            <input {...register('annualRentalValue')} type="number" className="gov-input" />
          </div>
          <div>
            <label className="label-text">Encumbrance Status *</label>
            <select {...register('encumbranceStatus')} className="gov-input">
              {ENCUMBRANCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Remarks</label>
            <input {...register('remarks')} className="gov-input" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="Delete Property" message={`Delete property ${deleteTarget?.propertyId}? This cannot be undone.`}
        confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
};

export default PropertiesPage;
