import React from 'react';
import { User, Mail, Phone, MapPin, Shield, Calendar, Badge, Building2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { ROLE_PERMISSIONS } from '../types';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string | undefined }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-ap-blue/10 flex items-center justify-center text-ap-blue flex-shrink-0">{icon}</div>
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value || '—'}</div>
    </div>
  </div>
);

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrator',
  revenue_officer: 'Revenue Officer',
  data_entry_operator: 'Data Entry Operator',
  read_only_officer: 'Read Only Officer',
};

const ROLE_COLORS: Record<string, string> = {
  administrator: 'bg-red-100 text-red-700',
  revenue_officer: 'bg-blue-100 text-blue-700',
  data_entry_operator: 'bg-green-100 text-green-700',
  read_only_officer: 'bg-gray-100 text-gray-600',
};

const ProfilePage: React.FC = () => {
  const { currentUser } = useAppStore();

  if (!currentUser) return null;

  const permissions = ROLE_PERMISSIONS[currentUser.role];
  const permList = [
    { label: 'Create Records', allowed: permissions.canCreate },
    { label: 'View Records', allowed: permissions.canRead },
    { label: 'Update Records', allowed: permissions.canUpdate },
    { label: 'Delete Records', allowed: permissions.canDelete },
    { label: 'Export Data', allowed: permissions.canExport },
    { label: 'Manage Users', allowed: permissions.canManageUsers },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Hero */}
      <div className="gov-card bg-gradient-to-r from-ap-blue to-blue-800 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold">{currentUser.fullName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentUser.fullName}</h2>
            <p className="text-blue-200 mt-0.5">{currentUser.designation}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white`}>
                {ROLE_LABELS[currentUser.role]}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${currentUser.isActive ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
                {currentUser.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right text-blue-200 text-sm">
            <div className="text-xs mb-1">User ID</div>
            <div className="font-mono text-white text-xs">{currentUser.userId}</div>
            <div className="text-xs mt-2 mb-1">Last Login</div>
            <div className="text-white text-xs">{currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString('en-IN') : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="gov-card">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <User size={16} className="text-ap-blue" /> Personal Information
          </h3>
          <InfoRow icon={<Mail size={16} />} label="Email Address" value={currentUser.email} />
          <InfoRow icon={<Phone size={16} />} label="Mobile Number" value={currentUser.mobile} />
          <InfoRow icon={<MapPin size={16} />} label="District" value={currentUser.district} />
          <InfoRow icon={<Building2 size={16} />} label="Mandal" value={currentUser.mandal} />
          <InfoRow icon={<Badge size={16} />} label="Designation" value={currentUser.designation} />
          <InfoRow icon={<Calendar size={16} />} label="Account Created" value={new Date(currentUser.createdAt).toLocaleDateString('en-IN')} />
        </div>

        {/* Permissions */}
        <div className="gov-card">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-ap-blue" /> Access Permissions
          </h3>
          <div className="mb-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${ROLE_COLORS[currentUser.role]}`}>
              {ROLE_LABELS[currentUser.role]}
            </span>
          </div>
          <div className="space-y-2 mt-4">
            {permList.map(p => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{p.label}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.allowed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {p.allowed ? '✓ Allowed' : '✗ Not Allowed'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              To change your role or permissions, contact your system administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="gov-card">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Shield size={16} className="text-ap-blue" /> Security Settings
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <div className="text-sm font-medium text-gray-700">Password</div>
            <div className="text-xs text-gray-400 mt-0.5">Use the IT helpdesk to change your password</div>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">●●●●●●●●</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium text-gray-700">Session Timeout</div>
            <div className="text-xs text-gray-400 mt-0.5">Auto-logout after 30 minutes of inactivity</div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">30 min</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
