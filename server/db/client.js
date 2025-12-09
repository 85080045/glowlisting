import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pkg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL not set. Postgres will not be available.')
}

export const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : null

export const query = async (text, params) => {
  if (!pool) throw new Error('DATABASE_URL not configured')
  return pool.query(text, params)
}

// Ensure super admin exists with known password and 9999 balance
const ensureSuperAdmin = async () => {
  if (!pool) return
  const email = 'dingmason@gmail.com'
  // bcrypt hash for password: dy5878022
  const hash = '$2a$10$2703XbKuA8714QX00ULjJekUKwJDiFrq9dGDwn5uRqKYKbVGBCanK'
  try {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = true`,
      ['Super Admin', email, hash]
    )
    await pool.query(
      `INSERT INTO tokens_balance (user_id, balance)
         SELECT id, 9999 FROM users WHERE email=$1
       ON CONFLICT (user_id) DO UPDATE SET balance = 9999, updated_at = NOW()`,
      [email]
    )
    console.log('✅ Super admin ensured/updated')
  } catch (err) {
    console.error('❌ Failed to ensure super admin:', err.message)
  }
}

if (pool) {
  ensureSuperAdmin()
}
