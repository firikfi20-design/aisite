import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => console.log('✅ Database connected'));
pool.on('error', (err) => console.error('❌ Database error:', err));

export const query = (text, params) => pool.query(text, params);
export default pool;
