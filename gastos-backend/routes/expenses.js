const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// GET /expenses?month=2025-04
router.get('/', async (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  let query = 'SELECT * FROM expenses WHERE user_id = $1';
  const params = [userId];
  if (month) {
    query += ' AND to_char(date, \'YYYY-MM\') = $2';
    params.push(month);
  }
  query += ' ORDER BY date DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// POST /expenses
router.post('/', async (req, res) => {
  const { amount, category, subcategory, description, date } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO expenses (user_id, amount, category, subcategory, description, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.user.id, amount, category, subcategory, description, date || new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(rows[0]);
});

// PUT /expenses/:id
router.put('/:id', async (req, res) => {
  const { amount, category, subcategory, description, date } = req.body;
  const { rows } = await pool.query(
    'UPDATE expenses SET amount=$1, category=$2, subcategory=$3, description=$4, date=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
    [amount, category, subcategory, description, date, req.params.id, req.user.id]
  );
  res.json(rows[0]);
});

// DELETE /expenses/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.status(204).send();
});

module.exports = router;