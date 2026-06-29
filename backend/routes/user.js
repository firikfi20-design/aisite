import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../models/db.js';

const router = express.Router();

const LIMITS = { free: 20, pro: 500, ultra: 99999 };

// Get user profile + usage stats
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const limit = LIMITS[user.plan] || 20;

    // Get subscription info
    const sub = await query(
      'SELECT plan, payment_method, expires_at FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    // Get chat count
    const chatCount = await query('SELECT COUNT(*) FROM chats WHERE user_id = $1', [user.id]);

    res.json({
      id: user.id,
      email: user.email,
      plan: user.plan,
      requests_used: user.requests_used,
      requests_limit: limit,
      requests_remaining: Math.max(0, limit - user.requests_used),
      reset_at: user.requests_reset_at,
      subscription: sub.rows[0] || null,
      stats: { total_chats: parseInt(chatCount.rows[0].count) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
