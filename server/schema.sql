-- ============================================================
-- AP Revenue ICAMS - PostgreSQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  designation VARCHAR(200),
  district VARCHAR(100),
  mandal VARCHAR(100),
  email VARCHAR(200),
  mobile VARCHAR(15),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citizens (
  id VARCHAR(20) PRIMARY KEY,
  aadhaar_number CHAR(12) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  father_husband_name VARCHAR(200),
  date_of_birth DATE,
  gender VARCHAR(10),
  mobile VARCHAR(15),
  email VARCHAR(200),
  door_no VARCHAR(50),
  street VARCHAR(200),
  village VARCHAR(100),
  mandal VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  caste VARCHAR(20),
  religion VARCHAR(50),
  annual_income NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_records (
  id VARCHAR(20) PRIMARY KEY,
  citizen_id VARCHAR(20) REFERENCES citizens(id) ON DELETE CASCADE,
  aadhaar_number CHAR(12),
  survey_number VARCHAR(50),
  sub_division VARCHAR(50),
  village VARCHAR(100),
  mandal VARCHAR(100),
  district VARCHAR(100),
  land_type VARCHAR(50),
  extent_in_acres NUMERIC,
  market_value NUMERIC,
  patta_number VARCHAR(100),
  registration_number VARCHAR(100),
  registration_date DATE,
  ownership_type VARCHAR(50),
  encumbrance_status VARCHAR(50),
  remarks TEXT,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS house_properties (
  id VARCHAR(20) PRIMARY KEY,
  citizen_id VARCHAR(20) REFERENCES citizens(id) ON DELETE CASCADE,
  aadhaar_number CHAR(12),
  property_id VARCHAR(100),
  door_no VARCHAR(50),
  street VARCHAR(200),
  village VARCHAR(100),
  mandal VARCHAR(100),
  district VARCHAR(100),
  property_type VARCHAR(50),
  built_up_area NUMERIC,
  plot_area NUMERIC,
  floors INTEGER,
  construction_year INTEGER,
  market_value NUMERIC,
  annual_rental_value NUMERIC,
  registration_number VARCHAR(100),
  registration_date DATE,
  encumbrance_status VARCHAR(50),
  remarks TEXT,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(20) PRIMARY KEY,
  citizen_id VARCHAR(20) REFERENCES citizens(id) ON DELETE CASCADE,
  aadhaar_number CHAR(12),
  vehicle_type VARCHAR(20),
  registration_number VARCHAR(50),
  make VARCHAR(100),
  model VARCHAR(100),
  variant VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  engine_number VARCHAR(100),
  chassis_number VARCHAR(100),
  fuel_type VARCHAR(20),
  seating_capacity INTEGER,
  insurance_number VARCHAR(100),
  insurance_expiry DATE,
  pollution_cert_expiry DATE,
  fitness_expiry DATE,
  tax_valid_till DATE,
  market_value NUMERIC,
  remarks TEXT,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ration_cards (
  id VARCHAR(20) PRIMARY KEY,
  citizen_id VARCHAR(20) REFERENCES citizens(id) ON DELETE CASCADE,
  aadhaar_number CHAR(12),
  card_number VARCHAR(100),
  card_type VARCHAR(10),
  issued_date DATE,
  expiry_date DATE,
  family_size INTEGER,
  head_of_family VARCHAR(200),
  shop VARCHAR(200),
  shop_code VARCHAR(50),
  rice_entitlement NUMERIC,
  wheat_entitlement NUMERIC,
  sugar_entitlement NUMERIC,
  kerosene_entitlement NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  remarks TEXT,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(50),
  user_name VARCHAR(200),
  action VARCHAR(50),
  module VARCHAR(100),
  entity_id VARCHAR(100),
  entity_type VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_citizens_district ON citizens(district);
CREATE INDEX IF NOT EXISTS idx_land_citizen ON land_records(citizen_id);
CREATE INDEX IF NOT EXISTS idx_land_aadhaar ON land_records(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_prop_citizen ON house_properties(citizen_id);
CREATE INDEX IF NOT EXISTS idx_prop_aadhaar ON house_properties(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_veh_citizen ON vehicles(citizen_id);
CREATE INDEX IF NOT EXISTS idx_veh_aadhaar ON vehicles(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_veh_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_rc_citizen ON ration_cards(citizen_id);
CREATE INDEX IF NOT EXISTS idx_rc_aadhaar ON ration_cards(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
