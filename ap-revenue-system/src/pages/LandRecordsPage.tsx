import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Download, Eye, Map, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { LandRecord } from '../types';
import { landDB, auditDB } from '../services/dbService';
import { useAppStore } from '../store/appStore';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { exportLandsToExcel } from '../services/reportService';

const DISTRICTS = ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Kadapa', 'Kurnool', 'Anantapur', 'Srikakulam', 'Vizianagaram'];
const LAND_TYPES = ['Agriculture', 'Commercial', 'Residential', 'Industrial', 'Forest', 'Government'] as const;
const OWNERSHIP_TYPES = ['Owned', 'Inherited', 'Purchased', 'Gift'] as const;
const ENCUMBRANCE_TYPES = ['Clear', 'Mortgaged', 'Disputed', 'Court Order'] as const;

const schema = z.object({
  aadhaarNumber: z.string().length(12, 'Must be 12 digits').regex(/^\d+$/, 'Digits only'),
  surveyNumber: z.string().min(1, 'Required'),
  subDivision: z.string().optional(),
  village: z.string().min(1, 'Required'),
  mandal: z.string().min(1, 'Required'),
  district: z.string().min(1, 'Required'),
  landType: z.enum(LAND_TYPES),
  extentInAcres: z.coerce.number().positive('Must be positive'),
  marketValue: z.coerce.number().min(0, 'Must be ≥ 0'),
  pattaNumber: z.string().optional(),
  ownershipType: z.enum(OWNERSHIP_TYPES),
  encumbranceStatus: z.enum(ENCUMBRANCE_TYPES),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PAGE_SIZE = 12;

const LandRecordsPage: React.FC = () => {
  const { currentUser, hasPermission } = useAppStore();
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [filtered, setFiltered] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LandRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canWrite = hasPermission('create');
  const canDelete = hasPermission('delete');
  const canExport = hasPermission('export');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { district: '', landType: 'Agriculture', ownershipType: 'Owned', encumbranceStatus: 'Clear' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await landDB.getAll();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let data = [...records];
    const q = search.toLowerCase();
    if (q) data = data.filter(r =>
      r.surveyNumber.toLowerCase().includes(q) ||
      r.aadhaarNumber.includes(q) ||
      r.village.toLowerCase().includes(q) ||
      r.mandal.toLowerCase().includes(q)
    );
    if (districtFilter) data = data.filter(r => r.district === districtFilter);
    if (typeFilter) data = data.filter(r => r.landType === typeFilter);
    setFiltered(data);
    setPage(1);
  }, [records, search, districtFilter, typeFilter]);

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const openAdd = () => {
    setEditing(null);
    reset({ district: '', landType: 'Agriculture', ownershipType: 'Owned', encumbranceStatus: 'Clear' });
    setModalOpen(true);
  };

  const openEdit = (r: LandRecord) => {
    setEditing(r);
    reset({
      aadhaarNumber: r.aadhaarNumber,
      surveyNumber: r.surveyNumber,
      subDivision: r.subDivision,
      village: r.village,
      mandal: r.mandal,
      district: r.district,
      landType: r.landType,
      extentInAcres: r.extentInAcres,
      marketValue: r.marketValue,
      pattaNumber: r.pattaNumber,
      ownershipType: r.ownershipType,
      encumbranceStatus: r.encumbranceStatus,
      remarks: r.remarks,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const userId = currentUser?.id || 'system';
    if (editing) {
      const updated: LandRecord = { ...editing, ...data, updatedBy: userId, updatedAt: now };
      await landDB.update(updated);
      toast.success('Land record updated');
    } else {
      const land: LandRecord = {
        id: uuidv4(), citizenId: '', ...data,
        createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now,
      };
      await landDB.create(land);
      toast.success('Land record created');
    }
    await auditDB.add({
      id: uuidv4(), userId: userId, userName: currentUser?.fullName || 'System',
      action: editing ? 'UPDATE' : 'CREATE', module: 'LandRecords',
      entityId: editing?.id, details: `${editing ? 'Updated' : 'Created'} land record ${data.surveyNumber}`,
      timestamp: now,
    });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await landDB.delete(deleteTarget.id);
    toast.success('Land record deleted');
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalArea = filtered.reduce((s, r) => s + r.extentInAcres, 0);
  const totalValue = filtered.reduce((s, r) => s + r.marketValue, 0);

  const handleExport = async () => {
    try {
      await exportLandsToExcel();
      toast.success('Exported to Excel');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Land Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">{records.length} total records</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Land Record
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: filtered.length, color: 'ap-blue' },
          { label: 'Total Area (acres)', value: totalArea.toFixed(2), color: 'green' },
          { label: 'Estimated Value', value: formatCurrency(totalValue), color: 'gold' },
          { label: 'Mortgaged / Disputed', value: filtered.filter(r => r.encumbranceStatus !== 'Clear').length, color: 'red' },
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
            <input
              className="gov-input pl-9 py-2"
              placeholder="Search survey no., aadhaar, village..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="gov-input py-2 min-w-36" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="gov-input py-2 min-w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {LAND_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          {(search || districtFilter || typeFilter) && (
            <button onClick={() => { setSearch(''); setDistrictFilter(''); setTypeFilter(''); }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Survey No.</th>
                <th>Village / Mandal</th>
                <th>District</th>
                <th>Land Type</th>
                <th>Extent (acres)</th>
                <th>Market Value</th>
                <th>Ownership</th>
                <th>Encumbrance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <Map size={40} className="mx-auto mb-2 text-gray-200" />
                  No land records found
                </td></tr>
              ) : pageData.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-ap-blue">{r.surveyNumber}</td>
                  <td>{r.village}, {r.mandal}</td>
                  <td>{r.district}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.landType === 'Agriculture' ? 'bg-green-100 text-green-700' :
                      r.landType === 'Commercial' ? 'bg-blue-100 text-blue-700' :
                      r.landType === 'Residential' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{r.landType}</span>
                  </td>
                  <td>{r.extentInAcres.toFixed(3)}</td>
                  <td>{formatCurrency(r.marketValue)}</td>
                  <td>{r.ownershipType}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.encumbranceStatus === 'Clear' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{r.encumbranceStatus}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {canWrite && (
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Edit size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
            <span className="px-3">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Land Record' : 'Add Land Record'} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Record'}</button>
          </div>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}>
          <div>
            <label className="label-text">Aadhaar Number *</label>
            <input {...register('aadhaarNumber')} className="gov-input" placeholder="12 digit Aadhaar" maxLength={12} />
            {errors.aadhaarNumber && <p className="err-text">{errors.aadhaarNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Survey Number *</label>
            <input {...register('surveyNumber')} className="gov-input" placeholder="e.g. 123/A" />
            {errors.surveyNumber && <p className="err-text">{errors.surveyNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Sub Division</label>
            <input {...register('subDivision')} className="gov-input" placeholder="Optional" />
          </div>
          <div>
            <label className="label-text">Village *</label>
            <input {...register('village')} className="gov-input" placeholder="Village name" />
            {errors.village && <p className="err-text">{errors.village.message}</p>}
          </div>
          <div>
            <label className="label-text">Mandal *</label>
            <input {...register('mandal')} className="gov-input" placeholder="Mandal name" />
            {errors.mandal && <p className="err-text">{errors.mandal.message}</p>}
          </div>
          <div>
            <label className="label-text">District *</label>
            <select {...register('district')} className="gov-input">
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.district && <p className="err-text">{errors.district.message}</p>}
          </div>
          <div>
            <label className="label-text">Land Type *</label>
            <select {...register('landType')} className="gov-input">
              {LAND_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Extent (acres) *</label>
            <input {...register('extentInAcres')} type="number" step="0.001" className="gov-input" placeholder="0.000" />
            {errors.extentInAcres && <p className="err-text">{errors.extentInAcres.message}</p>}
          </div>
          <div>
            <label className="label-text">Market Value (₹) *</label>
            <input {...register('marketValue')} type="number" className="gov-input" placeholder="0" />
            {errors.marketValue && <p className="err-text">{errors.marketValue.message}</p>}
          </div>
          <div>
            <label className="label-text">Patta Number</label>
            <input {...register('pattaNumber')} className="gov-input" placeholder="Optional" />
          </div>
          <div>
            <label className="label-text">Ownership Type *</label>
            <select {...register('ownershipType')} className="gov-input">
              {OWNERSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Encumbrance Status *</label>
            <select {...register('encumbranceStatus')} className="gov-input">
              {ENCUMBRANCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label-text">Remarks</label>
            <textarea {...register('remarks')} className="gov-input" rows={2} placeholder="Any additional notes..." />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Land Record"
        message={`Are you sure you want to delete Survey No. ${deleteTarget?.surveyNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </div>
  );
};

export default LandRecordsPage;
