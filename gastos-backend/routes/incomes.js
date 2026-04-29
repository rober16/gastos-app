const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// GET /incomes?month=2025-04
router.get('/', async (req, res) => {
  const { month } = req.query; // formato: YYYY-MM
  const userId = req.user.id;
  let query = 'SELECT * FROM incomes WHERE user_id = $1';
  const params = [userId];
  if (month) {
    query += ' AND to_char(date, \'YYYY-MM\') = $2';
    params.push(month);
  }
  query += ' ORDER BY date DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// POST /incomes
router.post('/', async (req, res) => {
  const { amount, type, description, date } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO incomes (user_id, amount, type, description, date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.id, amount, type, description, date || new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(rows[0]);
});

// DELETE /incomes/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM incomes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.status(204).send();
});

// PUT /incomes/:id
router.put('/:id', async (req, res) => {
  const { amount, type, description, date } = req.body;
  const { rows } = await pool.query(
    'UPDATE incomes SET amount=$1, type=$2, description=$3, date=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
    [amount, type, description, date, req.params.id, req.user.id]
  );
  res.json(rows[0]);
});

module.exports = router;