import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import paymentRoutes from './routes/payment.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Init DB
app.get('/api/init-db', async (req, res) => {
  const { query } = await import('./models/db.js');
  await query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, plan VARCHAR(20) DEFAULT 'free', requests_used INT DEFAULT 0, requests_reset_at TIMESTAMP DEFAULT NOW(), referral_code VARCHAR(20) UNIQUE, referred_by INT REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS chats (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(255) DEFAULT 'New chat', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, chat_id INT REFERENCES chats(id) ON DELETE CASCADE, role VARCHAR(10) NOT NULL, content TEXT NOT NULL, model_used VARCHAR(50), tokens_used INT DEFAULT 0, created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, plan VARCHAR(20) NOT NULL, payment_method VARCHAR(30), payment_tx_id VARCHAR(255), amount_usd DECIMAL(10,2), starts_at TIMESTAMP DEFAULT NOW(), expires_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  res.json({ ok: true, message: 'Database initialized!' });
});
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
