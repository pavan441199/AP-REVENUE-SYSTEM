// ============================================================
// AP Revenue ICAMS - Report Service (PDF + Excel)
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Citizen, LandRecord, HouseProperty, Vehicle, RationCard } from '../types';
import { citizenDB, landDB, propertyDB, vehicleDB, rationCardDB } from './dbService';

const AP_BLUE = [0, 48, 135] as [number, number, number];
const AP_GOLD = [200, 150, 12] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT_GRAY = [245, 245, 245] as [number, number, number];

function addPDFHeader(doc: jsPDF, title: string, subtitle?: string): void {
  // Header background
  doc.setFillColor(...AP_BLUE);
  doc.rect(0, 0, 210, 30, 'F');

  // Gold border
  doc.setFillColor(...AP_GOLD);
  doc.rect(0, 30, 210, 2, 'F');

  // Title text
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Government of Andhra Pradesh', 105, 10, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Revenue Department - Integrated Citizen Asset Management System', 105, 17, { align: 'center' });
  doc.setFontSize(10);
  doc.text(title, 105, 24, { align: 'center' });

  if (subtitle) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(subtitle, 105, 38, { align: 'center' });
  }

  // Report metadata
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, subtitle ? 44 : 38);
  doc.text('CONFIDENTIAL - For Official Use Only', 196, subtitle ? 44 : 38, { align: 'right' });
}

function addPDFFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...AP_BLUE);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text('AP Revenue Department | ICAMS | Confidential', 14, 292);
    doc.text(`Page ${i} of ${pageCount}`, 196, 292, { align: 'right' });
  }
}

