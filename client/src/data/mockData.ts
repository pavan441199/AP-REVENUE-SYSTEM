// ============================================================
// AP Revenue ICAMS - Synthetic Demo Data (100+ Citizens)
// All data is purely fictional and for demonstration only
// ============================================================

import { Citizen, LandRecord, HouseProperty, Vehicle, RationCard, User, AuditLog } from '../types';

const DISTRICTS = ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Kadapa', 'Kurnool', 'Anantapur', 'Chittoor', 'Srikakulam', 'Vizianagaram'];
const MANDALS: Record<string, string[]> = {
  'Visakhapatnam': ['Bheemunipatnam', 'Anakapalle', 'Sabbavaram', 'Narsipatnam'],
  'East Godavari': ['Rajahmundry Urban', 'Kakinada Urban', 'Amalapuram', 'Peddapuram'],
  'West Godavari': ['Eluru Urban', 'Bhimavaram Urban', 'Narsapur', 'Jangareddygudem'],
  'Krishna': ['Vijayawada Urban', 'Machilipatnam Urban', 'Nuzvid', 'Gudivada'],
  'Guntur': ['Guntur Urban', 'Narasaraopet', 'Tenali', 'Mangalagiri'],
  'Prakasam': ['Ongole Urban', 'Chirala', 'Kandukur', 'Giddalur'],
  'Nellore': ['Nellore Urban', 'Kavali', 'Gudur', 'Sullurpeta'],
  'Kadapa': ['Kadapa Urban', 'Proddatur Urban', 'Badvel', 'Rayachoti'],
  'Kurnool': ['Kurnool Urban', 'Adoni Urban', 'Nandyal Urban', 'Dhone'],
  'Anantapur': ['Anantapur Urban', 'Guntakal Urban', 'Hindupur', 'Tadipatri'],
  'Chittoor': ['Chittoor Urban', 'Tirupati Urban', 'Madanapalle', 'Nagari'],
  'Srikakulam': ['Srikakulam Urban', 'Narasannapeta', 'Palasa', 'Tekkali'],
  'Vizianagaram': ['Vizianagaram Urban', 'Bobbili', 'Parvathipuram', 'Salur'],
};

const FIRST_NAMES = ['Venkata', 'Srinivasa', 'Rama', 'Krishna', 'Lakshmi', 'Sarada', 'Padmavathi', 'Suresh', 'Ramesh', 'Mahesh', 'Rajesh', 'Naresh', 'Ganesh', 'Sreedevi', 'Venkatalakshmi', 'Annapurna', 'Bhavani', 'Durga', 'Saraswathi', 'Tulasi', 'Chandra', 'Vijaya', 'Usha', 'Hymavathi', 'Jyothi', 'Kavitha', 'Nirmala', 'Parvathi', 'Radha', 'Savitri', 'Anuradha', 'Bharathi', 'Chaitanya', 'Deepika', 'Eswar', 'Farida', 'Geetha', 'Haritha', 'Indira', 'Jagadish', 'Kamala', 'Lavanya', 'Murali', 'Nagendra', 'Obul', 'Prasad', 'Ravi', 'Sai', 'Tirumala', 'Uma'];
const LAST_NAMES = ['Reddy', 'Naidu', 'Rao', 'Sharma', 'Varma', 'Raju', 'Babu', 'Kumar', 'Devi', 'Lakshmi', 'Prasad', 'Chowdary', 'Murthy', 'Nair', 'Pillai', 'Shetty', 'Goud', 'Yadav', 'Patel', 'Satyanarayana', 'Venkateswara', 'Subrahmanyam', 'Krishnamurthy', 'Anjaneyulu', 'Bhaskar', 'Chiranjeevi', 'Durgaprasa', 'Hanumantha'];

