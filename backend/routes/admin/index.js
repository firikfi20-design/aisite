import express from 'express';
import { requireAdmin } from '../../middleware/admin.js';
import { query } from '../models/db.js';

const router = express.Router();
router.use(requireAdmin);

// ============================================================
// DASHBOARD — общая статистика
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const [users, revenue, chats, messages, newUsers, planDist] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query("SELECT COALESCE(SUM(amount_usd),0) AS total FROM subscriptions WHERE created_at > NOW() - INTERVAL '30 days'"),
      query('SELECT COUNT(*) FROM chats'),
      query('SELECT COUNT(*) FROM messages'),
      query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      query("SELECT plan, COUNT(*) FROM users GROUP BY plan"),
    ]);

    // Daily signups last 14 days
    const dailySignups = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    // Daily revenue last 14 days
    const dailyRevenue = await query(`
      SELECT DATE(created_at) as date, SUM(amount_usd) as amount
      FROM subscriptions WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    res.json({
      stats: {
        total_users: parseInt(users.rows[0].count),
        revenue_30d: parseFloat(revenue.rows[0].total),
        total_chats: parseInt(chats.rows[0].count),
        total_messages: parseInt(messages.rows[0].count),
        new_users_7d: parseInt(newUsers.rows[0].count),
      },
      plan_distribution: planDist.rows,
      daily_signups: dailySignups.rows,
      daily_revenue: dailyRevenue.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// USERS — управление пользователями
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', plan = '' } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); where += ` AND email ILIKE $${params.length}`; }
    if (plan)   { params.push(plan);           where += ` AND plan = $${params.length}`; }

    params.push(limit, offset);
    const result = await query(
      `SELECT id, email, plan, role, requests_used, created_at, requests_reset_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));

    res.json({ users: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменить план пользователя
router.patch('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'ultra'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    await query('UPDATE users SET plan = $1 WHERE id = $2', [plan, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменить роль пользователя
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot change own role' });
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сбросить лимит запросов пользователя
router.post('/users/:id/reset-requests', async (req, res) => {
  try {
    await query('UPDATE users SET requests_used = 0, requests_reset_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SITE SETTINGS — настройки сайта
// ============================================================
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM site_settings ORDER BY category, id');
    // Group by category
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const { updates } = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await query(
        'UPDATE site_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [String(value), key]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PLANS — управление планами
// ============================================================
router.get('/plans', async (req, res) => {
  try {
    const result = await query('SELECT * FROM plans ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { name, price_usd, price_stars, requests_per_day, features, is_active, is_featured } = req.body;
    await query(
      `UPDATE plans SET name=$1, price_usd=$2, price_stars=$3, requests_per_day=$4,
       features=$5, is_active=$6, is_featured=$7 WHERE id=$8`,
      [name, price_usd, price_stars, requests_per_day, JSON.stringify(features), is_active, is_featured, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { slug, name, price_usd, price_stars, requests_per_day, features } = req.body;
    const result = await query(
      'INSERT INTO plans (slug, name, price_usd, price_stars, requests_per_day, features) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [slug, name, price_usd, price_stars, requests_per_day, JSON.stringify(features || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await query('DELETE FROM plans WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PAYMENT METHODS — способы оплаты
// ============================================================
router.get('/payment-methods', async (req, res) => {
  try {
    const result = await query('SELECT * FROM payment_methods ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/payment-methods/:id', async (req, res) => {
  try {
    const { name, icon, config, is_active } = req.body;
    await query(
      'UPDATE payment_methods SET name=$1, icon=$2, config=$3, is_active=$4 WHERE id=$5',
      [name, icon, JSON.stringify(config), is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payment-methods', async (req, res) => {
  try {
    const { slug, name, type, icon, config, sort_order } = req.body;
    const result = await query(
      'INSERT INTO payment_methods (slug, name, type, icon, config, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [slug, name, type, icon || '💳', JSON.stringify(config || {}), sort_order || 99]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payment-methods/:id', async (req, res) => {
  try {
    await query('DELETE FROM payment_methods WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PROMO CODES — промокоды
// ============================================================
router.get('/promo-codes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/promo-codes', async (req, res) => {
  try {
    const { code, discount_type, discount_value, plan_slug, max_uses, expires_at } = req.body;
    const result = await query(
      'INSERT INTO promo_codes (code, discount_type, discount_value, plan_slug, max_uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [code.toUpperCase(), discount_type, discount_value, plan_slug || null, max_uses || 100, expires_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/promo-codes/:id/toggle', async (req, res) => {
  try {
    await query('UPDATE promo_codes SET is_active = NOT is_active WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/promo-codes/:id', async (req, res) => {
  try {
    await query('DELETE FROM promo_codes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ANNOUNCEMENTS — уведомления
// ============================================================
router.get('/announcements', async (req, res) => {
  try {
    const result = await query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const result = await query(
      'INSERT INTO announcements (title, message, type) VALUES ($1,$2,$3) RETURNING *',
      [title, message, type || 'info']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/announcements/:id/toggle', async (req, res) => {
  try {
    await query('UPDATE announcements SET is_active = NOT is_active WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SUBSCRIPTIONS — история платежей
// ============================================================
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT s.*, u.email FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = await query('SELECT COUNT(*) FROM subscriptions');
    res.json({ subscriptions: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
