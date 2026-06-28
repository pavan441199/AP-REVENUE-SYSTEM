import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Download, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { RationCard } from '../types';
import { rationCardDB, auditDB } from '../services/dbService';
import { useAppStore } from '../store/appStore';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { exportRationCardsToExcel } from '../services/reportService';

const CARD_TYPES = ['AAY', 'PHH', 'NPHH', 'APL', 'BPL'] as const;
const CARD_TYPE_LABELS: Record<string, string> = {
  AAY: 'Antyodaya (AAY)', PHH: 'Priority HH (PHH)', NPHH: 'Non-Priority HH', APL: 'Above Poverty Line', BPL: 'Below Poverty Line',
};

const schema = z.object({
  aadhaarNumber: z.string().length(12, '12 digits').regex(/^\d+$/),
  cardNumber: z.string().min(1, 'Required'),
  cardType: z.enum(CARD_TYPES),
  issuedDate: z.string().min(1, 'Required'),
  expiryDate: z.string().optional(),
  familySize: z.coerce.number().int().min(1),
  headOfFamily: z.string().min(1, 'Required'),
  shop: z.string().min(1, 'Required'),
  shopCode: z.string().min(1, 'Required'),
  riceKg: z.coerce.number().optional(),
  wheatKg: z.coerce.number().optional(),
  isActive: z.boolean(),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
const PAGE_SIZE = 12;

const cardTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    AAY: 'bg-yellow-100 text-yellow-800',
    PHH: 'bg-green-100 text-green-700',
    NPHH: 'bg-gray-100 text-gray-700',
    APL: 'bg-blue-100 text-blue-700',
    BPL: 'bg-red-100 text-red-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

const RationCardsPage: React.FC = () => {
  const { currentUser, hasPermission } = useAppStore();
  const [records, setRecords] = useState<RationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RationCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RationCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canWrite = hasPermission('create');
  const canDelete = hasPermission('delete');
  const canExport = hasPermission('export');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cardType: 'PHH', isActive: true, familySize: 1 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setRecords(await rationCardDB.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.cardNumber.toLowerCase().includes(q) && !r.aadhaarNumber.includes(q) && !r.headOfFamily.toLowerCase().includes(q)) return false;
    if (typeFilter && r.cardType !== typeFilter) return false;
    if (statusFilter === 'active' && !r.isActive) return false;
    if (statusFilter === 'inactive' && r.isActive) return false;
    return true;
  });

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const openEdit = (r: RationCard) => {
    setEditing(r);
    reset({
      ...r,
      riceKg: r.monthlyEntitlement?.rice,
      wheatKg: r.monthlyEntitlement?.wheat,
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({ cardType: 'PHH', isActive: true, familySize: 1 });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const userId = currentUser?.id || 'system';
    const { riceKg, wheatKg, ...rest } = data;
    const card: Partial<RationCard> = {
      ...rest,
      monthlyEntitlement: { rice: riceKg, wheat: wheatKg },
      updatedBy: userId, updatedAt: now,
    };
    if (editing) {
      await rationCardDB.update({ ...editing, ...card } as RationCard);
      toast.success('Ration card updated');
    } else {
      await rationCardDB.create({ id: uuidv4(), citizenId: '', ...card, createdBy: userId, createdAt: now } as RationCard);
      toast.success('Ration card added');
    }
    await auditDB.add({ id: uuidv4(), userId, userName: currentUser?.fullName || 'System', action: editing ? 'UPDATE' : 'CREATE', module: 'RationCards', details: `${editing ? 'Updated' : 'Created'} card ${data.cardNumber}`, timestamp: now });
    setSaving(false); setModalOpen(false); load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await rationCardDB.delete(deleteTarget.id);
    toast.success('Ration card deleted');
    setDeleting(false); setDeleteTarget(null); load();
  };

  const totalFamilyMembers = filtered.reduce((s, r) => s + r.familySize, 0);
  const activeCount = filtered.filter(r => r.isActive).length;

  const handleExport = async () => {
    try { await exportRationCardsToExcel(); toast.success('Exported'); }
    catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ration Cards</h1>
          <p className="text-sm text-gray-500">{records.length} total cards</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Ration Card
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cards', value: filtered.length },
          { label: 'Active', value: activeCount },
          { label: 'Total Family Members', value: totalFamilyMembers.toLocaleString() },
          { label: 'AAY / PHH Cards', value: filtered.filter(r => ['AAY', 'PHH'].includes(r.cardType)).length },
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
            <input className="gov-input pl-9 py-2" placeholder="Card no., Aadhaar, head of family..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="gov-input py-2 min-w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {CARD_TYPES.map(t => <option key={t} value={t}>{CARD_TYPE_LABELS[t]}</option>)}
          </select>
          <select className="gov-input py-2 min-w-28" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Card Number</th>
                <th>Aadhaar</th>
                <th>Head of Family</th>
                <th>Type</th>
                <th>Family Size</th>
                <th>Shop</th>
                <th>Issued Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <ShoppingBag size={40} className="mx-auto mb-2 text-gray-200" />No ration cards found
                </td></tr>
              ) : pageData.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-ap-blue font-mono">{r.cardNumber}</td>
                  <td className="font-mono text-sm">{r.aadhaarNumber}</td>
                  <td>{r.headOfFamily}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cardTypeBadge(r.cardType)}`}>{r.cardType}</span></td>
                  <td className="text-center">{r.familySize}</td>
                  <td className="text-sm">{r.shop}</td>
                  <td>{r.issuedDate}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Ration Card' : 'Add Ration Card'} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Card'}</button>
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
            <label className="label-text">Card Number *</label>
            <input {...register('cardNumber')} className="gov-input" />
            {errors.cardNumber && <p className="err-text">{errors.cardNumber.message}</p>}
          </div>
          <div>
            <label className="label-text">Card Type *</label>
            <select {...register('cardType')} className="gov-input">
              {CARD_TYPES.map(t => <option key={t} value={t}>{CARD_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Head of Family *</label>
            <input {...register('headOfFamily')} className="gov-input" />
            {errors.headOfFamily && <p className="err-text">{errors.headOfFamily.message}</p>}
          </div>
          <div>
            <label className="label-text">Family Size *</label>
            <input {...register('familySize')} type="number" min={1} className="gov-input" />
            {errors.familySize && <p className="err-text">{errors.familySize.message}</p>}
          </div>
          <div>
            <label className="label-text">Issued Date *</label>
            <input {...register('issuedDate')} type="date" className="gov-input" />
            {errors.issuedDate && <p className="err-text">{errors.issuedDate.message}</p>}
          </div>
          <div>
            <label className="label-text">Expiry Date</label>
            <input {...register('expiryDate')} type="date" className="gov-input" />
          </div>
          <div>
            <label className="label-text">Fair Price Shop *</label>
            <input {...register('shop')} className="gov-input" />
            {errors.shop && <p className="err-text">{errors.shop.message}</p>}
          </div>
          <div>
            <label className="label-text">Shop Code *</label>
            <input {...register('shopCode')} className="gov-input" />
            {errors.shopCode && <p className="err-text">{errors.shopCode.message}</p>}
          </div>
          <div>
            <label className="label-text">Monthly Rice Entitlement (kg)</label>
            <input {...register('riceKg')} type="number" step="0.5" className="gov-input" />
          </div>
          <div>
            <label className="label-text">Monthly Wheat Entitlement (kg)</label>
            <input {...register('wheatKg')} type="number" step="0.5" className="gov-input" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Card is Active</label>
          </div>
          <div className="md:col-span-2">
            <label className="label-text">Remarks</label>
            <textarea {...register('remarks')} className="gov-input" rows={2} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="Delete Ration Card" message={`Delete card ${deleteTarget?.cardNumber}? This cannot be undone.`}
        confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
};

export default RationCardsPage;
