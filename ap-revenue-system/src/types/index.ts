// ============================================================
// AP Revenue ICAMS - Core Type Definitions
// ============================================================

export type UserRole = 'administrator' | 'revenue_officer' | 'data_entry_operator' | 'read_only_officer';

export interface User {
  id: string;
  userId: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  designation: string;
  district: string;
  mandal: string;
  email: string;
  mobile: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  userRef: string;
  role: UserRole;
  token: string;
  expiresAt: number;
  loginTime: string;
}

export interface Citizen {
  id: string;
  aadhaarNumber: string;
  firstName: string;
  lastName: string;
  fatherHusbandName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email?: string;
  address: {
    doorNo: string;
    street: string;
    village: string;
    mandal: string;
    district: string;
    state: string;
    pincode: string;
  };
  caste?: string;
  religion?: string;
  annualIncome?: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandRecord {
  id: string;
  citizenId: string;
  aadhaarNumber: string;
  surveyNumber: string;
  subDivision?: string;
  village: string;
  mandal: string;
  district: string;
  landType: 'Agriculture' | 'Commercial' | 'Residential' | 'Industrial' | 'Forest' | 'Government';
  extentInAcres: number;
  marketValue: number;
  pattaNumber?: string;
  registrationNumber?: string;
  registrationDate?: string;
  ownershipType: 'Owned' | 'Inherited' | 'Purchased' | 'Gift';
  encumbranceStatus: 'Clear' | 'Mortgaged' | 'Disputed' | 'Court Order';
  remarks?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseProperty {
  id: string;
  citizenId: string;
  aadhaarNumber: string;
  propertyId: string;
  doorNo: string;
  street: string;
  village: string;
  mandal: string;
  district: string;
  propertyType: 'Independent House' | 'Flat' | 'Commercial' | 'Apartment' | 'Villa' | 'Row House';
  builtUpArea: number;
  plotArea?: number;
  floors: number;
  constructionYear?: number;
  marketValue: number;
  annualRentalValue?: number;
  registrationNumber?: string;
  registrationDate?: string;
  encumbranceStatus: 'Clear' | 'Mortgaged' | 'Disputed' | 'Court Order';
  remarks?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  citizenId: string;
  aadhaarNumber: string;
  vehicleType: 'Two Wheeler' | 'Four Wheeler';
  registrationNumber: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'LPG' | 'Hybrid';
  seatingCapacity?: number;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  pollutionCertExpiry?: string;
  fitnessExpiry?: string;
  taxValidTill?: string;
  marketValue?: number;
  remarks?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RationCard {
  id: string;
  citizenId: string;
  aadhaarNumber: string;
  cardNumber: string;
  cardType: 'AAY' | 'PHH' | 'NPHH' | 'APL' | 'BPL';
  issuedDate: string;
  expiryDate?: string;
  familySize: number;
  headOfFamily: string;
  shop: string;
  shopCode: string;
  monthlyEntitlement?: {
    rice?: number;
    wheat?: number;
    sugar?: number;
    kerosene?: number;
  };
  isActive: boolean;
  remarks?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalCitizens: number;
  totalLands: number;
  totalProperties: number;
  totalVehicles: number;
  totalRationCards: number;
  recentActivity: AuditLog[];
  districtWiseCitizens: { district: string; count: number }[];
  landTypeDistribution: { type: string; count: number }[];
  vehicleTypeDistribution: { type: string; count: number }[];
}

export interface SearchResult {
  type: 'citizen' | 'land' | 'property' | 'vehicle' | 'ration_card';
  data: Citizen | LandRecord | HouseProperty | Vehicle | RationCard;
  score?: number;
}

export interface NLPSearchQuery {
  originalQuery: string;
  intent: 'find_citizen' | 'find_lands' | 'find_properties' | 'find_vehicles' | 'find_ration_card' | 'find_all_assets' | 'unknown';
  aadhaarNumber?: string;
  name?: string;
  district?: string;
  extractedEntities: Record<string, string>;
}

export interface ReportConfig {
  type: 'citizen_summary' | 'land_ownership' | 'vehicle_report' | 'property_report' | 'ration_card_report' | 'complete_asset_report';
  filters?: {
    district?: string;
    mandal?: string;
    dateFrom?: string;
    dateTo?: string;
    aadhaarNumber?: string;
  };
  format: 'pdf' | 'excel';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Permission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  administrator: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
  },
  revenue_officer: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
  },
  data_entry_operator: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canExport: false,
    canManageUsers: false,
  },
  read_only_officer: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
  },
};
