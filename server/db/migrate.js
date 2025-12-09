import fs from 'fs'
import { Pool } from 'pg'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL not set. Please export DATABASE_URL and retry.')
  process.exit(1)
}

const sqlPath = path.join(__dirname, 'init.sql')
if (!fs.existsSync(sqlPath)) {
  console.error('❌ db/init.sql not found')
  process.exit(1)
}
const sql = fs.readFileSync(sqlPath, 'utf8')

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

;(async () => {
  try {
    await pool.query(sql)
    console.log('✅ Migration done (schema + seed super admin)')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
})()
