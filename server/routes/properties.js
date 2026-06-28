const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    citizenId: row.citizen_id,
    aadhaarNumber: row.aadhaar_number ? row.aadhaar_number.trim() : '',
    propertyId: row.property_id,
    doorNo: row.door_no,
    street: row.street,
    village: row.village,
    mandal: row.mandal,
    district: row.district,
    propertyType: row.property_type,
    builtUpArea: Number(row.built_up_area),
    plotArea: row.plot_area ? Number(row.plot_area) : undefined,
    floors: row.floors,
    constructionYear: row.construction_year || undefined,
    marketValue: Number(row.market_value),
    annualRentalValue: row.annual_rental_value ? Number(row.annual_rental_value) : undefined,
    registrationNumber: row.registration_number || undefined,
    registrationDate: row.registration_date ? row.registration_date.toISOString().slice(0, 10) : undefined,
    encumbranceStatus: row.encumbrance_status,
    remarks: row.remarks || undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM house_properties ORDER BY id');
    res.json(rows.map(rowToProperty));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM house_properties');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/citizen/:citizenId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM house_properties WHERE citizen_id = $1 ORDER BY id', [req.params.citizenId]);
    res.json(rows.map(rowToProperty));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM house_properties WHERE TRIM(aadhaar_number) = $1 ORDER BY id', [req.params.aadhaar]);
    res.json(rows.map(rowToProperty));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM house_properties WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToProperty(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const p = req.body;
  try {
    await pool.query(`
      INSERT INTO house_properties (id,citizen_id,aadhaar_number,property_id,door_no,street,village,mandal,district,property_type,built_up_area,plot_area,floors,construction_year,market_value,annual_rental_value,registration_number,registration_date,encumbrance_status,remarks,created_by,updated_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
    `, [p.id,p.citizenId,p.aadhaarNumber,p.propertyId,p.doorNo,p.street,p.village,p.mandal,p.district,p.propertyType,p.builtUpArea,p.plotArea||null,p.floors,p.constructionYear||null,p.marketValue,p.annualRentalValue||null,p.registrationNumber||null,p.registrationDate||null,p.encumbranceStatus,p.remarks||null,p.createdBy,p.updatedBy,p.createdAt,p.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM house_properties WHERE id = $1', [p.id]);
    res.status(201).json(rowToProperty(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  const p = req.body;
  try {
    await pool.query(`
      UPDATE house_properties SET citizen_id=$1,aadhaar_number=$2,property_id=$3,door_no=$4,street=$5,village=$6,mandal=$7,district=$8,property_type=$9,built_up_area=$10,plot_area=$11,floors=$12,construction_year=$13,market_value=$14,annual_rental_value=$15,registration_number=$16,registration_date=$17,encumbrance_status=$18,remarks=$19,updated_by=$20,updated_at=$21 WHERE id=$22
    `, [p.citizenId,p.aadhaarNumber,p.propertyId,p.doorNo,p.street,p.village,p.mandal,p.district,p.propertyType,p.builtUpArea,p.plotArea||null,p.floors,p.constructionYear||null,p.marketValue,p.annualRentalValue||null,p.registrationNumber||null,p.registrationDate||null,p.encumbranceStatus,p.remarks||null,p.updatedBy,p.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM house_properties WHERE id = $1', [req.params.id]);
    res.json(rowToProperty(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM house_properties WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
