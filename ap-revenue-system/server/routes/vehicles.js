const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToVehicle(row) {
  if (!row) return null;
  return {
    id: row.id,
    citizenId: row.citizen_id,
    aadhaarNumber: row.aadhaar_number ? row.aadhaar_number.trim() : '',
    vehicleType: row.vehicle_type,
    registrationNumber: row.registration_number,
    make: row.make,
    model: row.model,
    variant: row.variant || undefined,
    year: row.year,
    color: row.color,
    engineNumber: row.engine_number,
    chassisNumber: row.chassis_number,
    fuelType: row.fuel_type,
    seatingCapacity: row.seating_capacity || undefined,
    insuranceNumber: row.insurance_number || undefined,
    insuranceExpiry: row.insurance_expiry ? row.insurance_expiry.toISOString().slice(0, 10) : undefined,
    pollutionCertExpiry: row.pollution_cert_expiry ? row.pollution_cert_expiry.toISOString().slice(0, 10) : undefined,
    fitnessExpiry: row.fitness_expiry ? row.fitness_expiry.toISOString().slice(0, 10) : undefined,
    taxValidTill: row.tax_valid_till ? row.tax_valid_till.toISOString().slice(0, 10) : undefined,
    marketValue: row.market_value ? Number(row.market_value) : undefined,
    remarks: row.remarks || undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY id');
    res.json(rows.map(rowToVehicle));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM vehicles');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/citizen/:citizenId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE citizen_id = $1 ORDER BY id', [req.params.citizenId]);
    res.json(rows.map(rowToVehicle));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE TRIM(aadhaar_number) = $1 ORDER BY id', [req.params.aadhaar]);
    res.json(rows.map(rowToVehicle));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToVehicle(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const v = req.body;
  try {
    await pool.query(`
      INSERT INTO vehicles (id,citizen_id,aadhaar_number,vehicle_type,registration_number,make,model,variant,year,color,engine_number,chassis_number,fuel_type,seating_capacity,insurance_number,insurance_expiry,pollution_cert_expiry,fitness_expiry,tax_valid_till,market_value,remarks,created_by,updated_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    `, [v.id,v.citizenId,v.aadhaarNumber,v.vehicleType,v.registrationNumber,v.make,v.model,v.variant||null,v.year,v.color,v.engineNumber,v.chassisNumber,v.fuelType,v.seatingCapacity||null,v.insuranceNumber||null,v.insuranceExpiry||null,v.pollutionCertExpiry||null,v.fitnessExpiry||null,v.taxValidTill||null,v.marketValue||null,v.remarks||null,v.createdBy,v.updatedBy,v.createdAt,v.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [v.id]);
    res.status(201).json(rowToVehicle(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  const v = req.body;
  try {
    await pool.query(`
      UPDATE vehicles SET citizen_id=$1,aadhaar_number=$2,vehicle_type=$3,registration_number=$4,make=$5,model=$6,variant=$7,year=$8,color=$9,engine_number=$10,chassis_number=$11,fuel_type=$12,seating_capacity=$13,insurance_number=$14,insurance_expiry=$15,pollution_cert_expiry=$16,fitness_expiry=$17,tax_valid_till=$18,market_value=$19,remarks=$20,updated_by=$21,updated_at=$22 WHERE id=$23
    `, [v.citizenId,v.aadhaarNumber,v.vehicleType,v.registrationNumber,v.make,v.model,v.variant||null,v.year,v.color,v.engineNumber,v.chassisNumber,v.fuelType,v.seatingCapacity||null,v.insuranceNumber||null,v.insuranceExpiry||null,v.pollutionCertExpiry||null,v.fitnessExpiry||null,v.taxValidTill||null,v.marketValue||null,v.remarks||null,v.updatedBy,v.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    res.json(rowToVehicle(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