const VEHICLE_MAKES_2W = ['Hero', 'Honda', 'TVS', 'Bajaj', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM'];
const VEHICLE_MODELS_2W: Record<string, string[]> = {
  'Hero': ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xtreme 160R'],
  'Honda': ['Activa 6G', 'Shine', 'Unicorn', 'CB Hornet', 'SP 125'],
  'TVS': ['Apache RTR 160', 'Jupiter', 'Star City+', 'Ntorq', 'Raider 125'],
  'Bajaj': ['Pulsar 150', 'CT 100', 'Platina', 'Avenger 160', 'Dominar 400'],
  'Royal Enfield': ['Bullet 350', 'Classic 350', 'Meteor 350', 'Himalayan', 'Hunter 350'],
  'Yamaha': ['FZ-S', 'R15', 'MT-15', 'Fascino 125', 'Ray ZR'],
  'Suzuki': ['Access 125', 'Gixxer', 'Avenis', 'Intruder'],
  'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'Adventure 390'],
};

const VEHICLE_MAKES_4W = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'Renault'];
const VEHICLE_MODELS_4W: Record<string, string[]> = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Wagon R', 'Alto K10', 'Dzire', 'Ertiga', 'Brezza', 'Vitara'],
  'Hyundai': ['i20', 'Creta', 'Verna', 'Grand i10 Nios', 'Venue', 'Alcazar', 'Tucson'],
  'Tata': ['Nexon', 'Harrier', 'Safari', 'Punch', 'Tiago', 'Altroz', 'Tigor'],
  'Mahindra': ['Scorpio N', 'XUV700', 'Thar', 'Bolero', 'XUV300', 'Marazzo'],
  'Toyota': ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser', 'Camry'],
  'Honda': ['City', 'Amaze', 'Jazz', 'WR-V', 'BR-V', 'CR-V'],
  'Kia': ['Seltos', 'Sonet', 'Carnival', 'EV6'],
  'Renault': ['Kwid', 'Duster', 'Triber', 'Kiger'],
};

const COLORS = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey', 'Pearl White', 'Dark Grey', 'Bronze', 'Yellow', 'Orange', 'Green'];
const CASTES = ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST'];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];

