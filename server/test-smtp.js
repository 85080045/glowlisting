/**
 * SMTP connectivity test
 * Usage: cd server && node test-smtp.js
 * Loads .env from server directory and tries to connect (no email sent).
 */
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpSecure = process.env.SMTP_SECURE === 'true'

console.log('SMTP connectivity test')
console.log('----------------------')
console.log('SMTP_HOST:', smtpHost || '(not set)')
console.log('SMTP_PORT:', smtpPort || '(not set)')
console.log('SMTP_USER:', smtpUser ? `${smtpUser.substring(0, 3)}***` : '(not set)')
console.log('SMTP_PASS:', smtpPass ? '***' : '(not set)')
console.log('SMTP_SECURE:', smtpSecure)
console.log('')

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
  console.error('❌ Missing env: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in server/.env')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(smtpPort, 10),
  secure: smtpSecure,
  requireTLS: !smtpSecure && parseInt(smtpPort, 10) === 587,
  auth: { user: smtpUser, pass: smtpPass },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
})

try {
  await transporter.verify()
  console.log('✅ SMTP connection successful. Server is reachable and credentials are accepted.')
} catch (err) {
  console.error('❌ SMTP connection failed')
  console.error('   Code:', err.code)
  console.error('   Message:', err.message)
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    console.error('')
    console.error('   Tip: Try SMTP_PORT=587 and SMTP_SECURE=false (many clouds allow 587).')
  }
  process.exit(1)
}

process.exit(0)
