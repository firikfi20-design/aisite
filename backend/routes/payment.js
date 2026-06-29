import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../models/db.js';

const router = express.Router();

const PLANS = {
  pro: { price_usd: 9, stars: 500, days: 30 },
  ultra: { price_usd: 29, stars: 1500, days: 30 }
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// --- TELEGRAM STARS ---
// Generate a Telegram payment link
router.post('/telegram/create', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const p = PLANS[plan];
    // Create invoice via Telegram Bot API
    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `AI Site ${plan.toUpperCase()} Plan`,
          description: `${p.days} days of ${plan} access`,
          payload: JSON.stringify({ userId: req.user.id, plan }),
          currency: 'XTR',   // Telegram Stars currency code
          prices: [{ label: `${plan} plan`, amount: p.stars }]
        })
      }
    );
    const data = await tgRes.json();
    if (!data.ok) return res.status(500).json({ error: 'Could not create Telegram invoice', details: data });

    res.json({ invoice_url: data.result, stars_amount: p.stars });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telegram webhook (receives payment confirmation)
router.post('/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    // Successful payment event
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);
      const { userId, plan } = payload;
      const p = PLANS[plan];

      // Activate subscription
      const expiresAt = new Date(Date.now() + p.days * 24 * 60 * 60 * 1000);
      await query('UPDATE users SET plan = $1 WHERE id = $2', [plan, userId]);
      await query(
        'INSERT INTO subscriptions (user_id, plan, payment_method, payment_tx_id, amount_usd, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [userId, plan, 'telegram_stars', payment.telegram_payment_charge_id, p.price_usd, expiresAt]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- CRYPTO (via NOWPayments) ---
router.post('/crypto/create', authenticate, async (req, res) => {
  try {
    const { plan, currency = 'usdttrc20' } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const p = PLANS[plan];
    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: p.price_usd,
        price_currency: 'usd',
        pay_currency: currency,
        order_id: `${req.user.id}_${plan}_${Date.now()}`,
        order_description: `${plan} plan for user ${req.user.id}`,
        ipn_callback_url: `${process.env.BACKEND_URL}/api/payment/crypto/webhook`
      })
    });
    const data = await response.json();
    if (data.id) {
      res.json({
        payment_id: data.id,
        pay_address: data.pay_address,
        pay_amount: data.pay_amount,
        pay_currency: data.pay_currency,
        expires_at: data.expiration_estimate_date
      });
    } else {
      res.status(500).json({ error: 'Could not create crypto payment', details: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crypto webhook (NOWPayments IPN)
router.post('/crypto/webhook', async (req, res) => {
  try {
    const { payment_status, order_id, price_amount } = req.body;
    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      return res.json({ ok: true }); // not done yet
    }

    const [userId, plan] = order_id.split('_');
    const p = PLANS[plan];
    if (!p) return res.status(400).json({ error: 'Invalid plan in order' });

    const expiresAt = new Date(Date.now() + p.days * 24 * 60 * 60 * 1000);
    await query('UPDATE users SET plan = $1 WHERE id = $2', [plan, userId]);
    await query(
      'INSERT INTO subscriptions (user_id, plan, payment_method, amount_usd, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [userId, plan, 'crypto', price_amount, expiresAt]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Crypto webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
