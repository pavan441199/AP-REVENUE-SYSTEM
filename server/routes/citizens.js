const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToCitizen(row) {
  if (!row) return null;
  return {
    id: row.id,
    aadhaarNumber: row.aadhaar_number ? row.aadhaar_number.trim() : '',
    firstName: row.first_name,
    lastName: row.last_name,
    fatherHusbandName: row.father_husband_name,
    dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString().slice(0, 10) : '',
    gender: row.gender,
    mobile: row.mobile,
    email: row.email || undefined,
    address: {
      doorNo: row.door_no,
      street: row.street,
      village: row.village,
      mandal: row.mandal,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
    },
    caste: row.caste || undefined,
    religion: row.religion || undefined,
    annualIncome: row.annual_income ? Number(row.annual_income) : undefined,
    isActive: row.is_active,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

// GET /api/citizens
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM citizens ORDER BY id');
    res.json(rows.map(rowToCitizen));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/citizens/count
router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM citizens');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/citizens/aadhaar/:aadhaar
router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM citizens WHERE TRIM(aadhaar_number) = $1', [req.params.aadhaar]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToCitizen(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/citizens/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM citizens WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToCitizen(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/citizens
router.post('/', async (req, res) => {
  const c = req.body;
  try {
    await pool.query(`
      INSERT INTO citizens (id,aadhaar_number,first_name,last_name,father_husband_name,date_of_birth,gender,mobile,email,door_no,street,village,mandal,district,state,pincode,caste,religion,annual_income,is_active,created_by,updated_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
    `, [c.id,c.aadhaarNumber,c.firstName,c.lastName,c.fatherHusbandName,c.dateOfBirth,c.gender,c.mobile,c.email||null,c.address.doorNo,c.address.street,c.address.village,c.address.mandal,c.address.district,c.address.state,c.address.pincode,c.caste||null,c.religion||null,c.annualIncome||null,c.isActive,c.createdBy,c.updatedBy,c.createdAt,c.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM citizens WHERE id = $1', [c.id]);
    res.status(201).json(rowToCitizen(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/citizens/:id
router.put('/:id', async (req, res) => {
  const c = req.body;
  try {
    await pool.query(`
      UPDATE citizens SET aadhaar_number=$1,first_name=$2,last_name=$3,father_husband_name=$4,date_of_birth=$5,gender=$6,mobile=$7,email=$8,door_no=$9,street=$10,village=$11,mandal=$12,district=$13,state=$14,pincode=$15,caste=$16,religion=$17,annual_income=$18,is_active=$19,updated_by=$20,updated_at=$21
      WHERE id=$22
    `, [c.aadhaarNumber,c.firstName,c.lastName,c.fatherHusbandName,c.dateOfBirth,c.gender,c.mobile,c.email||null,c.address.doorNo,c.address.street,c.address.village,c.address.mandal,c.address.district,c.address.state,c.address.pincode,c.caste||null,c.religion||null,c.annualIncome||null,c.isActive,c.updatedBy,c.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM citizens WHERE id = $1', [req.params.id]);
    res.json(rowToCitizen(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/citizens/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM citizens WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
