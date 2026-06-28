const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      citizenCount,
      landCount,
      propCount,
      vehCount,
      rcCount,
      recentLogs,
      districtRows,
      landTypeRows,
      vehTypeRows,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM citizens'),
      pool.query('SELECT COUNT(*) FROM land_records'),
      pool.query('SELECT COUNT(*) FROM house_properties'),
      pool.query('SELECT COUNT(*) FROM vehicles'),
      pool.query('SELECT COUNT(*) FROM ration_cards'),
      pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8'),
      pool.query('SELECT district, COUNT(*) as count FROM citizens GROUP BY district ORDER BY count DESC LIMIT 8'),
      pool.query('SELECT land_type as type, COUNT(*) as count FROM land_records GROUP BY land_type'),
      pool.query('SELECT vehicle_type as type, COUNT(*) as count FROM vehicles GROUP BY vehicle_type'),
    ]);

    const recentActivity = recentLogs.rows.map(row => ({
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
    }));

    res.json({
      totalCitizens: parseInt(citizenCount.rows[0].count),
      totalLands: parseInt(landCount.rows[0].count),
      totalProperties: parseInt(propCount.rows[0].count),
      totalVehicles: parseInt(vehCount.rows[0].count),
      totalRationCards: parseInt(rcCount.rows[0].count),
      recentActivity,
      districtWiseCitizens: districtRows.rows.map(r => ({ district: r.district, count: parseInt(r.count) })),
      landTypeDistribution: landTypeRows.rows.map(r => ({ type: r.type, count: parseInt(r.count) })),
      vehicleTypeDistribution: vehTypeRows.rows.map(r => ({ type: r.type, count: parseInt(r.count) })),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
