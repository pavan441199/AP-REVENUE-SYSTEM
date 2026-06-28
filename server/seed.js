// ============================================================
// AP Revenue ICAMS - PostgreSQL Seed Script
// Run: node seed.js
// ============================================================

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ---- Data constants (mirrored from mockData.ts) ----
const DISTRICTS = ['Visakhapatnam','East Godavari','West Godavari','Krishna','Guntur','Prakasam','Nellore','Kadapa','Kurnool','Anantapur','Chittoor','Srikakulam','Vizianagaram'];
const MANDALS = {
  'Visakhapatnam': ['Bheemunipatnam','Anakapalle','Sabbavaram','Narsipatnam'],
  'East Godavari': ['Rajahmundry Urban','Kakinada Urban','Amalapuram','Peddapuram'],
  'West Godavari': ['Eluru Urban','Bhimavaram Urban','Narsapur','Jangareddygudem'],
  'Krishna': ['Vijayawada Urban','Machilipatnam Urban','Nuzvid','Gudivada'],
  'Guntur': ['Guntur Urban','Narasaraopet','Tenali','Mangalagiri'],
  'Prakasam': ['Ongole Urban','Chirala','Kandukur','Giddalur'],
  'Nellore': ['Nellore Urban','Kavali','Gudur','Sullurpeta'],
  'Kadapa': ['Kadapa Urban','Proddatur Urban','Badvel','Rayachoti'],
  'Kurnool': ['Kurnool Urban','Adoni Urban','Nandyal Urban','Dhone'],
  'Anantapur': ['Anantapur Urban','Guntakal Urban','Hindupur','Tadipatri'],
  'Chittoor': ['Chittoor Urban','Tirupati Urban','Madanapalle','Nagari'],
  'Srikakulam': ['Srikakulam Urban','Narasannapeta','Palasa','Tekkali'],
  'Vizianagaram': ['Vizianagaram Urban','Bobbili','Parvathipuram','Salur'],
};
const FIRST_NAMES = ['Venkata','Srinivasa','Rama','Krishna','Lakshmi','Sarada','Padmavathi','Suresh','Ramesh','Mahesh','Rajesh','Naresh','Ganesh','Sreedevi','Venkatalakshmi','Annapurna','Bhavani','Durga','Saraswathi','Tulasi','Chandra','Vijaya','Usha','Hymavathi','Jyothi','Kavitha','Nirmala','Parvathi','Radha','Savitri','Anuradha','Bharathi','Chaitanya','Deepika','Eswar','Farida','Geetha','Haritha','Indira','Jagadish','Kamala','Lavanya','Murali','Nagendra','Obul','Prasad','Ravi','Sai','Tirumala','Uma'];
const LAST_NAMES = ['Reddy','Naidu','Rao','Sharma','Varma','Raju','Babu','Kumar','Devi','Lakshmi','Prasad','Chowdary','Murthy','Nair','Pillai','Shetty','Goud','Yadav','Patel','Satyanarayana','Venkateswara','Subrahmanyam','Krishnamurthy','Anjaneyulu','Bhaskar','Chiranjeevi','Durgaprasa','Hanumantha'];
const VEHICLE_MAKES_2W = ['Hero','Honda','TVS','Bajaj','Royal Enfield','Yamaha','Suzuki','KTM'];
const VEHICLE_MODELS_2W = {
  'Hero': ['Splendor Plus','HF Deluxe','Passion Pro','Glamour','Xtreme 160R'],
  'Honda': ['Activa 6G','Shine','Unicorn','CB Hornet','SP 125'],
  'TVS': ['Apache RTR 160','Jupiter','Star City+','Ntorq','Raider 125'],
  'Bajaj': ['Pulsar 150','CT 100','Platina','Avenger 160','Dominar 400'],
  'Royal Enfield': ['Bullet 350','Classic 350','Meteor 350','Himalayan','Hunter 350'],
  'Yamaha': ['FZ-S','R15','MT-15','Fascino 125','Ray ZR'],
  'Suzuki': ['Access 125','Gixxer','Avenis','Intruder'],
  'KTM': ['Duke 200','Duke 390','RC 200','Adventure 390'],
};
const VEHICLE_MAKES_4W = ['Maruti Suzuki','Hyundai','Tata','Mahindra','Toyota','Honda','Kia','Renault'];
const VEHICLE_MODELS_4W = {
  'Maruti Suzuki': ['Swift','Baleno','Wagon R','Alto K10','Dzire','Ertiga','Brezza','Vitara'],
  'Hyundai': ['i20','Creta','Verna','Grand i10 Nios','Venue','Alcazar','Tucson'],
  'Tata': ['Nexon','Harrier','Safari','Punch','Tiago','Altroz','Tigor'],
  'Mahindra': ['Scorpio N','XUV700','Thar','Bolero','XUV300','Marazzo'],
  'Toyota': ['Innova Crysta','Fortuner','Glanza','Urban Cruiser','Camry'],
  'Honda': ['City','Amaze','Jazz','WR-V','BR-V','CR-V'],
  'Kia': ['Seltos','Sonet','Carnival','EV6'],
  'Renault': ['Kwid','Duster','Triber','Kiger'],
};
const COLORS = ['White','Silver','Black','Red','Blue','Grey','Pearl White','Dark Grey','Bronze','Yellow','Orange','Green'];
const CASTES = ['OC','BC-A','BC-B','BC-C','BC-D','BC-E','SC','ST'];
const RELIGIONS = ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain'];

