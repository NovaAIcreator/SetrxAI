// projectRoutes.js
// Projects — chats ko groups mein organize karne ke liye

const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const pool = require('./db');

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name required' });
  }
  const result = await pool.query(
    'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *',
    [req.userId, name.trim()]
  );
  res.json(result.rows[0]);
});

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(result.rows);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ success: true });
});

module.exports = router;