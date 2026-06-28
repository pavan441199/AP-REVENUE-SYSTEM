const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToLog(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    module: row.module,
    entityId: row.entity_id || undefined,
    entityType: row.entity_type || undefined,
    details: row.details,
    ipAddress: row.ip_address || undefined,
    timestamp: row.timestamp ? row.timestamp.toISOString() : '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    res.json(rows.map(rowToLog));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/recent', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
    res.json(rows.map(rowToLog));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const a = req.body;
  try {
    await pool.query(`
      INSERT INTO audit_logs (id,user_id,user_name,action,module,entity_id,entity_type,details,ip_address,timestamp)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING
    `, [a.id,a.userId,a.userName,a.action,a.module,a.entityId||null,a.entityType||null,a.details,a.ipAddress||null,a.timestamp||new Date().toISOString()]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
