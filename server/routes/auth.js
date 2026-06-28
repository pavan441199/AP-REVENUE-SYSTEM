const express = require('express');
const router = express.Router();
const pool = require('../db');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

function md5(str) {
  return CryptoJS.MD5(str).toString();
}

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE (username = $1 OR user_id = $1) AND is_active = true',
      [username]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
    const hash = md5(password);
    if (hash !== user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    return res.json({ success: true, user: rowToUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, password, fullName, role, designation, district, mandal, email, mobile } = req.body;
  if (!username || !password || !fullName || !role) {
    return res.status(400).json({ success: false, error: 'Required fields missing' });
  }
  try {
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }
    const id = `USR${Date.now()}`;
    const userId = `usr_${uuidv4().slice(0, 8)}`;
    const passwordHash = md5(password);
    const now = new Date().toISOString();
    await pool.query(`
      INSERT INTO users (id,user_id,username,password_hash,role,full_name,designation,district,mandal,email,mobile,is_active,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12,$13)
    `, [id, userId, username, passwordHash, role, fullName, designation || '', district || '', mandal || '', email || '', mobile || '', now, now]);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.json({ success: true, user: rowToUser(rows[0]) });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
