// ============================================================
// AP Revenue ICAMS - IndexedDB Service
// ============================================================

import { openDB, IDBPDatabase } from 'idb';
import { Citizen, LandRecord, HouseProperty, Vehicle, RationCard, AuditLog, User } from '../types';
import {
  CITIZENS_DATA, LAND_RECORDS_DATA, HOUSE_PROPERTIES_DATA,
  VEHICLES_DATA, RATION_CARDS_DATA, DEMO_USERS, DEMO_AUDIT_LOGS
} from '../data/mockData';

const DB_NAME = 'AP_REVENUE_ICAMS';
const DB_VERSION = 1;

type DBSchema = {
  citizens: { key: string; value: Citizen; indexes: { 'by-aadhaar': string; 'by-district': string } };
  lands: { key: string; value: LandRecord; indexes: { 'by-citizen': string; 'by-aadhaar': string } };
  properties: { key: string; value: HouseProperty; indexes: { 'by-citizen': string; 'by-aadhaar': string } };
  vehicles: { key: string; value: Vehicle; indexes: { 'by-citizen': string; 'by-aadhaar': string; 'by-type': string } };
  ration_cards: { key: string; value: RationCard; indexes: { 'by-citizen': string; 'by-aadhaar': string } };
  users: { key: string; value: User; indexes: { 'by-userid': string } };
  audit_logs: { key: string; value: AuditLog };
};

let dbInstance: IDBPDatabase<DBSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<DBSchema>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Citizens
      if (!db.objectStoreNames.contains('citizens')) {
        const citizenStore = db.createObjectStore('citizens', { keyPath: 'id' });
        citizenStore.createIndex('by-aadhaar', 'aadhaarNumber', { unique: true });
        citizenStore.createIndex('by-district', 'address.district', { unique: false });
      }
      // Lands
      if (!db.objectStoreNames.contains('lands')) {
        const landStore = db.createObjectStore('lands', { keyPath: 'id' });
        landStore.createIndex('by-citizen', 'citizenId', { unique: false });
        landStore.createIndex('by-aadhaar', 'aadhaarNumber', { unique: false });
      }
      // Properties
      if (!db.objectStoreNames.contains('properties')) {
        const propStore = db.createObjectStore('properties', { keyPath: 'id' });
        propStore.createIndex('by-citizen', 'citizenId', { unique: false });
        propStore.createIndex('by-aadhaar', 'aadhaarNumber', { unique: false });
      }
      // Vehicles
      if (!db.objectStoreNames.contains('vehicles')) {
        const vehStore = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehStore.createIndex('by-citizen', 'citizenId', { unique: false });
        vehStore.createIndex('by-aadhaar', 'aadhaarNumber', { unique: false });
        vehStore.createIndex('by-type', 'vehicleType', { unique: false });
      }
      // Ration Cards
      if (!db.objectStoreNames.contains('ration_cards')) {
        const rcStore = db.createObjectStore('ration_cards', { keyPath: 'id' });
        rcStore.createIndex('by-citizen', 'citizenId', { unique: false });
        rcStore.createIndex('by-aadhaar', 'aadhaarNumber', { unique: false });
      }
      // Users
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-userid', 'userId', { unique: true });
      }
      // Audit Logs
      if (!db.objectStoreNames.contains('audit_logs')) {
        db.createObjectStore('audit_logs', { keyPath: 'id' });
      }
    }
  });
  return dbInstance;
}

// Seed database with demo data
let seeded = false;
export async function seedDatabase(): Promise<void> {
  if (seeded) return;
  const db = await getDB();
  const existingCount = await db.count('citizens');
  if (existingCount > 0) { seeded = true; return; }

  const tx = db.transaction(['citizens', 'lands', 'properties', 'vehicles', 'ration_cards', 'users', 'audit_logs'], 'readwrite');
  
  for (const c of CITIZENS_DATA) await tx.objectStore('citizens').put(c);
  for (const l of LAND_RECORDS_DATA) await tx.objectStore('lands').put(l);
  for (const p of HOUSE_PROPERTIES_DATA) await tx.objectStore('properties').put(p);
  for (const v of VEHICLES_DATA) await tx.objectStore('vehicles').put(v);
  for (const r of RATION_CARDS_DATA) await tx.objectStore('ration_cards').put(r);
  for (const u of DEMO_USERS) await tx.objectStore('users').put(u);
  for (const a of DEMO_AUDIT_LOGS) await tx.objectStore('audit_logs').put(a);

  await tx.done;
  seeded = true;
}

// ---- Citizens CRUD ----
export const citizenDB = {
  async getAll(): Promise<Citizen[]> {
    const db = await getDB();
    return db.getAll('citizens');
  },
  async getById(id: string): Promise<Citizen | undefined> {
    const db = await getDB();
    return db.get('citizens', id);
  },
  async getByAadhaar(aadhaar: string): Promise<Citizen | undefined> {
    const db = await getDB();
    return db.getFromIndex('citizens', 'by-aadhaar', aadhaar);
  },
  async create(citizen: Citizen): Promise<string> {
    const db = await getDB();
    await db.put('citizens', citizen);
    return citizen.id;
  },
  async update(citizen: Citizen): Promise<void> {
    const db = await getDB();
    await db.put('citizens', citizen);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('citizens', id);
  },
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('citizens');
  },
};

