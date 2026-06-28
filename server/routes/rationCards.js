const express = require('express');
const router = express.Router();
const pool = require('../db');

function rowToRationCard(row) {
  if (!row) return null;
  return {
    id: row.id,
    citizenId: row.citizen_id,
    aadhaarNumber: row.aadhaar_number ? row.aadhaar_number.trim() : '',
    cardNumber: row.card_number,
    cardType: row.card_type,
    issuedDate: row.issued_date ? row.issued_date.toISOString().slice(0, 10) : '',
    expiryDate: row.expiry_date ? row.expiry_date.toISOString().slice(0, 10) : undefined,
    familySize: row.family_size,
    headOfFamily: row.head_of_family,
    shop: row.shop,
    shopCode: row.shop_code,
    monthlyEntitlement: {
      rice: row.rice_entitlement ? Number(row.rice_entitlement) : undefined,
      wheat: row.wheat_entitlement ? Number(row.wheat_entitlement) : undefined,
      sugar: row.sugar_entitlement ? Number(row.sugar_entitlement) : undefined,
      kerosene: row.kerosene_entitlement ? Number(row.kerosene_entitlement) : undefined,
    },
    isActive: row.is_active,
    remarks: row.remarks || undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ration_cards ORDER BY id');
    res.json(rows.map(rowToRationCard));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM ration_cards');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/citizen/:citizenId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ration_cards WHERE citizen_id = $1 ORDER BY id', [req.params.citizenId]);
    res.json(rows.map(rowToRationCard));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ration_cards WHERE TRIM(aadhaar_number) = $1 ORDER BY id', [req.params.aadhaar]);
    res.json(rows.map(rowToRationCard));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ration_cards WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToRationCard(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  const rc = req.body;
  const me = rc.monthlyEntitlement || {};
  try {
    await pool.query(`
      INSERT INTO ration_cards (id,citizen_id,aadhaar_number,card_number,card_type,issued_date,expiry_date,family_size,head_of_family,shop,shop_code,rice_entitlement,wheat_entitlement,sugar_entitlement,kerosene_entitlement,is_active,remarks,created_by,updated_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    `, [rc.id,rc.citizenId,rc.aadhaarNumber,rc.cardNumber,rc.cardType,rc.issuedDate,rc.expiryDate||null,rc.familySize,rc.headOfFamily,rc.shop,rc.shopCode,me.rice||null,me.wheat||null,me.sugar||null,me.kerosene||null,rc.isActive,rc.remarks||null,rc.createdBy,rc.updatedBy,rc.createdAt,rc.updatedAt]);
    const { rows } = await pool.query('SELECT * FROM ration_cards WHERE id = $1', [rc.id]);
    res.status(201).json(rowToRationCard(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  const rc = req.body;
  const me = rc.monthlyEntitlement || {};
  try {
    await pool.query(`
      UPDATE ration_cards SET citizen_id=$1,aadhaar_number=$2,card_number=$3,card_type=$4,issued_date=$5,expiry_date=$6,family_size=$7,head_of_family=$8,shop=$9,shop_code=$10,rice_entitlement=$11,wheat_entitlement=$12,sugar_entitlement=$13,kerosene_entitlement=$14,is_active=$15,remarks=$16,updated_by=$17,updated_at=$18 WHERE id=$19
    `, [rc.citizenId,rc.aadhaarNumber,rc.cardNumber,rc.cardType,rc.issuedDate,rc.expiryDate||null,rc.familySize,rc.headOfFamily,rc.shop,rc.shopCode,me.rice||null,me.wheat||null,me.sugar||null,me.kerosene||null,rc.isActive,rc.remarks||null,rc.updatedBy,rc.updatedAt,req.params.id]);
    const { rows } = await pool.query('SELECT * FROM ration_cards WHERE id = $1', [req.params.id]);
    res.json(rowToRationCard(rows[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ration_cards WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
