// authRoutes.js
// Signup, Login, /me, aur ab Delete Account — sab try/catch ke saath, kabhi crash nahi karega

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const authMiddleware = require('./authMiddleware');

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

router.post('/signup', async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email aur password zaroori hai' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password kam se kam 6 characters ka hona chahiye' });
  }

  email = normalizeEmail(email);
  name = name.trim();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ye email pehle se registered hai' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err.message || err);
    res.status(503).json({ error: 'Database abhi available nahi hai, thodi der baad try karo' });
  }
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email aur password zaroori hai' });
  }

  email = normalizeEmail(email);

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Ye email registered nahi hai' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password galat hai' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message || err);
    res.status(503).json({ error: 'Database abhi available nahi hai, thodi der baad try karo' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me endpoint error:', err.message || err);
    // 503 = "database issue" — token invalid nahi hai, isliye 401 nahi bhejna
    res.status(503).json({ error: 'Database abhi available nahi hai' });
  }
});

// ---- Naam update karna (Profile → Account) ----
router.patch('/me', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naam khaali nahi ho sakta' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
      [name.trim(), req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Name update error:', err.message || err);
    res.status(503).json({ error: 'Database abhi available nahi hai' });
  }
});

// ---- Password change karna (Profile → Security) ----
router.patch('/me/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current aur new password dono zaroori hain' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Naya password kam se kam 6 characters ka hona chahiye' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password galat hai' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Password change error:', err.message || err);
    res.status(503).json({ error: 'Database abhi available nahi hai' });
  }
});

// ---- Account permanently delete karna (Profile → Delete Account) ----
// NOTE: sessions/projects/generated_images tables agar users(id) ko
// ON DELETE CASCADE ke saath reference karte hain, to wo bhi apne aap
// delete ho jaayenge. Agar cascade set nahi hai, to unhe pehle manually
// delete karna padega — apna schema check kar lena.
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Account delete error:', err.message || err);
    res.status(503).json({ error: 'Account delete nahi ho paya — thodi der baad try karo' });
  }
});

module.exports = router;