function rng(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickRandom<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function generateAadhaar(seed: number): string {
  const r = rng(seed * 7 + 13);
  let num = '';
  for (let i = 0; i < 12; i++) num += Math.floor(r() * 10).toString();
  return num.startsWith('0') ? '2' + num.slice(1) : num;
}

function generateDate(startYear: number, endYear: number, r: () => number): string {
  const year = startYear + Math.floor(r() * (endYear - startYear));
  const month = 1 + Math.floor(r() * 12);
  const day = 1 + Math.floor(r() * 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function generateMobile(r: () => number): string {
  const prefixes = ['99', '98', '97', '96', '95', '94', '93', '92', '91', '90', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '70'];
  const prefix = prefixes[Math.floor(r() * prefixes.length)];
  let rest = '';
  for (let i = 0; i < 8; i++) rest += Math.floor(r() * 10).toString();
  return prefix + rest;
}

function generateRegNo(type: 'AP' | 'TS', r: () => number): string {
  const distCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
  const code = distCodes[Math.floor(r() * distCodes.length)];
  const series = String.fromCharCode(65 + Math.floor(r() * 26)) + String.fromCharCode(65 + Math.floor(r() * 26));
  const num = (1000 + Math.floor(r() * 8999)).toString();
  return `${type} ${code} ${series} ${num}`;
}

// ---- Generate 100 Citizens ----
export function generateCitizens(): Citizen[] {
  const citizens: Citizen[] = [];
  for (let i = 0; i < 110; i++) {
    const r = rng(i * 37 + 19);
    const district = DISTRICTS[Math.floor(r() * DISTRICTS.length)];
    const mandals = MANDALS[district] || ['Urban'];
    const mandal = mandals[Math.floor(r() * mandals.length)];
    const firstName = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
    const gender = r() > 0.5 ? 'Male' : r() > 0.3 ? 'Female' : 'Other';
    const dob = generateDate(1955, 2000, r);
    citizens.push({
      id: `CIT${(i + 1).toString().padStart(5, '0')}`,
      aadhaarNumber: generateAadhaar(i * 97 + 31),
      firstName,
      lastName,
      fatherHusbandName: FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)] + ' ' + LAST_NAMES[Math.floor(r() * LAST_NAMES.length)],
      dateOfBirth: dob,
      gender: gender as Citizen['gender'],
      mobile: generateMobile(r),
      email: r() > 0.6 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(r() * 99)}@gmail.com` : undefined,
      address: {
        doorNo: `${Math.floor(r() * 999) + 1}-${Math.floor(r() * 99) + 1}`,
        street: `${Math.floor(r() * 20) + 1}th Ward, ${mandal} Colony`,
        village: mandal,
        mandal,
        district,
        state: 'Andhra Pradesh',
        pincode: `5${(Math.floor(r() * 89999) + 10000).toString().slice(0, 5)}`,
      },
      caste: CASTES[Math.floor(r() * CASTES.length)],
      religion: RELIGIONS[Math.floor(r() * RELIGIONS.length)],
      annualIncome: Math.round((r() * 900000 + 50000) / 1000) * 1000,
      isActive: true,
      createdBy: 'admin001',
      updatedBy: 'admin001',
      createdAt: generateDate(2020, 2024, rng(i + 5)),
      updatedAt: generateDate(2023, 2024, rng(i + 8)),
    });
  }
  return citizens;
}

// ---- Generate Land Records ----
export function generateLandRecords(citizens: Citizen[]): LandRecord[] {
  const records: LandRecord[] = [];
  let idx = 0;
  citizens.forEach((c, ci) => {
    const r = rng(ci * 53 + 7);
    const count = r() > 0.3 ? Math.floor(r() * 3) + 1 : 0;
    for (let j = 0; j < count; j++) {
      const r2 = rng(ci * 100 + j * 17 + 3);
      const district = c.address.district;
      const mandals = MANDALS[district] || ['Urban'];
      records.push({
        id: `LND${(++idx).toString().padStart(5, '0')}`,
        citizenId: c.id,
        aadhaarNumber: c.aadhaarNumber,
        surveyNumber: `${Math.floor(r2() * 999) + 1}/${Math.floor(r2() * 99) + 1}`,
        subDivision: r2() > 0.5 ? `A${Math.floor(r2() * 5) + 1}` : undefined,
        village: mandals[Math.floor(r2() * mandals.length)],
        mandal: c.address.mandal,
        district,
        landType: (['Agriculture', 'Commercial', 'Residential', 'Industrial'] as const)[Math.floor(r2() * 4)],
        extentInAcres: Math.round(r2() * 10 * 100) / 100,
        marketValue: Math.round((r2() * 5000000 + 100000) / 1000) * 1000,
        pattaNumber: `PATTA/${district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 99999) + 10000)}`,
        registrationNumber: r2() > 0.6 ? `REG/${Math.floor(r2() * 9999) + 1000}/${2018 + Math.floor(r2() * 6)}` : undefined,
        registrationDate: r2() > 0.6 ? generateDate(2018, 2024, rng(ci + j + 2)) : undefined,
        ownershipType: (['Owned', 'Inherited', 'Purchased', 'Gift'] as const)[Math.floor(r2() * 4)],
        encumbranceStatus: (['Clear', 'Clear', 'Clear', 'Mortgaged', 'Disputed'] as const)[Math.floor(r2() * 5)],
        remarks: r2() > 0.8 ? 'Under mutation process' : undefined,
        createdBy: 'admin001',
        updatedBy: 'admin001',
        createdAt: generateDate(2020, 2024, rng(ci + j + 10)),
        updatedAt: generateDate(2023, 2024, rng(ci + j + 15)),
      });
    }
  });
  return records;
}

// ---- Generate House Properties ----
export function generateHouseProperties(citizens: Citizen[]): HouseProperty[] {
  const records: HouseProperty[] = [];
  let idx = 0;
  citizens.forEach((c, ci) => {
    const r = rng(ci * 61 + 11);
    const count = r() > 0.4 ? Math.floor(r() * 2) + 1 : 0;
    for (let j = 0; j < count; j++) {
      const r2 = rng(ci * 200 + j * 23 + 7);
      const types: HouseProperty['propertyType'][] = ['Independent House', 'Flat', 'Commercial', 'Apartment', 'Villa'];
      records.push({
        id: `PROP${(++idx).toString().padStart(5, '0')}`,
        citizenId: c.id,
        aadhaarNumber: c.aadhaarNumber,
        propertyId: `AP/PROP/${c.address.district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 99999) + 10000)}`,
        doorNo: `${Math.floor(r2() * 999) + 1}-${Math.floor(r2() * 9) + 1}`,
        street: `${['MG Road', 'Gandhi Nagar', 'KPHB Colony', 'Sainath Nagar', 'Sai Nagar', 'Rajiv Nagar'][Math.floor(r2() * 6)]}`,
        village: c.address.village,
        mandal: c.address.mandal,
        district: c.address.district,
        propertyType: types[Math.floor(r2() * types.length)],
        builtUpArea: Math.round(r2() * 2000 + 400),
        plotArea: r2() > 0.5 ? Math.round(r2() * 1000 + 100) : undefined,
        floors: Math.floor(r2() * 4) + 1,
        constructionYear: 1990 + Math.floor(r2() * 34),
        marketValue: Math.round((r2() * 8000000 + 500000) / 1000) * 1000,
        annualRentalValue: r2() > 0.5 ? Math.round((r2() * 200000 + 20000) / 1000) * 1000 : undefined,
        registrationNumber: r2() > 0.6 ? `PROP-REG/${Math.floor(r2() * 9999) + 1000}/${2018 + Math.floor(r2() * 6)}` : undefined,
        registrationDate: r2() > 0.6 ? generateDate(2018, 2024, rng(ci + j + 20)) : undefined,
        encumbranceStatus: (['Clear', 'Clear', 'Mortgaged', 'Disputed'] as const)[Math.floor(r2() * 4)],
        remarks: r2() > 0.85 ? 'Property tax pending' : undefined,
        createdBy: 'admin001',
        updatedBy: 'admin001',
        createdAt: generateDate(2020, 2024, rng(ci + j + 30)),
        updatedAt: generateDate(2023, 2024, rng(ci + j + 35)),
      });
    }
  });
  return records;
}

// ---- Generate Vehicles ----
export function generateVehicles(citizens: Citizen[]): Vehicle[] {
  const records: Vehicle[] = [];
  let idx = 0;
  citizens.forEach((c, ci) => {
    const r = rng(ci * 71 + 17);
    const twoWheelerCount = r() > 0.2 ? Math.floor(r() * 2) + 1 : 0;
    const fourWheelerCount = r() > 0.5 ? Math.floor(r() * 2) : 0;

    for (let j = 0; j < twoWheelerCount; j++) {
      const r2 = rng(ci * 300 + j * 29 + 11);
      const make = pickRandom(VEHICLE_MAKES_2W, r2);
      const models = VEHICLE_MODELS_2W[make] || ['Model'];
      const model = pickRandom(models, r2);
      const year = 2010 + Math.floor(r2() * 14);
      records.push({
        id: `VEH${(++idx).toString().padStart(5, '0')}`,
        citizenId: c.id,
        aadhaarNumber: c.aadhaarNumber,
        vehicleType: 'Two Wheeler',
        registrationNumber: generateRegNo('AP', r2),
        make,
        model,
        variant: r2() > 0.5 ? ['STD', 'Deluxe', 'Premium', 'Sport', 'Limited Edition'][Math.floor(r2() * 5)] : undefined,
        year,
        color: pickRandom(COLORS, r2),
        engineNumber: `ENG${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        chassisNumber: `CHS${(Math.floor(r2() * 9999999999) + 1000000000).toString().slice(0, 10)}`,
        fuelType: (['Petrol', 'Petrol', 'Petrol', 'Electric', 'CNG'] as const)[Math.floor(r2() * 5)],
        seatingCapacity: 2,
        insuranceNumber: `INS/AP/${Math.floor(r2() * 999999) + 100000}`,
        insuranceExpiry: generateDate(2024, 2026, rng(ci + j + 40)),
        pollutionCertExpiry: generateDate(2024, 2025, rng(ci + j + 41)),
        marketValue: Math.round((r2() * 120000 + 30000) / 1000) * 1000,
        createdBy: 'admin001',
        updatedBy: 'admin001',
        createdAt: generateDate(2020, 2024, rng(ci + j + 42)),
        updatedAt: generateDate(2023, 2024, rng(ci + j + 43)),
      });
    }

    for (let j = 0; j < fourWheelerCount; j++) {
      const r2 = rng(ci * 400 + j * 37 + 19);
      const make = pickRandom(VEHICLE_MAKES_4W, r2);
      const models = VEHICLE_MODELS_4W[make] || ['Model'];
      const model = pickRandom(models, r2);
      const year = 2010 + Math.floor(r2() * 14);
      records.push({
        id: `VEH${(++idx).toString().padStart(5, '0')}`,
        citizenId: c.id,
        aadhaarNumber: c.aadhaarNumber,
        vehicleType: 'Four Wheeler',
        registrationNumber: generateRegNo('AP', r2),
        make,
        model,
        variant: r2() > 0.4 ? ['Base', 'VXi', 'ZXi', 'ZXi+', 'Alpha', 'Delta', 'Sigma', 'Zeta'][Math.floor(r2() * 8)] : undefined,
        year,
        color: pickRandom(COLORS, r2),
        engineNumber: `FWENG${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        chassisNumber: `FWCHS${(Math.floor(r2() * 9999999999) + 1000000000).toString().slice(0, 10)}`,
        fuelType: (['Petrol', 'Diesel', 'Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric'] as const)[Math.floor(r2() * 7)],
        seatingCapacity: [5, 5, 5, 7, 7][Math.floor(r2() * 5)],
        insuranceNumber: `INS/AP/FW/${Math.floor(r2() * 999999) + 100000}`,
        insuranceExpiry: generateDate(2024, 2026, rng(ci + j + 50)),
        pollutionCertExpiry: generateDate(2024, 2025, rng(ci + j + 51)),
        fitnessExpiry: generateDate(2024, 2030, rng(ci + j + 52)),
        taxValidTill: generateDate(2024, 2026, rng(ci + j + 53)),
        marketValue: Math.round((r2() * 1500000 + 400000) / 1000) * 1000,
        createdBy: 'admin001',
        updatedBy: 'admin001',
        createdAt: generateDate(2020, 2024, rng(ci + j + 54)),
        updatedAt: generateDate(2023, 2024, rng(ci + j + 55)),
      });
    }
  });
  return records;
}

// ---- Generate Ration Cards ----
export function generateRationCards(citizens: Citizen[]): RationCard[] {
  const records: RationCard[] = [];
  let idx = 0;
  const shops = ['AP Civil Supplies', 'Sri Ram FPS', 'Lakshmi FPS', 'Venkateswara FPS', 'Sai Krishna FPS', 'Tirumala FPS', 'Balaji FPS', 'Annapurna FPS'];
  citizens.forEach((c, ci) => {
    const r = rng(ci * 83 + 23);
    if (r() > 0.1) {
      const r2 = rng(ci * 500 + 13);
      const cardTypes: RationCard['cardType'][] = ['PHH', 'PHH', 'NPHH', 'AAY', 'APL'];
      const cardType = cardTypes[Math.floor(r2() * cardTypes.length)];
      const shopName = shops[Math.floor(r2() * shops.length)];
      records.push({
        id: `RC${(++idx).toString().padStart(5, '0')}`,
        citizenId: c.id,
        aadhaarNumber: c.aadhaarNumber,
        cardNumber: `RC/${c.address.district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        cardType,
        issuedDate: generateDate(2015, 2023, r2),
        expiryDate: r2() > 0.3 ? generateDate(2025, 2028, r2) : undefined,
        familySize: Math.floor(r2() * 8) + 1,
        headOfFamily: `${c.firstName} ${c.lastName}`,
        shop: shopName,
        shopCode: `SHOP/${Math.floor(r2() * 9999) + 1000}`,
        monthlyEntitlement: {
          rice: cardType === 'AAY' ? 35 : cardType === 'PHH' ? 5 * (Math.floor(r2() * 5) + 1) : 0,
          wheat: r2() > 0.5 ? Math.floor(r2() * 5) : 0,
          sugar: r2() > 0.7 ? 1 : 0,
          kerosene: r2() > 0.6 ? Math.floor(r2() * 3) + 1 : 0,
        },
        isActive: r2() > 0.05,
        remarks: r2() > 0.85 ? 'Linked to Aadhaar, e-KYC done' : undefined,
        createdBy: 'admin001',
        updatedBy: 'admin001',
        createdAt: generateDate(2020, 2024, rng(ci + 60)),
        updatedAt: generateDate(2023, 2024, rng(ci + 65)),
      });
    }
  });
  return records;
}