// ---- RNG helpers ----
function rng(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function pickRandom(arr, r) { return arr[Math.floor(r() * arr.length)]; }

function generateAadhaar(seed) {
  const r = rng(seed * 7 + 13);
  let num = '';
  for (let i = 0; i < 12; i++) num += Math.floor(r() * 10).toString();
  return num.startsWith('0') ? '2' + num.slice(1) : num;
}

function generateDate(startYear, endYear, r) {
  const year = startYear + Math.floor(r() * (endYear - startYear));
  const month = 1 + Math.floor(r() * 12);
  const day = 1 + Math.floor(r() * 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function generateMobile(r) {
  const prefixes = ['99','98','97','96','95','94','93','92','91','90','88','87','86','85','84','83','82','81','80','79','78','77','76','75','70'];
  const prefix = prefixes[Math.floor(r() * prefixes.length)];
  let rest = '';
  for (let i = 0; i < 8; i++) rest += Math.floor(r() * 10).toString();
  return prefix + rest;
}

function generateRegNo(r) {
  const distCodes = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'];
  const code = distCodes[Math.floor(r() * distCodes.length)];
  const series = String.fromCharCode(65 + Math.floor(r() * 26)) + String.fromCharCode(65 + Math.floor(r() * 26));
  const num = (1000 + Math.floor(r() * 8999)).toString();
  return `AP ${code} ${series} ${num}`;
}

// ---- Generators ----
function generateCitizens() {
  const citizens = [];
  for (let i = 0; i < 110; i++) {
    const r = rng(i * 37 + 19);
    const district = DISTRICTS[Math.floor(r() * DISTRICTS.length)];
    const mandals = MANDALS[district] || ['Urban'];
    const mandal = mandals[Math.floor(r() * mandals.length)];
    const firstName = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
    const gv = r();
    const gender = gv > 0.5 ? 'Male' : gv > 0.3 ? 'Female' : 'Other';
    const dob = generateDate(1955, 2000, r);
    citizens.push({
      id: `CIT${(i + 1).toString().padStart(5, '0')}`,
      aadhaar_number: generateAadhaar(i * 97 + 31),
      first_name: firstName,
      last_name: lastName,
      father_husband_name: FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)] + ' ' + LAST_NAMES[Math.floor(r() * LAST_NAMES.length)],
      date_of_birth: dob,
      gender,
      mobile: generateMobile(r),
      email: r() > 0.6 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(r() * 99)}@gmail.com` : null,
      door_no: `${Math.floor(r() * 999) + 1}-${Math.floor(r() * 99) + 1}`,
      street: `${Math.floor(r() * 20) + 1}th Ward, ${mandal} Colony`,
      village: mandal,
      mandal,
      district,
      state: 'Andhra Pradesh',
      pincode: `5${(Math.floor(r() * 89999) + 10000).toString().slice(0, 5)}`,
      caste: CASTES[Math.floor(r() * CASTES.length)],
      religion: RELIGIONS[Math.floor(r() * RELIGIONS.length)],
      annual_income: Math.round((r() * 900000 + 50000) / 1000) * 1000,
      is_active: true,
      created_by: 'admin001',
      updated_by: 'admin001',
      created_at: generateDate(2020, 2024, rng(i + 5)),
      updated_at: generateDate(2023, 2024, rng(i + 8)),
    });
  }
  return citizens;
}

function generateLandRecords(citizens) {
  const records = [];
  let idx = 0;
  citizens.forEach((c, ci) => {
    const r = rng(ci * 53 + 7);
    const count = r() > 0.3 ? Math.floor(r() * 3) + 1 : 0;
    for (let j = 0; j < count; j++) {
      const r2 = rng(ci * 100 + j * 17 + 3);
      const landTypes = ['Agriculture','Commercial','Residential','Industrial'];
      const ownershipTypes = ['Owned','Inherited','Purchased','Gift'];
      const encStatuses = ['Clear','Clear','Clear','Mortgaged','Disputed'];
      records.push({
        id: `LND${(++idx).toString().padStart(5, '0')}`,
        citizen_id: c.id,
        aadhaar_number: c.aadhaar_number,
        survey_number: `${Math.floor(r2() * 999) + 1}/${Math.floor(r2() * 99) + 1}`,
        sub_division: r2() > 0.5 ? `A${Math.floor(r2() * 5) + 1}` : null,
        village: (MANDALS[c.district] || ['Urban'])[Math.floor(r2() * (MANDALS[c.district] || ['Urban']).length)],
        mandal: c.mandal,
        district: c.district,
        land_type: landTypes[Math.floor(r2() * landTypes.length)],
        extent_in_acres: Math.round(r2() * 10 * 100) / 100,
        market_value: Math.round((r2() * 5000000 + 100000) / 1000) * 1000,
        patta_number: `PATTA/${c.district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 99999) + 10000)}`,
        registration_number: r2() > 0.6 ? `REG/${Math.floor(r2() * 9999) + 1000}/${2018 + Math.floor(r2() * 6)}` : null,
        registration_date: r2() > 0.6 ? generateDate(2018, 2024, rng(ci + j + 2)) : null,
        ownership_type: ownershipTypes[Math.floor(r2() * ownershipTypes.length)],
        encumbrance_status: encStatuses[Math.floor(r2() * encStatuses.length)],
        remarks: r2() > 0.8 ? 'Under mutation process' : null,
        created_by: 'admin001',
        updated_by: 'admin001',
        created_at: generateDate(2020, 2024, rng(ci + j + 10)),
        updated_at: generateDate(2023, 2024, rng(ci + j + 15)),
      });
    }
  });
  return records;
}

function generateHouseProperties(citizens) {
  const records = [];
  let idx = 0;
  const streets = ['MG Road','Gandhi Nagar','KPHB Colony','Sainath Nagar','Sai Nagar','Rajiv Nagar'];
  const propTypes = ['Independent House','Flat','Commercial','Apartment','Villa'];
  const encStatuses = ['Clear','Clear','Mortgaged','Disputed'];
  citizens.forEach((c, ci) => {
    const r = rng(ci * 61 + 11);
    const count = r() > 0.4 ? Math.floor(r() * 2) + 1 : 0;
    for (let j = 0; j < count; j++) {
      const r2 = rng(ci * 200 + j * 23 + 7);
      records.push({
        id: `PROP${(++idx).toString().padStart(5, '0')}`,
        citizen_id: c.id,
        aadhaar_number: c.aadhaar_number,
        property_id: `AP/PROP/${c.district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 99999) + 10000)}`,
        door_no: `${Math.floor(r2() * 999) + 1}-${Math.floor(r2() * 9) + 1}`,
        street: streets[Math.floor(r2() * streets.length)],
        village: c.village,
        mandal: c.mandal,
        district: c.district,
        property_type: propTypes[Math.floor(r2() * propTypes.length)],
        built_up_area: Math.round(r2() * 2000 + 400),
        plot_area: r2() > 0.5 ? Math.round(r2() * 1000 + 100) : null,
        floors: Math.floor(r2() * 4) + 1,
        construction_year: 1990 + Math.floor(r2() * 34),
        market_value: Math.round((r2() * 8000000 + 500000) / 1000) * 1000,
        annual_rental_value: r2() > 0.5 ? Math.round((r2() * 200000 + 20000) / 1000) * 1000 : null,
        registration_number: r2() > 0.6 ? `PROP-REG/${Math.floor(r2() * 9999) + 1000}/${2018 + Math.floor(r2() * 6)}` : null,
        registration_date: r2() > 0.6 ? generateDate(2018, 2024, rng(ci + j + 20)) : null,
        encumbrance_status: encStatuses[Math.floor(r2() * encStatuses.length)],
        remarks: r2() > 0.85 ? 'Property tax pending' : null,
        created_by: 'admin001',
        updated_by: 'admin001',
        created_at: generateDate(2020, 2024, rng(ci + j + 30)),
        updated_at: generateDate(2023, 2024, rng(ci + j + 35)),
      });
    }
  });
  return records;
}

function generateVehicles(citizens) {
  const records = [];
  let idx = 0;
  const fuelTypes2W = ['Petrol','Petrol','Petrol','Electric','CNG'];
  const fuelTypes4W = ['Petrol','Diesel','Petrol','Diesel','CNG','Hybrid','Electric'];
  const variants2W = ['STD','Deluxe','Premium','Sport','Limited Edition'];
  const variants4W = ['Base','VXi','ZXi','ZXi+','Alpha','Delta','Sigma','Zeta'];
  const seating4W = [5,5,5,7,7];

  citizens.forEach((c, ci) => {
    const r = rng(ci * 71 + 17);
    const twoWheelerCount = r() > 0.2 ? Math.floor(r() * 2) + 1 : 0;
    const fourWheelerCount = r() > 0.5 ? Math.floor(r() * 2) : 0;

    for (let j = 0; j < twoWheelerCount; j++) {
      const r2 = rng(ci * 300 + j * 29 + 11);
      const make = pickRandom(VEHICLE_MAKES_2W, r2);
      const models = VEHICLE_MODELS_2W[make] || ['Model'];
      const model = pickRandom(models, r2);
      records.push({
        id: `VEH${(++idx).toString().padStart(5, '0')}`,
        citizen_id: c.id,
        aadhaar_number: c.aadhaar_number,
        vehicle_type: 'Two Wheeler',
        registration_number: generateRegNo(r2),
        make,
        model,
        variant: r2() > 0.5 ? variants2W[Math.floor(r2() * variants2W.length)] : null,
        year: 2010 + Math.floor(r2() * 14),
        color: pickRandom(COLORS, r2),
        engine_number: `ENG${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        chassis_number: `CHS${(Math.floor(r2() * 9999999999) + 1000000000).toString().slice(0, 10)}`,
        fuel_type: fuelTypes2W[Math.floor(r2() * fuelTypes2W.length)],
        seating_capacity: 2,
        insurance_number: `INS/AP/${Math.floor(r2() * 999999) + 100000}`,
        insurance_expiry: generateDate(2024, 2026, rng(ci + j + 40)),
        pollution_cert_expiry: generateDate(2024, 2025, rng(ci + j + 41)),
        fitness_expiry: null,
        tax_valid_till: null,
        market_value: Math.round((r2() * 120000 + 30000) / 1000) * 1000,
        remarks: null,
        created_by: 'admin001',
        updated_by: 'admin001',
        created_at: generateDate(2020, 2024, rng(ci + j + 42)),
        updated_at: generateDate(2023, 2024, rng(ci + j + 43)),
      });
    }

    for (let j = 0; j < fourWheelerCount; j++) {
      const r2 = rng(ci * 400 + j * 37 + 19);
      const make = pickRandom(VEHICLE_MAKES_4W, r2);
      const models = VEHICLE_MODELS_4W[make] || ['Model'];
      const model = pickRandom(models, r2);
      records.push({
        id: `VEH${(++idx).toString().padStart(5, '0')}`,
        citizen_id: c.id,
        aadhaar_number: c.aadhaar_number,
        vehicle_type: 'Four Wheeler',
        registration_number: generateRegNo(r2),
        make,
        model,
        variant: r2() > 0.4 ? variants4W[Math.floor(r2() * variants4W.length)] : null,
        year: 2010 + Math.floor(r2() * 14),
        color: pickRandom(COLORS, r2),
        engine_number: `FWENG${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        chassis_number: `FWCHS${(Math.floor(r2() * 9999999999) + 1000000000).toString().slice(0, 10)}`,
        fuel_type: fuelTypes4W[Math.floor(r2() * fuelTypes4W.length)],
        seating_capacity: seating4W[Math.floor(r2() * seating4W.length)],
        insurance_number: `INS/AP/FW/${Math.floor(r2() * 999999) + 100000}`,
        insurance_expiry: generateDate(2024, 2026, rng(ci + j + 50)),
        pollution_cert_expiry: generateDate(2024, 2025, rng(ci + j + 51)),
        fitness_expiry: generateDate(2024, 2030, rng(ci + j + 52)),
        tax_valid_till: generateDate(2024, 2026, rng(ci + j + 53)),
        market_value: Math.round((r2() * 1500000 + 400000) / 1000) * 1000,
        remarks: null,
        created_by: 'admin001',
        updated_by: 'admin001',
        created_at: generateDate(2020, 2024, rng(ci + j + 54)),
        updated_at: generateDate(2023, 2024, rng(ci + j + 55)),
      });
    }
  });
  return records;
}

function generateRationCards(citizens) {
  const records = [];
  let idx = 0;
  const shops = ['AP Civil Supplies','Sri Ram FPS','Lakshmi FPS','Venkateswara FPS','Sai Krishna FPS','Tirumala FPS','Balaji FPS','Annapurna FPS'];
  const cardTypes = ['PHH','PHH','NPHH','AAY','APL'];

  citizens.forEach((c, ci) => {
    const r = rng(ci * 83 + 23);
    if (r() > 0.1) {
      const r2 = rng(ci * 500 + 13);
      const cardType = cardTypes[Math.floor(r2() * cardTypes.length)];
      const shopName = shops[Math.floor(r2() * shops.length)];
      records.push({
        id: `RC${(++idx).toString().padStart(5, '0')}`,
        citizen_id: c.id,
        aadhaar_number: c.aadhaar_number,
        card_number: `RC/${c.district.substring(0, 3).toUpperCase()}/${(Math.floor(r2() * 9999999) + 1000000).toString()}`,
        card_type: cardType,
        issued_date: generateDate(2015, 2023, r2),
        expiry_date: r2() > 0.3 ? generateDate(2025, 2028, r2) : null,
        family_size: Math.floor(r2() * 8) + 1,
        head_of_family: `${c.first_name} ${c.last_name}`,
        shop: shopName,
        shop_code: `SHOP/${Math.floor(r2() * 9999) + 1000}`,
        rice_entitlement: cardType === 'AAY' ? 35 : cardType === 'PHH' ? 5 * (Math.floor(r2() * 5) + 1) : 0,
        wheat_entitlement: r2() > 0.5 ? Math.floor(r2() * 5) : 0,
        sugar_entitlement: r2() > 0.7 ? 1 : 0,
        kerosene_entitlement: r2() > 0.6 ? Math.floor(r2() * 3) + 1 : 0,
        is_active: r2() > 0.05,
        remarks: r2() > 0.85 ? 'Linked to Aadhaar, e-KYC done' : null,
        created_by: 'admin001',
        updated_by: 'admin001',
        created_at: generateDate(2020, 2024, rng(ci + 60)),
        updated_at: generateDate(2023, 2024, rng(ci + 65)),
      });
    }
  });
  return records;
}

const DEMO_USERS = [
  { id:'USR00001', user_id:'admin001', username:'admin', password_hash:'e10adc3949ba59abbe56e057f20f883e', role:'administrator', full_name:'Srinivasa Rao Muppidi', designation:'District Collector', district:'Guntur', mandal:'Guntur Urban', email:'collector.guntur@aprevenue.gov.in', mobile:'9849123456', is_active:true, last_login:'2024-01-15T10:30:00', created_at:'2023-01-01T00:00:00', updated_at:'2024-01-15T10:30:00' },
  { id:'USR00002', user_id:'revoff001', username:'revenue_officer', password_hash:'c4ca4238a0b923820dcc509a6f75849b', role:'revenue_officer', full_name:'Padmavathi Venkatesh', designation:'Revenue Divisional Officer', district:'Krishna', mandal:'Vijayawada Urban', email:'rdo.vijayawada@aprevenue.gov.in', mobile:'9876543210', is_active:true, last_login:'2024-01-15T09:00:00', created_at:'2023-01-15T00:00:00', updated_at:'2024-01-15T09:00:00' },
  { id:'USR00003', user_id:'deo001', username:'data_operator', password_hash:'c4ca4238a0b923820dcc509a6f75849b', role:'data_entry_operator', full_name:'Ramesh Kumar Nayak', designation:'Senior Data Entry Operator', district:'Visakhapatnam', mandal:'Bheemunipatnam', email:'deo.vizag@aprevenue.gov.in', mobile:'9700123456', is_active:true, last_login:null, created_at:'2023-02-01T00:00:00', updated_at:'2024-01-10T00:00:00' },
  { id:'USR00004', user_id:'rdo001', username:'readonly_officer', password_hash:'c4ca4238a0b923820dcc509a6f75849b', role:'read_only_officer', full_name:'Lakshmi Durga Prasad', designation:'Mandal Revenue Officer', district:'Nellore', mandal:'Nellore Urban', email:'mro.nellore@aprevenue.gov.in', mobile:'9440123456', is_active:true, last_login:null, created_at:'2023-03-01T00:00:00', updated_at:'2024-01-05T00:00:00' },
];

const DEMO_AUDIT_LOGS = [
  { id:'AUD001', user_id:'admin001', user_name:'Srinivasa Rao Muppidi', action:'LOGIN', module:'Auth', entity_id:null, entity_type:null, details:'User logged in successfully', ip_address:null, timestamp:'2024-01-15T10:30:00' },
  { id:'AUD002', user_id:'admin001', user_name:'Srinivasa Rao Muppidi', action:'VIEW', module:'Citizens', entity_id:null, entity_type:'Citizen', details:'Viewed citizen list', ip_address:null, timestamp:'2024-01-15T10:32:00' },
  { id:'AUD003', user_id:'revoff001', user_name:'Padmavathi Venkatesh', action:'CREATE', module:'Land Records', entity_id:null, entity_type:'LandRecord', details:'Added new land record for survey no 123/4', ip_address:null, timestamp:'2024-01-15T09:15:00' },
  { id:'AUD004', user_id:'deo001', user_name:'Ramesh Kumar Nayak', action:'UPDATE', module:'Citizens', entity_id:'CIT00023', entity_type:'Citizen', details:'Updated mobile number for citizen CIT00023', ip_address:null, timestamp:'2024-01-14T14:20:00' },
  { id:'AUD005', user_id:'admin001', user_name:'Srinivasa Rao Muppidi', action:'EXPORT', module:'Reports', entity_id:null, entity_type:null, details:'Exported Land Ownership Report as PDF', ip_address:null, timestamp:'2024-01-14T11:45:00' },
  { id:'AUD006', user_id:'revoff001', user_name:'Padmavathi Venkatesh', action:'SEARCH', module:'NLP Search', entity_id:null, entity_type:null, details:'Searched: "Show all assets for Aadhaar"', ip_address:null, timestamp:'2024-01-15T09:30:00' },
  { id:'AUD007', user_id:'deo001', user_name:'Ramesh Kumar Nayak', action:'CREATE', module:'Vehicles', entity_id:null, entity_type:'Vehicle', details:'Added new vehicle record AP 05 CD 1234', ip_address:null, timestamp:'2024-01-15T10:05:00' },
  { id:'AUD008', user_id:'admin001', user_name:'Srinivasa Rao Muppidi', action:'DELETE', module:'RationCards', entity_id:'RC00078', entity_type:'RationCard', details:'Deactivated duplicate ration card RC00078', ip_address:null, timestamp:'2024-01-13T16:00:00' },
];

// ---- Main seed function ----
async function seed() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL...');

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created/verified.');

    // Check if already seeded
    const { rows: existing } = await client.query('SELECT COUNT(*) FROM citizens');
    if (parseInt(existing[0].count) > 0) {
      console.log(`Database already has ${existing[0].count} citizens. Re-seeding users only...`);
      for (const u of DEMO_USERS) {
        await client.query(`
          INSERT INTO users (id,user_id,username,password_hash,role,full_name,designation,district,mandal,email,mobile,is_active,last_login,created_at,updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          ON CONFLICT (id) DO UPDATE SET password_hash=EXCLUDED.password_hash, updated_at=EXCLUDED.updated_at
        `, [u.id,u.user_id,u.username,u.password_hash,u.role,u.full_name,u.designation,u.district,u.mandal,u.email,u.mobile,u.is_active,u.last_login,u.created_at,u.updated_at]);
      }
      console.log('Users re-seeded. Done.');
      return;
    }

    await client.query('BEGIN');

    // Seed users
    console.log('Seeding users...');
    for (const u of DEMO_USERS) {
      await client.query(`
        INSERT INTO users (id,user_id,username,password_hash,role,full_name,designation,district,mandal,email,mobile,is_active,last_login,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO NOTHING
      `, [u.id,u.user_id,u.username,u.password_hash,u.role,u.full_name,u.designation,u.district,u.mandal,u.email,u.mobile,u.is_active,u.last_login,u.created_at,u.updated_at]);
    }

    // Generate and seed citizens
    console.log('Generating & seeding 110 citizens...');
    const citizens = generateCitizens();
    for (const c of citizens) {
      await client.query(`
        INSERT INTO citizens (id,aadhaar_number,first_name,last_name,father_husband_name,date_of_birth,gender,mobile,email,door_no,street,village,mandal,district,state,pincode,caste,religion,annual_income,is_active,created_by,updated_by,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        ON CONFLICT (id) DO NOTHING
      `, [c.id,c.aadhaar_number,c.first_name,c.last_name,c.father_husband_name,c.date_of_birth,c.gender,c.mobile,c.email,c.door_no,c.street,c.village,c.mandal,c.district,c.state,c.pincode,c.caste,c.religion,c.annual_income,c.is_active,c.created_by,c.updated_by,c.created_at,c.updated_at]);
    }
    console.log(`Seeded ${citizens.length} citizens.`);

    // Land records
    console.log('Generating & seeding land records...');
    const lands = generateLandRecords(citizens);
    for (const l of lands) {
      await client.query(`
        INSERT INTO land_records (id,citizen_id,aadhaar_number,survey_number,sub_division,village,mandal,district,land_type,extent_in_acres,market_value,patta_number,registration_number,registration_date,ownership_type,encumbrance_status,remarks,created_by,updated_by,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT (id) DO NOTHING
      `, [l.id,l.citizen_id,l.aadhaar_number,l.survey_number,l.sub_division,l.village,l.mandal,l.district,l.land_type,l.extent_in_acres,l.market_value,l.patta_number,l.registration_number,l.registration_date,l.ownership_type,l.encumbrance_status,l.remarks,l.created_by,l.updated_by,l.created_at,l.updated_at]);
    }
    console.log(`Seeded ${lands.length} land records.`);

    // House properties
    console.log('Generating & seeding house properties...');
    const props = generateHouseProperties(citizens);
    for (const p of props) {
      await client.query(`
        INSERT INTO house_properties (id,citizen_id,aadhaar_number,property_id,door_no,street,village,mandal,district,property_type,built_up_area,plot_area,floors,construction_year,market_value,annual_rental_value,registration_number,registration_date,encumbrance_status,remarks,created_by,updated_by,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        ON CONFLICT (id) DO NOTHING
      `, [p.id,p.citizen_id,p.aadhaar_number,p.property_id,p.door_no,p.street,p.village,p.mandal,p.district,p.property_type,p.built_up_area,p.plot_area,p.floors,p.construction_year,p.market_value,p.annual_rental_value,p.registration_number,p.registration_date,p.encumbrance_status,p.remarks,p.created_by,p.updated_by,p.created_at,p.updated_at]);
    }
    console.log(`Seeded ${props.length} house properties.`);

    // Vehicles
    console.log('Generating & seeding vehicles...');
    const vehicles = generateVehicles(citizens);
    for (const v of vehicles) {
      await client.query(`
        INSERT INTO vehicles (id,citizen_id,aadhaar_number,vehicle_type,registration_number,make,model,variant,year,color,engine_number,chassis_number,fuel_type,seating_capacity,insurance_number,insurance_expiry,pollution_cert_expiry,fitness_expiry,tax_valid_till,market_value,remarks,created_by,updated_by,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        ON CONFLICT (id) DO NOTHING
      `, [v.id,v.citizen_id,v.aadhaar_number,v.vehicle_type,v.registration_number,v.make,v.model,v.variant,v.year,v.color,v.engine_number,v.chassis_number,v.fuel_type,v.seating_capacity,v.insurance_number,v.insurance_expiry,v.pollution_cert_expiry,v.fitness_expiry,v.tax_valid_till,v.market_value,v.remarks,v.created_by,v.updated_by,v.created_at,v.updated_at]);
    }
    console.log(`Seeded ${vehicles.length} vehicles.`);

    // Ration cards
    console.log('Generating & seeding ration cards...');
    const rationCards = generateRationCards(citizens);
    for (const rc of rationCards) {
      await client.query(`
        INSERT INTO ration_cards (id,citizen_id,aadhaar_number,card_number,card_type,issued_date,expiry_date,family_size,head_of_family,shop,shop_code,rice_entitlement,wheat_entitlement,sugar_entitlement,kerosene_entitlement,is_active,remarks,created_by,updated_by,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT (id) DO NOTHING
      `, [rc.id,rc.citizen_id,rc.aadhaar_number,rc.card_number,rc.card_type,rc.issued_date,rc.expiry_date,rc.family_size,rc.head_of_family,rc.shop,rc.shop_code,rc.rice_entitlement,rc.wheat_entitlement,rc.sugar_entitlement,rc.kerosene_entitlement,rc.is_active,rc.remarks,rc.created_by,rc.updated_by,rc.created_at,rc.updated_at]);
    }
    console.log(`Seeded ${rationCards.length} ration cards.`);

    // Audit logs
    console.log('Seeding audit logs...');
    for (const a of DEMO_AUDIT_LOGS) {
      await client.query(`
        INSERT INTO audit_logs (id,user_id,user_name,action,module,entity_id,entity_type,details,ip_address,timestamp)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [a.id,a.user_id,a.user_name,a.action,a.module,a.entity_id,a.entity_type,a.details,a.ip_address,a.timestamp]);
    }

    await client.query('COMMIT');
    console.log('\nDatabase seeded successfully!');
    console.log(`  Citizens: ${citizens.length}`);
    console.log(`  Land Records: ${lands.length}`);
    console.log(`  House Properties: ${props.length}`);
    console.log(`  Vehicles: ${vehicles.length}`);
    console.log(`  Ration Cards: ${rationCards.length}`);
    console.log(`  Users: ${DEMO_USERS.length}`);
    console.log(`  Audit Logs: ${DEMO_AUDIT_LOGS.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
