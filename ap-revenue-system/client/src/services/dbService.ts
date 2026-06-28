// ============================================================
// AP Revenue ICAMS - API-based Data Service (PostgreSQL backend)
// ============================================================

import { Citizen, LandRecord, HouseProperty, Vehicle, RationCard, AuditLog, User } from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// No-op: database is seeded by the backend on startup
export async function seedDatabase(): Promise<void> {
  return;
}

// ---- Citizens ----
export const citizenDB = {
  async getAll(): Promise<Citizen[]> {
    return get<Citizen[]>('/citizens');
  },
  async getById(id: string): Promise<Citizen | undefined> {
    try { return await get<Citizen>(`/citizens/${id}`); } catch { return undefined; }
  },
  async getByAadhaar(aadhaar: string): Promise<Citizen | undefined> {
    try { return await get<Citizen>(`/citizens/aadhaar/${aadhaar}`); } catch { return undefined; }
  },
  async create(citizen: Citizen): Promise<string> {
    await post('/citizens', citizen);
    return citizen.id;
  },
  async update(citizen: Citizen): Promise<void> {
    await put(`/citizens/${citizen.id}`, citizen);
  },
  async delete(id: string): Promise<void> {
    await del(`/citizens/${id}`);
  },
  async count(): Promise<number> {
    const data = await get<{ count: number }>('/citizens/count');
    return data.count;
  },
};

// ---- Land Records ----
export const landDB = {
  async getAll(): Promise<LandRecord[]> {
    return get<LandRecord[]>('/lands');
  },
  async getById(id: string): Promise<LandRecord | undefined> {
    try { return await get<LandRecord>(`/lands/${id}`); } catch { return undefined; }
  },
  async getByCitizenId(citizenId: string): Promise<LandRecord[]> {
    return get<LandRecord[]>(`/lands/citizen/${citizenId}`);
  },
  async getByAadhaar(aadhaar: string): Promise<LandRecord[]> {
    return get<LandRecord[]>(`/lands/aadhaar/${aadhaar}`);
  },
  async create(land: LandRecord): Promise<string> {
    await post('/lands', land);
    return land.id;
  },
  async update(land: LandRecord): Promise<void> {
    await put(`/lands/${land.id}`, land);
  },
  async delete(id: string): Promise<void> {
    await del(`/lands/${id}`);
  },
  async count(): Promise<number> {
    const data = await get<{ count: number }>('/lands/count');
    return data.count;
  },
};

// ---- House Properties ----
export const propertyDB = {
  async getAll(): Promise<HouseProperty[]> {
    return get<HouseProperty[]>('/properties');
  },
  async getById(id: string): Promise<HouseProperty | undefined> {
    try { return await get<HouseProperty>(`/properties/${id}`); } catch { return undefined; }
  },
  async getByCitizenId(citizenId: string): Promise<HouseProperty[]> {
    return get<HouseProperty[]>(`/properties/citizen/${citizenId}`);
  },
  async getByAadhaar(aadhaar: string): Promise<HouseProperty[]> {
    return get<HouseProperty[]>(`/properties/aadhaar/${aadhaar}`);
  },
  async create(prop: HouseProperty): Promise<string> {
    await post('/properties', prop);
    return prop.id;
  },
  async update(prop: HouseProperty): Promise<void> {
    await put(`/properties/${prop.id}`, prop);
  },
  async delete(id: string): Promise<void> {
    await del(`/properties/${id}`);
  },
  async count(): Promise<number> {
    const data = await get<{ count: number }>('/properties/count');
    return data.count;
  },
};

// ---- Vehicles ----
export const vehicleDB = {
  async getAll(): Promise<Vehicle[]> {
    return get<Vehicle[]>('/vehicles');
  },
  async getById(id: string): Promise<Vehicle | undefined> {
    try { return await get<Vehicle>(`/vehicles/${id}`); } catch { return undefined; }
  },
  async getByCitizenId(citizenId: string): Promise<Vehicle[]> {
    return get<Vehicle[]>(`/vehicles/citizen/${citizenId}`);
  },
  async getByAadhaar(aadhaar: string): Promise<Vehicle[]> {
    return get<Vehicle[]>(`/vehicles/aadhaar/${aadhaar}`);
  },
  async count(): Promise<number> {
    const data = await get<{ count: number }>('/vehicles/count');
    return data.count;
  },
  async create(vehicle: Vehicle): Promise<string> {
    await post('/vehicles', vehicle);
    return vehicle.id;
  },
  async update(vehicle: Vehicle): Promise<void> {
    await put(`/vehicles/${vehicle.id}`, vehicle);
  },
  async delete(id: string): Promise<void> {
    await del(`/vehicles/${id}`);
  },
};

// ---- Ration Cards ----
export const rationCardDB = {
  async getAll(): Promise<RationCard[]> {
    return get<RationCard[]>('/ration-cards');
  },
  async getById(id: string): Promise<RationCard | undefined> {
    try { return await get<RationCard>(`/ration-cards/${id}`); } catch { return undefined; }
  },
  async getByCitizenId(citizenId: string): Promise<RationCard[]> {
    return get<RationCard[]>(`/ration-cards/citizen/${citizenId}`);
  },
  async getByAadhaar(aadhaar: string): Promise<RationCard[]> {
    return get<RationCard[]>(`/ration-cards/aadhaar/${aadhaar}`);
  },
  async count(): Promise<number> {
    const data = await get<{ count: number }>('/ration-cards/count');
    return data.count;
  },
  async create(rc: RationCard): Promise<string> {
    await post('/ration-cards', rc);
    return rc.id;
  },
  async update(rc: RationCard): Promise<void> {
    await put(`/ration-cards/${rc.id}`, rc);
  },
  async delete(id: string): Promise<void> {
    await del(`/ration-cards/${id}`);
  },
};

// ---- Users ----
export const userDB = {
  async getAll(): Promise<User[]> {
    return get<User[]>('/users');
  },
  async getByUserId(userId: string): Promise<User | undefined> {
    try { return await get<User>(`/users/userid/${userId}`); } catch { return undefined; }
  },
  async getByUsername(username: string): Promise<User | undefined> {
    try {
      const users = await userDB.getAll();
      return users.find(u => u.username === username || u.userId === username);
    } catch { return undefined; }
  },
  async create(user: User): Promise<void> {
    await post('/users', user);
  },
  async update(user: User): Promise<void> {
    await put(`/users/${user.id}`, user);
  },
};

// ---- Audit Logs ----
export const auditDB = {
  async getAll(): Promise<AuditLog[]> {
    return get<AuditLog[]>('/audit-logs');
  },
  async getRecent(limit: number = 10): Promise<AuditLog[]> {
    return get<AuditLog[]>(`/audit-logs/recent?limit=${limit}`);
  },
  async add(log: AuditLog): Promise<void> {
    await post('/audit-logs', log);
  },
};
