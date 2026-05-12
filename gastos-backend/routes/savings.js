// gastos-backend/routes/savings.js
const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ── GOALS ────────────────────────────────────────────────────────────────────

// GET /savings/goals → todas las metas del usuario
router.get('/goals', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*,
        COALESCE(SUM(d.amount), 0) AS saved
       FROM savings_goals g
       LEFT JOIN savings_deposits d ON d.goal_id = g.id
       WHERE g.user_id = $1 AND g.active = true
       GROUP BY g.id
       ORDER BY g.created_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /savings/goals → crear meta
router.post('/goals', async (req, res) => {
  const { name, target, color, icon } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO savings_goals (user_id, name, target, color, icon)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name, target, color || '#5b50e8', icon || '🎯']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /savings/goals/:id → editar meta
router.put('/goals/:id', async (req, res) => {
  const { name, target, color, icon } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE savings_goals
       SET name=$1, target=$2, color=$3, icon=$4
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, target, color, icon, req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /savings/goals/:id → archivar meta (soft delete)
router.delete('/goals/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE savings_goals SET active=false WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DEPOSITS ─────────────────────────────────────────────────────────────────

// GET /savings/deposits/:goalId → depósitos de una meta
router.get('/deposits/:goalId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM savings_deposits
       WHERE goal_id=$1 AND user_id=$2
       ORDER BY date DESC, created_at DESC`,
      [req.params.goalId, req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /savings/deposits → agregar depósito
router.post('/deposits', async (req, res) => {
  const { goal_id, amount, note, date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO savings_deposits (user_id, goal_id, amount, note, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, goal_id, amount, note, date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /savings/deposits/:id → eliminar depósito
router.delete('/deposits/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM savings_deposits WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
