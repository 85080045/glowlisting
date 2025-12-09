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