// ---- Lands CRUD ----
export const landDB = {
  async getAll(): Promise<LandRecord[]> {
    const db = await getDB();
    return db.getAll('lands');
  },
  async getById(id: string): Promise<LandRecord | undefined> {
    const db = await getDB();
    return db.get('lands', id);
  },
  async getByCitizenId(citizenId: string): Promise<LandRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('lands', 'by-citizen', citizenId);
  },
  async getByAadhaar(aadhaar: string): Promise<LandRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('lands', 'by-aadhaar', aadhaar);
  },
  async create(land: LandRecord): Promise<string> {
    const db = await getDB();
    await db.put('lands', land);
    return land.id;
  },
  async update(land: LandRecord): Promise<void> {
    const db = await getDB();
    await db.put('lands', land);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('lands', id);
  },
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('lands');
  },
};

// ---- Properties CRUD ----
export const propertyDB = {
  async getAll(): Promise<HouseProperty[]> {
    const db = await getDB();
    return db.getAll('properties');
  },
  async getById(id: string): Promise<HouseProperty | undefined> {
    const db = await getDB();
    return db.get('properties', id);
  },
  async getByCitizenId(citizenId: string): Promise<HouseProperty[]> {
    const db = await getDB();
    return db.getAllFromIndex('properties', 'by-citizen', citizenId);
  },
  async getByAadhaar(aadhaar: string): Promise<HouseProperty[]> {
    const db = await getDB();
    return db.getAllFromIndex('properties', 'by-aadhaar', aadhaar);
  },
  async create(prop: HouseProperty): Promise<string> {
    const db = await getDB();
    await db.put('properties', prop);
    return prop.id;
  },
  async update(prop: HouseProperty): Promise<void> {
    const db = await getDB();
    await db.put('properties', prop);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('properties', id);
  },
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('properties');
  },
};

// ---- Vehicles CRUD ----
export const vehicleDB = {
  async getAll(): Promise<Vehicle[]> {
    const db = await getDB();
    return db.getAll('vehicles');
  },
  async getById(id: string): Promise<Vehicle | undefined> {
    const db = await getDB();
    return db.get('vehicles', id);
  },
  async getByCitizenId(citizenId: string): Promise<Vehicle[]> {
    const db = await getDB();
    return db.getAllFromIndex('vehicles', 'by-citizen', citizenId);
  },
  async getByAadhaar(aadhaar: string): Promise<Vehicle[]> {
    const db = await getDB();
    return db.getAllFromIndex('vehicles', 'by-aadhaar', aadhaar);
  },
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('vehicles');
  },
  async create(vehicle: Vehicle): Promise<string> {
    const db = await getDB();
    await db.put('vehicles', vehicle);
    return vehicle.id;
  },
  async update(vehicle: Vehicle): Promise<void> {
    const db = await getDB();
    await db.put('vehicles', vehicle);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('vehicles', id);
  },
};

// ---- Ration Cards CRUD ----
export const rationCardDB = {
  async getAll(): Promise<RationCard[]> {
    const db = await getDB();
    return db.getAll('ration_cards');
  },
  async getById(id: string): Promise<RationCard | undefined> {
    const db = await getDB();
    return db.get('ration_cards', id);
  },
  async getByCitizenId(citizenId: string): Promise<RationCard[]> {
    const db = await getDB();
    return db.getAllFromIndex('ration_cards', 'by-citizen', citizenId);
  },
  async getByAadhaar(aadhaar: string): Promise<RationCard[]> {
    const db = await getDB();
    return db.getAllFromIndex('ration_cards', 'by-aadhaar', aadhaar);
  },
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('ration_cards');
  },
  async create(rc: RationCard): Promise<string> {
    const db = await getDB();
    await db.put('ration_cards', rc);
    return rc.id;
  },
  async update(rc: RationCard): Promise<void> {
    const db = await getDB();
    await db.put('ration_cards', rc);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('ration_cards', id);
  },
};

// ---- Users ----
export const userDB = {
  async getAll(): Promise<User[]> {
    const db = await getDB();
    return db.getAll('users');
  },
  async getByUserId(userId: string): Promise<User | undefined> {
    const db = await getDB();
    return db.getFromIndex('users', 'by-userid', userId);
  },
  async getByUsername(username: string): Promise<User | undefined> {
    const users = await userDB.getAll();
    return users.find(u => u.username === username);
  },
  async create(user: User): Promise<void> {
    const db = await getDB();
    await db.put('users', user);
  },
  async update(user: User): Promise<void> {
    const db = await getDB();
    await db.put('users', user);
  },
};

// ---- Audit Logs ----
export const auditDB = {
  async getAll(): Promise<AuditLog[]> {
    const db = await getDB();
    const logs = await db.getAll('audit_logs');
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async getRecent(limit: number = 10): Promise<AuditLog[]> {
    const logs = await auditDB.getAll();
    return logs.slice(0, limit);
  },
  async add(log: AuditLog): Promise<void> {
    const db = await getDB();
    await db.put('audit_logs', log);
  },
};
