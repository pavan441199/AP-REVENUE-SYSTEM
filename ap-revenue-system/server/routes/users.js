const express = require('express');
const router = express.Router();
const pool = require('../db');
const CryptoJS = require('crypto-js');

function md5(str) { return CryptoJS.MD5(str).toString(); }

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    fullName: row.full_name,
    designation: row.designation,
    district: row.district,
    mandal: row.mandal,
    email: row.email,
    mobile: row.mobile,
    isActive: row.is_active,
    lastLogin: row.last_login ? row.last_login.toISOString() : undefined,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(rows.map(rowToUser));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/users/userid/:userId
router.get('/userid/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.params.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToUser(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToUser(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const u = req.body;
  try {
    await pool.query(`
      INSERT INTO users (id,user_id,username,password_hash,role,full_name,designation,district,mandal,email,mobile,is_active,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    `, [u.id,u.userId,u.username,u.passwordHash,u.role,u.fullName,u.designation,u.district,u.mandal,u.email,u.mobile,u.isActive,u.createdAt,u.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [u.id]);
    res.status(201).json(rowToUser(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  const u = req.body;
  try {
    await pool.query(`
      UPDATE users SET username=$1,role=$2,full_name=$3,designation=$4,district=$5,mandal=$6,email=$7,mobile=$8,is_active=$9,updated_at=$10 WHERE id=$11
    `, [u.username,u.role,u.fullName,u.designation,u.district,u.mandal,u.email,u.mobile,u.isActive,u.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(rowToUser(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/users/:id/password
router.put('/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
  try {
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [md5(newPassword), req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
