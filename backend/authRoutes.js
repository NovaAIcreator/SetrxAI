cat > /home/claude/authRoutes_otp.js << 'EOF'
// authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('./db');
const authMiddleware = require('./authMiddleware');

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

function generate4DigitOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// OTPs memory mein store (simple, works fine for free tier)
const otpStore = new Map();

router.post('/signup', async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  email = normalizeEmail(email);
  name = name.trim();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'This email is already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(503).json({ error: 'Database unavailable, please try again later' });
  }
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  email = normalizeEmail(email);

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'This email is not registered' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(503).json({ error: 'Database unavailable, please try again later' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
      [name.trim(), req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Name update error:', err.message);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

router.patch('/me/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Password change error:', err.message);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

// ---- Step 1: OTP bhejo ----
router.post('/forgot-password', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  email = normalizeEmail(email);

  try {
    const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Security: registered ho ya na ho, same response
    if (!user) return res.json({ success: true });

    const otp = generate4DigitOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // OTP store karo
    otpStore.set(email, { otp, expiresAt, userId: user.id });

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"SetrxAI" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your SetrxAI password reset code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a12; color: #e4e4e7; border-radius: 16px;">
          <h2 style="color: #a855f7; margin-bottom: 8px;">SetrxAI</h2>
          <p>Hi ${user.name},</p>
          <p>Your password reset code is:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #a855f7;">${otp}</span>
          </div>
          <p style="color: #71717a; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(503).json({ error: 'Failed to send email, please try again' });
  }
});

// ---- Step 2: OTP verify karo ----
router.post('/verify-otp', async (req, res) => {
  let { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  email = normalizeEmail(email);

  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'No OTP requested for this email' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired, please request a new one' });
  }
  if (stored.otp !== otp.toString()) return res.status(400).json({ error: 'Incorrect OTP' });

  res.json({ success: true, verified: true });
});

// ---- Step 3: Naya password set karo ----
router.post('/reset-password', async (req, res) => {
  let { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  email = normalizeEmail(email);
  const stored = otpStore.get(email);

  if (!stored) return res.status(400).json({ error: 'OTP expired or not found, please start again' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired, please request a new one' });
  }
  if (stored.otp !== otp.toString()) return res.status(400).json({ error: 'Incorrect OTP' });

  try {
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, stored.userId]);
    otpStore.delete(email);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Account delete error:', err.message);
    res.status(503).json({ error: 'Could not delete account' });
  }
});

module.exports = router;
EOF
cp /home/claude/authRoutes_otp.js /mnt/user-data/outputs/authRoutes.js
echo done
