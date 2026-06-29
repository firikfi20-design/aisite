import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../models/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await query(
      'INSERT INTO users (email, password_hash, referral_code) VALUES ($1, $2, $3) RETURNING id, email, plan',
      [email.toLowerCase(), hash, referralCode]
    );
    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user.id), user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      token: generateToken(user.id),
      user: { id: user.id, email: user.email, plan: user.plan, requests_used: user.requests_used }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  const limits = { free: 20, pro: 500, ultra: 99999 };
  // fetch role too
  const full = await query('SELECT id, email, plan, role, requests_used, requests_reset_at FROM users WHERE id = $1', [req.user.id]);
  const u = full.rows[0];
  res.json({
    ...u,
    limit: limits[u.plan] || 20,
    requests_remaining: (limits[u.plan] || 20) - u.requests_used
  });
});

export default router;
