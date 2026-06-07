import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Phone, Mail, Map, Home, Car, ShoppingBag, Shield } from 'lucide-react';
import { Citizen, LandRecord, HouseProperty, Vehicle, RationCard } from '../types';
import { citizenDB, landDB, propertyDB, vehicleDB, rationCardDB } from '../services/dbService';

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }> = ({
  title, icon, children, count
}) => (
  <div className="gov-card">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-ap-blue">{icon}</span>
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      {count !== undefined && (
        <span className="bg-ap-blue text-white text-xs font-bold px-2.5 py-1 rounded-full">{count}</span>
      )}
    </div>
    {children}
  </div>
);

const DataRow: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{value ?? '—'}</span>
  </div>
);

const CitizenDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [properties, setProperties] = useState<HouseProperty[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rationCard, setRationCard] = useState<RationCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [c, ls, ps, vs, rcs] = await Promise.all([
        citizenDB.getById(id),
        landDB.getByCitizenId(id),
        propertyDB.getByCitizenId(id),
        vehicleDB.getByCitizenId(id),
        rationCardDB.getByCitizenId(id),
      ]);
      setCitizen(c || null);
      setLands(ls);
      setProperties(ps);
      setVehicles(vs);
      setRationCard(rcs[0] || null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-10 h-10" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="text-center py-16">
        <User size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Citizen not found.</p>
        <button onClick={() => navigate('/citizens')} className="btn-primary mt-4">Back to Citizens</button>
      </div>
    );
  }

  const totalAssetValue =
    lands.reduce((s, l) => s + l.marketValue, 0) +
    properties.reduce((s, p) => s + p.marketValue, 0) +
    vehicles.reduce((s, v) => s + (v.marketValue || 0), 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fullName = `${citizen.firstName} ${citizen.lastName}`;
  const addr = citizen.address;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/citizens')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{fullName}</h1>
          <p className="text-sm text-gray-500">Citizen Asset Profile</p>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="gov-card bg-gradient-to-r from-ap-blue to-blue-800 text-white">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold">{fullName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">{fullName}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{citizen.fatherHusbandName ? `S/D/W of ${citizen.fatherHusbandName}` : ''}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-100">
              {citizen.mobile && <span className="flex items-center gap-1.5"><Phone size={13} />{citizen.mobile}</span>}
              {citizen.email && <span className="flex items-center gap-1.5"><Mail size={13} />{citizen.email}</span>}
              <span className="flex items-center gap-1.5"><MapPin size={13} />{addr.district}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            {[['Land Records', lands.length], ['Properties', properties.length], ['Vehicles', vehicles.length]].map(([l, v]) => (
              <div key={l as string}>
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-xs text-blue-200 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-blue-200 text-sm">Estimated Total Asset Value</span>
          <span className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SectionCard title="Personal Information" icon={<User size={18} />}>
            <DataRow label="Aadhaar No." value={citizen.aadhaarNumber} />
            <DataRow label="Date of Birth" value={citizen.dateOfBirth} />
            <DataRow label="Gender" value={citizen.gender} />
            <DataRow label="Caste" value={citizen.caste} />
            <DataRow label="Religion" value={citizen.religion} />
            <DataRow label="Annual Income" value={citizen.annualIncome ? formatCurrency(citizen.annualIncome) : undefined} />
          </SectionCard>

          <SectionCard title="Address" icon={<MapPin size={18} />}>
            <DataRow label="Door No." value={addr.doorNo} />
            <DataRow label="Street" value={addr.street} />
            <DataRow label="Village" value={addr.village} />
            <DataRow label="Mandal" value={addr.mandal} />
            <DataRow label="District" value={addr.district} />
            <DataRow label="Pincode" value={addr.pincode} />
          </SectionCard>

          <SectionCard title="Ration Card" icon={<ShoppingBag size={18} />}>
            {rationCard ? (
              <>
                <DataRow label="Card No." value={rationCard.cardNumber} />
                <DataRow label="Type" value={rationCard.cardType} />
                <DataRow label="Family Size" value={rationCard.familySize} />
                <DataRow label="Head of Family" value={rationCard.headOfFamily} />
                <DataRow label="Status" value={rationCard.isActive ? 'Active' : 'Inactive'} />
                <DataRow label="Rice Entitlement" value={rationCard.monthlyEntitlement?.rice ? `${rationCard.monthlyEntitlement.rice} kg/month` : undefined} />
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No ration card linked</p>
            )}
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Land Records */}
          <SectionCard title="Land Records" icon={<Map size={18} />} count={lands.length}>
            {lands.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No land records found</p>
            ) : (
              <div className="space-y-3">
                {lands.map((land) => (
                  <div key={land.id} className="border border-gray-200 rounded-lg p-3 hover:border-ap-blue/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">Survey: {land.surveyNumber}</span>
                        <span className="text-xs text-gray-500 ml-2">— {land.village}, {land.mandal}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        land.encumbranceStatus === 'Clear' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{land.encumbranceStatus}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-400">Area</span><br /><span className="font-medium">{land.extentInAcres} acres</span></div>
                      <div><span className="text-gray-400">Land Type</span><br /><span className="font-medium">{land.landType}</span></div>
                      <div><span className="text-gray-400">Market Value</span><br /><span className="font-medium">{formatCurrency(land.marketValue)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Properties */}
          <SectionCard title="House Properties" icon={<Home size={18} />} count={properties.length}>
            {properties.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No house properties found</p>
            ) : (
              <div className="space-y-3">
                {properties.map((prop) => (
                  <div key={prop.id} className="border border-gray-200 rounded-lg p-3 hover:border-ap-blue/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{prop.doorNo}, {prop.street}</span>
                        <span className="text-xs text-gray-500 ml-2">{prop.village}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">{prop.propertyType}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-400">Built-up Area</span><br /><span className="font-medium">{prop.builtUpArea} sq ft</span></div>
                      <div><span className="text-gray-400">Floors</span><br /><span className="font-medium">{prop.floors}</span></div>
                      <div><span className="text-gray-400">Market Value</span><br /><span className="font-medium">{formatCurrency(prop.marketValue)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Vehicles */}
          <SectionCard title="Vehicles" icon={<Car size={18} />} count={vehicles.length}>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No vehicles found</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="border border-gray-200 rounded-lg p-3 hover:border-ap-blue/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{v.registrationNumber}</span>
                        <span className="text-xs text-gray-500 ml-2">{v.make} {v.model} ({v.year})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        v.vehicleType === 'Four Wheeler' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                      }`}>{v.vehicleType}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-400">Color</span><br /><span className="font-medium">{v.color}</span></div>
                      <div><span className="text-gray-400">Fuel</span><br /><span className="font-medium">{v.fuelType}</span></div>
                      <div><span className="text-gray-400">Market Value</span><br /><span className="font-medium">{v.marketValue ? formatCurrency(v.marketValue) : '—'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Record Metadata */}
      <div className="gov-card">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-ap-blue" />
          <span className="font-semibold text-gray-700 text-sm">Record Metadata</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-400 block text-xs">Record ID</span><span className="font-mono text-gray-700 text-xs">{citizen.id.slice(0, 12)}...</span></div>
          <div><span className="text-gray-400 block text-xs">Created At</span><span className="text-gray-700 text-xs">{new Date(citizen.createdAt).toLocaleDateString('en-IN')}</span></div>
          <div><span className="text-gray-400 block text-xs">Last Updated</span><span className="text-gray-700 text-xs">{new Date(citizen.updatedAt).toLocaleDateString('en-IN')}</span></div>
          <div><span className="text-gray-400 block text-xs">Status</span><span className={`text-xs font-medium ${citizen.isActive ? 'text-green-600' : 'text-red-500'}`}>{citizen.isActive ? '● Active' : '● Inactive'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDetailPage;