// ---- Demo Users ----
export const DEMO_USERS: User[] = [
  {
    id: 'USR00001',
    userId: 'admin001',
    username: 'admin',
    passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // md5 of "123456"
    role: 'administrator',
    fullName: 'Srinivasa Rao Muppidi',
    designation: 'District Collector',
    district: 'Guntur',
    mandal: 'Guntur Urban',
    email: 'collector.guntur@aprevenue.gov.in',
    mobile: '9849123456',
    isActive: true,
    lastLogin: '2024-01-15T10:30:00',
    createdAt: '2023-01-01T00:00:00',
    updatedAt: '2024-01-15T10:30:00',
  },
  {
    id: 'USR00002',
    userId: 'revoff001',
    username: 'revenue_officer',
    passwordHash: 'c4ca4238a0b923820dcc509a6f75849b',
    role: 'revenue_officer',
    fullName: 'Padmavathi Venkatesh',
    designation: 'Revenue Divisional Officer',
    district: 'Krishna',
    mandal: 'Vijayawada Urban',
    email: 'rdo.vijayawada@aprevenue.gov.in',
    mobile: '9876543210',
    isActive: true,
    lastLogin: '2024-01-15T09:00:00',
    createdAt: '2023-01-15T00:00:00',
    updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'USR00003',
    userId: 'deo001',
    username: 'data_operator',
    passwordHash: 'c4ca4238a0b923820dcc509a6f75849b',
    role: 'data_entry_operator',
    fullName: 'Ramesh Kumar Nayak',
    designation: 'Senior Data Entry Operator',
    district: 'Visakhapatnam',
    mandal: 'Bheemunipatnam',
    email: 'deo.vizag@aprevenue.gov.in',
    mobile: '9700123456',
    isActive: true,
    createdAt: '2023-02-01T00:00:00',
    updatedAt: '2024-01-10T00:00:00',
  },
  {
    id: 'USR00004',
    userId: 'rdo001',
    username: 'readonly_officer',
    passwordHash: 'c4ca4238a0b923820dcc509a6f75849b',
    role: 'read_only_officer',
    fullName: 'Lakshmi Durga Prasad',
    designation: 'Mandal Revenue Officer',
    district: 'Nellore',
    mandal: 'Nellore Urban',
    email: 'mro.nellore@aprevenue.gov.in',
    mobile: '9440123456',
    isActive: true,
    createdAt: '2023-03-01T00:00:00',
    updatedAt: '2024-01-05T00:00:00',
  },
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: 'AUD001', userId: 'admin001', userName: 'Srinivasa Rao Muppidi', action: 'LOGIN', module: 'Auth', details: 'User logged in successfully', timestamp: '2024-01-15T10:30:00' },
  { id: 'AUD002', userId: 'admin001', userName: 'Srinivasa Rao Muppidi', action: 'VIEW', module: 'Citizens', entityType: 'Citizen', details: 'Viewed citizen list', timestamp: '2024-01-15T10:32:00' },
  { id: 'AUD003', userId: 'revoff001', userName: 'Padmavathi Venkatesh', action: 'CREATE', module: 'Land Records', entityType: 'LandRecord', details: 'Added new land record for survey no 123/4', timestamp: '2024-01-15T09:15:00' },
  { id: 'AUD004', userId: 'deo001', userName: 'Ramesh Kumar Nayak', action: 'UPDATE', module: 'Citizens', entityType: 'Citizen', details: 'Updated mobile number for citizen CIT00023', timestamp: '2024-01-14T14:20:00' },
  { id: 'AUD005', userId: 'admin001', userName: 'Srinivasa Rao Muppidi', action: 'EXPORT', module: 'Reports', details: 'Exported Land Ownership Report as PDF', timestamp: '2024-01-14T11:45:00' },
  { id: 'AUD006', userId: 'revoff001', userName: 'Padmavathi Venkatesh', action: 'SEARCH', module: 'NLP Search', details: 'Searched: "Show all assets for Aadhaar"', timestamp: '2024-01-15T09:30:00' },
  { id: 'AUD007', userId: 'deo001', userName: 'Ramesh Kumar Nayak', action: 'CREATE', module: 'Vehicles', entityType: 'Vehicle', details: 'Added new vehicle record AP 05 CD 1234', timestamp: '2024-01-15T10:05:00' },
  { id: 'AUD008', userId: 'admin001', userName: 'Srinivasa Rao Muppidi', action: 'DELETE', module: 'RationCards', entityType: 'RationCard', details: 'Deactivated duplicate ration card RC00078', timestamp: '2024-01-13T16:00:00' },
];

// Generate all data once
export const CITIZENS_DATA = generateCitizens();
export const LAND_RECORDS_DATA = generateLandRecords(CITIZENS_DATA);
export const HOUSE_PROPERTIES_DATA = generateHouseProperties(CITIZENS_DATA);
export const VEHICLES_DATA = generateVehicles(CITIZENS_DATA);
export const RATION_CARDS_DATA = generateRationCards(CITIZENS_DATA);
