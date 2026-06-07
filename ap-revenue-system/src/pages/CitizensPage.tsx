// ============================================================
// AP Revenue ICAMS - Citizens Page
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit2, Trash2, Download, Filter, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Citizen } from '../types';
import { citizenDB } from '../services/dbService';
import { logAudit } from '../services/authService';
import { useAppStore } from '../store/appStore';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';

const DISTRICTS = ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Kadapa', 'Kurnool', 'Anantapur', 'Chittoor', 'Srikakulam', 'Vizianagaram'];

const citizenSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  fatherHusbandName: z.string().min(2, 'Required'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  doorNo: z.string().min(1, 'Door number required'),
  street: z.string().min(3, 'Street required'),
  village: z.string().min(2, 'Village required'),
  mandal: z.string().min(2, 'Mandal required'),
  district: z.string().min(1, 'District required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  caste: z.string().optional(),
  religion: z.string().optional(),
  annualIncome: z.number().min(0).max(99999999).optional(),
});

type CitizenFormData = z.infer<typeof citizenSchema>;

const CitizensPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAppStore();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [filtered, setFiltered] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Citizen | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema),
  });

  const loadCitizens = useCallback(async () => {
    setLoading(true);
    const data = await citizenDB.getAll();
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setCitizens(data);
    setFiltered(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadCitizens(); }, [loadCitizens]);

  // Filter citizens
  useEffect(() => {
    let result = citizens;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.aadhaarNumber.includes(q) ||
        c.mobile.includes(q) ||
        c.address.district.toLowerCase().includes(q) ||
        c.address.mandal.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (districtFilter) {
      result = result.filter(c => c.address.district === districtFilter);
    }
    setFiltered(result);
    setPage(1);
  }, [searchQuery, districtFilter, citizens]);

  const openAdd = () => {
    setEditingCitizen(null);
    reset({});
    setShowForm(true);
  };

  const openEdit = (c: Citizen) => {
    setEditingCitizen(c);
    setValue('firstName', c.firstName);
    setValue('lastName', c.lastName);
    setValue('fatherHusbandName', c.fatherHusbandName);
    setValue('aadhaarNumber', c.aadhaarNumber);
    setValue('dateOfBirth', c.dateOfBirth);
    setValue('gender', c.gender);
    setValue('mobile', c.mobile);
    setValue('email', c.email || '');
    setValue('doorNo', c.address.doorNo);
    setValue('street', c.address.street);
    setValue('village', c.address.village);
    setValue('mandal', c.address.mandal);
    setValue('district', c.address.district);
    setValue('pincode', c.address.pincode);
    setValue('caste', c.caste || '');
    setValue('religion', c.religion || '');
    setValue('annualIncome', c.annualIncome);
    setShowForm(true);
  };

  const onSubmit = async (data: CitizenFormData) => {
    const now = new Date().toISOString();
    const userId = currentUser?.userId || 'system';
    const userName = currentUser?.fullName || 'System';

    if (editingCitizen) {
      const updated: Citizen = {
        ...editingCitizen,
        ...data,
        address: { doorNo: data.doorNo, street: data.street, village: data.village, mandal: data.mandal, district: data.district, state: 'Andhra Pradesh', pincode: data.pincode },
        email: data.email || undefined,
        caste: data.caste || undefined,
        religion: data.religion || undefined,
        updatedBy: userId,
        updatedAt: now,
      };
      await citizenDB.update(updated);
      await logAudit(userId, userName, 'UPDATE', 'Citizens', `Updated citizen ${editingCitizen.id}`, editingCitizen.id, 'Citizen');
      toast.success('Citizen record updated successfully');
    } else {
      // Check for duplicate Aadhaar
      const existing = await citizenDB.getByAadhaar(data.aadhaarNumber);
      if (existing) {
        toast.error('Aadhaar number already registered');
        return;
      }
      const lastCitizens = await citizenDB.getAll();
      const newId = `CIT${(lastCitizens.length + 1).toString().padStart(5, '0')}`;
      const newCitizen: Citizen = {
        id: newId,
        ...data,
        address: { doorNo: data.doorNo, street: data.street, village: data.village, mandal: data.mandal, district: data.district, state: 'Andhra Pradesh', pincode: data.pincode },
        email: data.email || undefined,
        caste: data.caste || undefined,
        religion: data.religion || undefined,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      await citizenDB.create(newCitizen);
      await logAudit(userId, userName, 'CREATE', 'Citizens', `Added new citizen ${newId}`, newId, 'Citizen');
      toast.success('Citizen added successfully');
    }

    setShowForm(false);
    await loadCitizens();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await citizenDB.delete(deleteTarget.id);
    await logAudit(currentUser?.userId || '', currentUser?.fullName || '', 'DELETE', 'Citizens', `Deleted citizen ${deleteTarget.id}`, deleteTarget.id, 'Citizen');
    toast.success('Citizen record deleted');
    setDeleteTarget(null);
    await loadCitizens();
  };

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Users size={20} />Citizens Registry</h1>
          <p className="text-xs text-gray-500 mt-1">Manage citizen records linked to Aadhaar numbers</p>
        </div>
        {hasPermission('create') && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} />Add Citizen
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="gov-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="gov-input pl-9"
              placeholder="Search by name, Aadhaar, mobile, district..."
            />
          </div>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="gov-select w-full sm:w-48"
          >
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={14} />
            <span>{filtered.length} records</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-ap-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading citizens...
          </div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No citizens found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Citizen ID</th>
                  <th>Name</th>
                  <th>Aadhaar</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>District</th>
                  <th>Mandal</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(c => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="cursor-pointer"
                  >
                    <td className="font-mono text-xs text-ap-blue font-semibold">{c.id}</td>
                    <td>
                      <div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-gray-400">S/O D/O W/O: {c.fatherHusbandName.split(' ')[0]}...</div>
                    </td>
                    <td className="font-mono text-xs">
                      {c.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-$3')}
                    </td>
                    <td>
                      <span className={`badge ${c.gender === 'Male' ? 'badge-blue' : c.gender === 'Female' ? 'badge-purple' : 'badge-gray'}`}>
                        {c.gender}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{c.mobile}</td>
                    <td className="text-xs">{c.address.district}</td>
                    <td className="text-xs">{c.address.mandal}</td>
                    <td>
                      <span className={c.isActive ? 'status-active' : 'status-inactive'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/citizens/${c.id}`)}
                          className="btn-icon hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {hasPermission('update') && (
                          <button
                            onClick={() => openEdit(c)}
                            className="btn-icon hover:text-yellow-600"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {hasPermission('delete') && (
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="btn-icon hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-2 disabled:opacity-40">←</button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`text-xs py-1 px-2.5 rounded border transition-colors ${p === page ? 'bg-ap-blue text-white border-ap-blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-2 disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingCitizen ? 'Edit Citizen Record' : 'Add New Citizen'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="sm:col-span-2 text-xs font-bold text-ap-blue uppercase tracking-wide pb-1 border-b border-blue-100">
              Personal Information
            </div>

            <div>
              <label className="gov-label">First Name *</label>
              <input {...register('firstName')} className="gov-input" placeholder="First Name" />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="gov-label">Last Name *</label>
              <input {...register('lastName')} className="gov-input" placeholder="Last Name" />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="gov-label">Father/Husband Name *</label>
              <input {...register('fatherHusbandName')} className="gov-input" placeholder="Father or Husband Name" />
              {errors.fatherHusbandName && <p className="form-error">{errors.fatherHusbandName.message}</p>}
            </div>
            <div>
              <label className="gov-label">Aadhaar Number * (12 digits)</label>
              <input {...register('aadhaarNumber')} className="gov-input font-mono" placeholder="123456789012" maxLength={12} />
              {errors.aadhaarNumber && <p className="form-error">{errors.aadhaarNumber.message}</p>}
            </div>
            <div>
              <label className="gov-label">Date of Birth *</label>
              <input {...register('dateOfBirth')} type="date" className="gov-input" />
              {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="gov-label">Gender *</label>
              <select {...register('gender')} className="gov-select">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="gov-label">Mobile Number *</label>
              <input {...register('mobile')} className="gov-input font-mono" placeholder="9876543210" maxLength={10} />
              {errors.mobile && <p className="form-error">{errors.mobile.message}</p>}
            </div>
            <div>
              <label className="gov-label">Email</label>
              <input {...register('email')} type="email" className="gov-input" placeholder="email@example.com" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="gov-label">Caste</label>
              <select {...register('caste')} className="gov-select">
                <option value="">Select Caste</option>
                {['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="gov-label">Religion</label>
              <select {...register('religion')} className="gov-select">
                <option value="">Select Religion</option>
                {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="gov-label">Annual Income (₹)</label>
              <input {...register('annualIncome', { valueAsNumber: true })} type="number" className="gov-input" placeholder="e.g. 250000" />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 text-xs font-bold text-ap-blue uppercase tracking-wide pb-1 border-b border-blue-100 mt-2">
              Address Details
            </div>
            <div>
              <label className="gov-label">Door No. *</label>
              <input {...register('doorNo')} className="gov-input" placeholder="e.g. 12-45" />
              {errors.doorNo && <p className="form-error">{errors.doorNo.message}</p>}
            </div>
            <div>
              <label className="gov-label">Street *</label>
              <input {...register('street')} className="gov-input" placeholder="Street / Area" />
              {errors.street && <p className="form-error">{errors.street.message}</p>}
            </div>
            <div>
              <label className="gov-label">Village *</label>
              <input {...register('village')} className="gov-input" placeholder="Village / Town" />
              {errors.village && <p className="form-error">{errors.village.message}</p>}
            </div>
            <div>
              <label className="gov-label">Mandal *</label>
              <input {...register('mandal')} className="gov-input" placeholder="Mandal" />
              {errors.mandal && <p className="form-error">{errors.mandal.message}</p>}
            </div>
            <div>
              <label className="gov-label">District *</label>
              <select {...register('district')} className="gov-select">
                <option value="">Select District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <p className="form-error">{errors.district.message}</p>}
            </div>
            <div>
              <label className="gov-label">Pincode *</label>
              <input {...register('pincode')} className="gov-input font-mono" placeholder="500001" maxLength={6} />
              {errors.pincode && <p className="form-error">{errors.pincode.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {editingCitizen ? 'Update Citizen' : 'Add Citizen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Citizen Record"
        message={`Are you sure you want to delete the record for ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This will permanently remove the citizen and may affect linked asset records.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default CitizensPage;