// ---- Citizen Summary Report ----
export async function generateCitizenSummaryPDF(filters?: { district?: string }): Promise<void> {
  let citizens = await citizenDB.getAll();
  if (filters?.district) citizens = citizens.filter(c => c.address.district === filters.district);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addPDFHeader(doc, 'Citizen Summary Report', filters?.district ? `District: ${filters.district}` : 'All Districts');

  const tableData = citizens.map(c => [
    c.id,
    `${c.firstName} ${c.lastName}`,
    c.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-$3'),
    c.gender,
    c.dateOfBirth,
    c.mobile,
    c.address.district,
    c.address.mandal,
    c.isActive ? 'Active' : 'Inactive',
  ]);

  autoTable(doc, {
    head: [['Citizen ID', 'Name', 'Aadhaar (Masked)', 'Gender', 'DOB', 'Mobile', 'District', 'Mandal', 'Status']],
    body: tableData,
    startY: 50,
    headStyles: { fillColor: AP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 2: { font: 'courier' } },
  });

  addPDFFooter(doc);
  doc.save(`Citizen_Summary_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}

// ---- Land Ownership Report ----
export async function generateLandOwnershipPDF(filters?: { district?: string }): Promise<void> {
  let lands = await landDB.getAll();
  const citizens = await citizenDB.getAll();
  const citizenMap = new Map(citizens.map(c => [c.id, c]));
  if (filters?.district) lands = lands.filter(l => l.district === filters.district);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addPDFHeader(doc, 'Land Ownership Report', filters?.district ? `District: ${filters.district}` : 'All Districts');

  const tableData = lands.map(l => {
    const citizen = citizenMap.get(l.citizenId);
    return [
      l.id,
      citizen ? `${citizen.firstName} ${citizen.lastName}` : 'Unknown',
      l.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-$3'),
      l.surveyNumber,
      l.village,
      l.mandal,
      l.district,
      l.landType,
      l.extentInAcres.toFixed(2),
      `₹${l.marketValue.toLocaleString('en-IN')}`,
      l.encumbranceStatus,
      l.ownershipType,
    ];
  });

  autoTable(doc, {
    head: [['Record ID', 'Owner Name', 'Aadhaar (Masked)', 'Survey No.', 'Village', 'Mandal', 'District', 'Land Type', 'Extent (Ac)', 'Market Value', 'Encumbrance', 'Ownership']],
    body: tableData,
    startY: 50,
    headStyles: { fillColor: AP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });

  addPDFFooter(doc);
  doc.save(`Land_Ownership_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}

// ---- Vehicle Report PDF ----
export async function generateVehicleReportPDF(filters?: { vehicleType?: string }): Promise<void> {
  let vehicles = await vehicleDB.getAll();
  const citizens = await citizenDB.getAll();
  const citizenMap = new Map(citizens.map(c => [c.id, c]));
  if (filters?.vehicleType) vehicles = vehicles.filter(v => v.vehicleType === filters.vehicleType);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addPDFHeader(doc, 'Vehicle Registration Report', filters?.vehicleType ?? 'All Vehicles');

  const tableData = vehicles.map(v => {
    const citizen = citizenMap.get(v.citizenId);
    return [
      v.registrationNumber,
      citizen ? `${citizen.firstName} ${citizen.lastName}` : 'Unknown',
      v.vehicleType,
      v.make,
      v.model,
      v.year.toString(),
      v.color,
      v.fuelType,
      v.insuranceExpiry ?? 'N/A',
      v.marketValue ? `₹${v.marketValue.toLocaleString('en-IN')}` : 'N/A',
    ];
  });

  autoTable(doc, {
    head: [['Reg. Number', 'Owner Name', 'Type', 'Make', 'Model', 'Year', 'Color', 'Fuel', 'Insurance Expiry', 'Market Value']],
    body: tableData,
    startY: 50,
    headStyles: { fillColor: AP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });

  addPDFFooter(doc);
  doc.save(`Vehicle_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}

// ---- Complete Asset Report PDF (for one citizen) ----
export async function generateCitizenAssetReportPDF(citizenId: string): Promise<void> {
  const citizen = await citizenDB.getById(citizenId);
  if (!citizen) return;

  const [lands, properties, vehicles, rationCards] = await Promise.all([
    landDB.getByCitizenId(citizenId),
    propertyDB.getByCitizenId(citizenId),
    vehicleDB.getByCitizenId(citizenId),
    rationCardDB.getByCitizenId(citizenId),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  addPDFHeader(doc, 'Citizen Asset Summary Report', `${citizen.firstName} ${citizen.lastName}`);

  let y = 50;

  // Citizen Details section
  doc.setFillColor(...AP_BLUE);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CITIZEN DETAILS', 16, y + 5);
  y += 10;

  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const details = [
    [`Citizen ID: ${citizen.id}`, `Name: ${citizen.firstName} ${citizen.lastName}`],
    [`Aadhaar: ${citizen.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-$3')}`, `DOB: ${citizen.dateOfBirth} | Gender: ${citizen.gender}`],
    [`Mobile: ${citizen.mobile}`, `Email: ${citizen.email ?? 'N/A'}`],
    [`Address: ${citizen.address.doorNo}, ${citizen.address.street}, ${citizen.address.mandal}`, `District: ${citizen.address.district}, PIN: ${citizen.address.pincode}`],
  ];
  details.forEach(row => {
    doc.text(row[0], 14, y);
    doc.text(row[1], 110, y);
    y += 6;
  });
  y += 4;

  // Land Records
  if (lands.length > 0) {
    doc.setFillColor(...AP_GOLD);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(`LAND RECORDS (${lands.length})`, 16, y + 5);
    y += 9;

    autoTable(doc, {
      head: [['Survey No.', 'Village', 'Mandal', 'Type', 'Extent (Ac)', 'Market Value', 'Encumbrance']],
      body: lands.map(l => [l.surveyNumber, l.village, l.mandal, l.landType, l.extentInAcres.toFixed(2), `₹${l.marketValue.toLocaleString('en-IN')}`, l.encumbranceStatus]),
      startY: y,
      headStyles: { fillColor: [150, 100, 0], textColor: WHITE, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Properties
  if (properties.length > 0 && y < 250) {
    doc.setFillColor(...AP_GOLD);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(`HOUSE PROPERTIES (${properties.length})`, 16, y + 5);
    y += 9;

    autoTable(doc, {
      head: [['Property ID', 'Door No.', 'Type', 'Built-up Area (sqft)', 'Floors', 'Market Value', 'Encumbrance']],
      body: properties.map(p => [p.propertyId, `${p.doorNo}, ${p.street}`, p.propertyType, p.builtUpArea, p.floors, `₹${p.marketValue.toLocaleString('en-IN')}`, p.encumbranceStatus]),
      startY: y,
      headStyles: { fillColor: [150, 100, 0], textColor: WHITE, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Vehicles
  if (vehicles.length > 0 && y < 250) {
    doc.setFillColor(...AP_GOLD);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(`VEHICLES (${vehicles.length})`, 16, y + 5);
    y += 9;

    autoTable(doc, {
      head: [['Reg. Number', 'Type', 'Make & Model', 'Year', 'Color', 'Fuel', 'Ins. Expiry']],
      body: vehicles.map(v => [v.registrationNumber, v.vehicleType, `${v.make} ${v.model}`, v.year, v.color, v.fuelType, v.insuranceExpiry ?? 'N/A']),
      startY: y,
      headStyles: { fillColor: [150, 100, 0], textColor: WHITE, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Ration Cards
  if (rationCards.length > 0 && y < 260) {
    doc.setFillColor(...AP_GOLD);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(`RATION CARDS (${rationCards.length})`, 16, y + 5);
    y += 9;

    autoTable(doc, {
      head: [['Card Number', 'Type', 'Issued Date', 'Family Size', 'Shop', 'Rice (kg)', 'Status']],
      body: rationCards.map(r => [r.cardNumber, r.cardType, r.issuedDate, r.familySize, r.shop, r.monthlyEntitlement?.rice ?? 0, r.isActive ? 'Active' : 'Inactive']),
      startY: y,
      headStyles: { fillColor: [150, 100, 0], textColor: WHITE, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
  }

  addPDFFooter(doc);
  doc.save(`Citizen_Asset_Report_${citizen.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

// ---- Excel Export ----
export async function exportCitizensToExcel(): Promise<void> {
  const citizens = await citizenDB.getAll();
  const data = citizens.map(c => ({
    'Citizen ID': c.id,
    'First Name': c.firstName,
    'Last Name': c.lastName,
    'Father/Husband Name': c.fatherHusbandName,
    'Aadhaar Number': c.aadhaarNumber,
    'Date of Birth': c.dateOfBirth,
    'Gender': c.gender,
    'Mobile': c.mobile,
    'Email': c.email ?? '',
    'Door No': c.address.doorNo,
    'Street': c.address.street,
    'Village': c.address.village,
    'Mandal': c.address.mandal,
    'District': c.address.district,
    'Pincode': c.address.pincode,
    'Caste': c.caste ?? '',
    'Religion': c.religion ?? '',
    'Annual Income': c.annualIncome ?? '',
    'Status': c.isActive ? 'Active' : 'Inactive',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Citizens');
  XLSX.writeFile(wb, `Citizens_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

export async function exportLandsToExcel(): Promise<void> {
  const lands = await landDB.getAll();
  const citizens = await citizenDB.getAll();
  const citizenMap = new Map(citizens.map(c => [c.id, c]));

  const data = lands.map(l => {
    const c = citizenMap.get(l.citizenId);
    return {
      'Record ID': l.id,
      'Citizen ID': l.citizenId,
      'Owner Name': c ? `${c.firstName} ${c.lastName}` : 'Unknown',
      'Survey Number': l.surveyNumber,
      'Village': l.village,
      'Mandal': l.mandal,
      'District': l.district,
      'Land Type': l.landType,
      'Extent (Acres)': l.extentInAcres,
      'Market Value (₹)': l.marketValue,
      'Patta Number': l.pattaNumber ?? '',
      'Ownership Type': l.ownershipType,
      'Encumbrance': l.encumbranceStatus,
      'Registration Number': l.registrationNumber ?? '',
      'Registration Date': l.registrationDate ?? '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Land Records');
  XLSX.writeFile(wb, `Land_Records_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

export async function exportVehiclesToExcel(): Promise<void> {
  const vehicles = await vehicleDB.getAll();
  const citizens = await citizenDB.getAll();
  const citizenMap = new Map(citizens.map(c => [c.id, c]));

  const data = vehicles.map(v => {
    const c = citizenMap.get(v.citizenId);
    return {
      'Vehicle ID': v.id,
      'Owner Name': c ? `${c.firstName} ${c.lastName}` : 'Unknown',
      'Vehicle Type': v.vehicleType,
      'Registration Number': v.registrationNumber,
      'Make': v.make,
      'Model': v.model,
      'Variant': v.variant ?? '',
      'Year': v.year,
      'Color': v.color,
      'Fuel Type': v.fuelType,
      'Engine Number': v.engineNumber,
      'Chassis Number': v.chassisNumber,
      'Insurance Number': v.insuranceNumber ?? '',
      'Insurance Expiry': v.insuranceExpiry ?? '',
      'Market Value (₹)': v.marketValue ?? '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
  XLSX.writeFile(wb, `Vehicle_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

export async function exportRationCardsToExcel(): Promise<void> {
  const rcs = await rationCardDB.getAll();
  const citizens = await citizenDB.getAll();
  const citizenMap = new Map(citizens.map(c => [c.id, c]));

  const data = rcs.map(r => {
    const c = citizenMap.get(r.citizenId);
    return {
      'Record ID': r.id,
      'Card Number': r.cardNumber,
      'Owner Name': c ? `${c.firstName} ${c.lastName}` : 'Unknown',
      'Card Type': r.cardType,
      'Issued Date': r.issuedDate,
      'Expiry Date': r.expiryDate ?? '',
      'Family Size': r.familySize,
      'Head of Family': r.headOfFamily,
      'Shop Name': r.shop,
      'Shop Code': r.shopCode,
      'Rice (kg/month)': r.monthlyEntitlement?.rice ?? 0,
      'Wheat (kg/month)': r.monthlyEntitlement?.wheat ?? 0,
      'Status': r.isActive ? 'Active' : 'Inactive',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ration Cards');
  XLSX.writeFile(wb, `Ration_Cards_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
