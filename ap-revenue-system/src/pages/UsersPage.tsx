import React, { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Edit, Shield, ChevronLeft, ChevronRight, Search, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { User, UserRole } from '../types';
import { userDB, auditDB } from '../services/dbService';
import { useAppStore } from '../store/appStore';
import Modal from '../components/common/Modal';

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'administrator', label: 'Administrator', color: 'bg-red-100 text-red-700' },
  { value: 'revenue_officer', label: 'Revenue Officer', color: 'bg-blue-100 text-blue-700' },
  { value: 'data_entry_operator', label: 'Data Entry Operator', color: 'bg-green-100 text-green-700' },
  { value: 'read_only_officer', label: 'Read Only Officer', color: 'bg-gray-100 text-gray-600' },
];
const DISTRICTS = ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Kadapa', 'Kurnool', 'Anantapur', 'Srikakulam', 'Vizianagaram'];

const schema = z.object({
  username: z.string().min(3, 'Min 3 chars').max(20),
  fullName: z.string().min(2, 'Required'),
  designation: z.string().min(2, 'Required'),
  role: z.enum(['administrator', 'revenue_officer', 'data_entry_operator', 'read_only_officer'] as const),
  district: z.string().min(1, 'Required'),
  mandal: z.string().optional().default(''),
  email: z.string().email('Invalid email'),
  mobile: z.string().length(10, '10 digits').regex(/^\d+$/),
  password: z.string().min(6, 'Min 6 chars').optional().or(z.literal('')),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;
const PAGE_SIZE = 10;

const UsersPage: React.FC = () => {
  const { currentUser, hasPermission } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission('manage_users');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'data_entry_operator', isActive: true, mandal: '' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setUsers(await userDB.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.fullName.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const openEdit = (u: User) => {
    setEditing(u);
    reset({ ...u, password: '' });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({ role: 'data_entry_operator', isActive: true, mandal: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const now = new Date().toISOString();
    const userId = currentUser?.id || 'system';
    if (editing) {
      const updated: User = {
        ...editing,
        fullName: data.fullName,
        designation: data.designation,
        role: data.role,
        district: data.district,
        mandal: data.mandal || '',
        email: data.email,
        mobile: data.mobile,
        isActive: data.isActive,
        updatedAt: now,
        ...(data.password ? { passwordHash: CryptoJS.MD5(data.password).toString() } : {}),
      };
      await userDB.update(updated);
      toast.success('User updated');
    } else {
      if (!data.password) { toast.error('Password is required for new users'); setSaving(false); return; }
      const newUser: User = {
        id: uuidv4(),
        userId: `USR${Date.now()}`,
        username: data.username,
        passwordHash: CryptoJS.MD5(data.password).toString(),
        fullName: data.fullName,
        designation: data.designation,
        role: data.role,
        district: data.district,
        mandal: data.mandal || '',
        email: data.email,
        mobile: data.mobile,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };
      await userDB.create(newUser);
      toast.success('User created');
    }
    await auditDB.add({ id: uuidv4(), userId, userName: currentUser?.fullName || 'System', action: editing ? 'UPDATE' : 'CREATE', module: 'Users', details: `${editing ? 'Updated' : 'Created'} user ${data.username}`, timestamp: now });
    setSaving(false); setModalOpen(false); load();
  };

  const roleInfo = (role: UserRole) => ROLES.find(r => r.value === role)!;

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Lock size={48} className="text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-600">Access Restricted</h2>
        <p className="text-sm text-gray-400 mt-1">Only administrators can manage user accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} system users</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.map(r => (
          <div key={r.value} className="gov-card text-center">
            <div className="text-2xl font-bold text-ap-blue">{users.filter(u => u.role === r.value).length}</div>
            <div className="text-xs text-gray-500 mt-1">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="gov-card">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="gov-input pl-9 py-2" placeholder="Name, username, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="gov-input py-2 min-w-44" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card p-0">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Designation</th>
                <th>District</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="loading-spinner mx-auto" /></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <Users size={40} className="mx-auto mb-2 text-gray-200" />No users found
                </td></tr>
              ) : pageData.map(u => {
                const ri = roleInfo(u.role);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ap-blue/10 flex items-center justify-center text-ap-blue font-bold text-sm flex-shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{u.username}</td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ri.color}`}>{ri.label}</span></td>
                    <td className="text-sm">{u.designation}</td>
                    <td>{u.district}</td>
                    <td className="text-sm">
                      <div>{u.mobile}</div>
                      <div className="text-gray-400 text-xs">{u.email}</div>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Edit size={14} /></button>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit User — ${editing.fullName}` : 'Add New User'} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}</button>
          </div>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}>
          {!editing && (
            <div>
              <label className="label-text">Username *</label>
              <input {...register('username')} className="gov-input" placeholder="login username" />
              {errors.username && <p className="err-text">{errors.username.message}</p>}
            </div>
          )}
          <div className={editing ? 'md:col-span-2' : ''}>
            <label className="label-text">Full Name *</label>
            <input {...register('fullName')} className="gov-input" />
            {errors.fullName && <p className="err-text">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="label-text">Designation *</label>
            <input {...register('designation')} className="gov-input" placeholder="e.g. Tahsildar" />
            {errors.designation && <p className="err-text">{errors.designation.message}</p>}
          </div>
          <div>
            <label className="label-text">Role *</label>
            <select {...register('role')} className="gov-input">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Email *</label>
            <input {...register('email')} type="email" className="gov-input" />
            {errors.email && <p className="err-text">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label-text">Mobile *</label>
            <input {...register('mobile')} className="gov-input" maxLength={10} placeholder="10 digits" />
            {errors.mobile && <p className="err-text">{errors.mobile.message}</p>}
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
            <label className="label-text">Mandal</label>
            <input {...register('mandal')} className="gov-input" />
          </div>
          <div>
            <label className="label-text">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input {...register('password')} type="password" className="gov-input" placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} />
            {errors.password && <p className="err-text">{errors.password.message}</p>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input {...register('isActive')} type="checkbox" id="userActive" className="w-4 h-4" />
            <label htmlFor="userActive" className="text-sm text-gray-700">Account is Active</label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
