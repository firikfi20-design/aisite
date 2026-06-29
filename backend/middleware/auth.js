import jwt from 'jsonwebtoken';
import { query } from '../models/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query('SELECT id, email, plan, requests_used, requests_reset_at FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has remaining requests
export const checkRequestLimit = async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  const resetAt = new Date(user.requests_reset_at);

  // Reset daily counter if 24h passed
  if (now - resetAt > 24 * 60 * 60 * 1000) {
    await query('UPDATE users SET requests_used = 0, requests_reset_at = NOW() WHERE id = $1', [user.id]);
    user.requests_used = 0;
  }

  const limits = { free: 20, pro: 500, ultra: 99999 };
  const limit = limits[user.plan] || 20;

  if (user.requests_used >= limit) {
    return res.status(429).json({
      error: 'limit_reached',
      message: 'Daily request limit reached',
      plan: user.plan,
      limit,
      used: user.requests_used
    });
  }

  next();
};
