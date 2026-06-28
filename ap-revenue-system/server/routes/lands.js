const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToLand(row) {
  if (!row) return null;
  return {
    id: row.id,
    citizenId: row.citizen_id,
    aadhaarNumber: row.aadhaar_number ? row.aadhaar_number.trim() : '',
    surveyNumber: row.survey_number,
    subDivision: row.sub_division || undefined,
    village: row.village,
    mandal: row.mandal,
    district: row.district,
    landType: row.land_type,
    extentInAcres: Number(row.extent_in_acres),
    marketValue: Number(row.market_value),
    pattaNumber: row.patta_number || undefined,
    registrationNumber: row.registration_number || undefined,
    registrationDate: row.registration_date ? row.registration_date.toISOString().slice(0, 10) : undefined,
    ownershipType: row.ownership_type,
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
    const { rows } = await pool.query('SELECT * FROM land_records ORDER BY id');
    res.json(rows.map(rowToLand));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM land_records');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/citizen/:citizenId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM land_records WHERE citizen_id = $1 ORDER BY id', [req.params.citizenId]);
    res.json(rows.map(rowToLand));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM land_records WHERE TRIM(aadhaar_number) = $1 ORDER BY id', [req.params.aadhaar]);
    res.json(rows.map(rowToLand));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM land_records WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToLand(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const l = req.body;
  try {
    await pool.query(`
      INSERT INTO land_records (id,citizen_id,aadhaar_number,survey_number,sub_division,village,mandal,district,land_type,extent_in_acres,market_value,patta_number,registration_number,registration_date,ownership_type,encumbrance_status,remarks,created_by,updated_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    `, [l.id,l.citizenId,l.aadhaarNumber,l.surveyNumber,l.subDivision||null,l.village,l.mandal,l.district,l.landType,l.extentInAcres,l.marketValue,l.pattaNumber||null,l.registrationNumber||null,l.registrationDate||null,l.ownershipType,l.encumbranceStatus,l.remarks||null,l.createdBy,l.updatedBy,l.createdAt,l.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM land_records WHERE id = $1', [l.id]);
    res.status(201).json(rowToLand(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  const l = req.body;
  try {
    await pool.query(`
      UPDATE land_records SET citizen_id=$1,aadhaar_number=$2,survey_number=$3,sub_division=$4,village=$5,mandal=$6,district=$7,land_type=$8,extent_in_acres=$9,market_value=$10,patta_number=$11,registration_number=$12,registration_date=$13,ownership_type=$14,encumbrance_status=$15,remarks=$16,updated_by=$17,updated_at=$18 WHERE id=$19
    `, [l.citizenId,l.aadhaarNumber,l.surveyNumber,l.subDivision||null,l.village,l.mandal,l.district,l.landType,l.extentInAcres,l.marketValue,l.pattaNumber||null,l.registrationNumber||null,l.registrationDate||null,l.ownershipType,l.encumbranceStatus,l.remarks||null,l.updatedBy,l.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM land_records WHERE id = $1', [req.params.id]);
    res.json(rowToLand(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM land_records WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
