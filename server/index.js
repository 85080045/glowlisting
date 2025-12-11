import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import heicConvert from 'heic-convert'
import crypto from 'crypto'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import sgMail from '@sendgrid/mail'
import bcrypt from 'bcryptjs'
import { query } from './db/client.js'
import geoip from 'geoip-lite'
import { WebSocketServer } from 'ws'

// 加载环境变量
dotenv.config()
const useDb = !!process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET || 'glowlisting-stable-secret-change-in-prod'
const wsClients = new Map() // userId -> Set<WebSocket>
import {
  authMiddleware,
  registerUser,
  loginUser,
  getUserById,
  getUserTokens,
  setUserTokens,
  decrementUserTokens,
  recordTokenUsage,
  generateToken,
  getAllUsers,
  getActiveSessionsCount,
  addActiveSession,
  removeActiveSession,
  getTokenUsageStats,
  getRevenueStats,
  getSubscriptionStats,
  deleteUser,
  toggleUserAdmin,
  addTokensToUser,
  getChartData,
  users,
  getUserByEmail,
  // async db helpers
  getUserByIdAsync,
  getUserByEmailAsync,
  getUserTokensAsync,
  setUserTokensAsync,
  decrementUserTokensAsync,
  recordTokenUsageAsync,
  getAllUsersAsync,
  getTokenUsageStatsAsync,
  getRevenueStatsAsync,
  getSubscriptionStatsAsync,
  deleteUserAsync,
  toggleUserAdminAsync,
  addTokensToUserAsync,
  getChartDataAsync,
} from './auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = app.listen(PORT, () => {
  console.log(`🚀 GlowListing API 服务器运行在 http://localhost:${PORT}`)
  console.log(`📝 已配置 nanobanna API 进行图像增强`)
  console.log(`📧 SMTP配置: ${process.env.SMTP_HOST || '未配置'}`)
  if (useDb) {
    console.log(`🗄️  数据库连接: 已配置`)
  }
})
const PORT = process.env.PORT || 3001

// Helper wrappers to support DB or in-memory
const getUserByIdSafe = async (id) => useDb ? await getUserByIdAsync(id) : getUserById(id)
const getUserByEmailSafe = async (email) => useDb ? await getUserByEmailAsync(email) : getUserByEmail(email)
const getUserTokensSafe = async (id) => useDb ? await getUserTokensAsync(id) : getUserTokens(id)
const setUserTokensSafe = async (id, amount) => useDb ? await setUserTokensAsync(id, amount) : setUserTokens(id, amount)
const decrementUserTokensSafe = async (id, action) => useDb ? await decrementUserTokensAsync(id, action) : decrementUserTokens(id, action)
const recordTokenUsageSafe = async (id, action, imageId) => useDb ? await recordTokenUsageAsync(id, action, imageId) : recordTokenUsage(id, action, imageId)
const getAllUsersSafe = async () => useDb ? await getAllUsersAsync() : getAllUsers()
const getTokenUsageStatsSafe = async (s, e) => useDb ? await getTokenUsageStatsAsync(s, e) : getTokenUsageStats(s, e)
const getRevenueStatsSafe = async (s, e) => useDb ? await getRevenueStatsAsync(s, e) : getRevenueStats(s, e)
const getSubscriptionStatsSafe = async () => useDb ? await getSubscriptionStatsAsync() : getSubscriptionStats()
const deleteUserSafe = async (id) => useDb ? await deleteUserAsync(id) : deleteUser(id)
const toggleUserAdminSafe = async (id) => useDb ? await toggleUserAdminAsync(id) : toggleUserAdmin(id)
const addTokensToUserSafe = async (id, amount) => useDb ? await addTokensToUserAsync(id, amount) : addTokensToUser(id, amount)
const getChartDataSafe = async (s, e) => useDb ? await getChartDataAsync(s, e) : getChartData(s, e)

// 审计日志辅助函数
const logAdminAction = async (adminUserId, action, targetUserId = null, details = null, req = null) => {
  if (!useDb) return // 只在有数据库时记录
  
  try {
    const ipAddress = req?.headers['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || null
    const userAgent = req?.headers['user-agent'] || null
    
    await query(
      `INSERT INTO admin_audit_logs (admin_user_id, action, target_user_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminUserId, action, targetUserId, details ? JSON.stringify(details) : null, ipAddress, userAgent]
    )
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // 不抛出错误，避免影响主要功能
  }
}

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const NANOBANNA_API_KEY = process.env.NANOBANNA_API_KEY
const NANOBANNA_API_URL = process.env.NANOBANNA_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

// 记录关键配置状态（不输出敏感值）
console.log(`[Config] DATABASE_URL: ${useDb ? 'set' : 'not set'}`)
console.log(`[Config] NANOBANNA_API_KEY: ${NANOBANNA_API_KEY ? 'set' : 'not set'}`)
console.log(`[Config] STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY ? 'set' : 'not set'}`)

// Stripe plan constants
// 如果设置了环境变量 STRIPE_PRICE_ID_PRO 和 STRIPE_PRICE_ID_PACK，将使用这些 Price ID
// 否则将使用 price_data 动态创建价格
const PLAN_PRO = {
  id: 'glowlisting_pro',
  name: 'GlowListing Pro',
  amount: 2900, // cents ($29.00)
  currency: 'usd',
  interval: 'month',
  imagesPerMonth: 100,
  priceId: process.env.STRIPE_PRICE_ID_PRO, // 可选：Stripe Dashboard 中的 Price ID
}

const PACK_ONETIME = {
  id: 'one_time_photo_pack',
  name: 'One-Time Photo Pack',
  amount: 2900, // cents ($29.00)
  currency: 'usd',
  images: 25,
  priceId: process.env.STRIPE_PRICE_ID_PACK, // 可选：Stripe Dashboard 中的 Price ID
}

// 存储每张原始图片的重新生成次数（基于图片hash）
// 格式: { imageHash: { regenerateCount: number, originalImageId: string } }
const imageRegenerateMap = new Map()

// 最大重新生成次数
const MAX_REGENERATE_COUNT = 3

// 存储邮箱验证码（生产环境应使用Redis等）
// 格式: { email: { code: string, expiresAt: number } }
const verificationCodes = new Map()
const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000 // 10分钟

// 中间件 - CORS 配置，确保允许 Authorization header
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['x-tokens-remaining']
}))

// 处理 OPTIONS 预检请求（必须在其他中间件之前）
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*'
  res.header('Access-Control-Allow-Origin', origin)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400')
  console.log('[CORS] OPTIONS preflight request from:', origin)
  res.sendStatus(200)
})

// 对 Stripe webhook 需要保留原始请求体，其余使用 JSON
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next()
  } else {
    express.json()(req, res, next)
  }
})

// 配置 multer 用于文件上传
// 支持 HEIC 格式
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // 允许所有图片格式，包括 HEIC
    const fileExt = file.originalname.toLowerCase()
    if (file.mimetype.startsWith('image/') || 
        fileExt.endsWith('.heic') ||
        fileExt.endsWith('.heif')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'), false)
    }
  }
})

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// ==================== 用户认证 API ====================

// 发送邮箱验证码
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email, language = 'en' } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // 确定邮件语言（'zh' 或 'en'）
    const mailLanguage = language === 'zh' ? 'zh' : 'en'

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + VERIFICATION_CODE_EXPIRY

    // 存储验证码
    verificationCodes.set(email, { code, expiresAt })

    // 发送邮件 - 优先使用 SendGrid API（Render 免费服务不支持 SMTP 端口）
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@glowlisting.ai'
    const fromName = process.env.SMTP_FROM_NAME || 'GlowListing'
    
    // 备选：SMTP 配置（仅当升级到付费服务时可用）
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpSecure = process.env.SMTP_SECURE === 'true'

    // 检查是否有可用的邮件服务配置
    if (!sendGridApiKey && (!smtpHost || !smtpPort || !smtpUser || !smtpPass)) {
      console.error('❌ 邮件服务未配置')
      console.log(`⚠️ 验证码（仅用于测试）: ${code} (10分钟内有效)`)
      return res.status(500).json({ 
        error: mailLanguage === 'zh' 
          ? '邮件服务未配置，请联系管理员' 
          : 'Email service not configured. Please contact administrator'
      })
    }

    // 根据语言生成邮件内容
    let subject, htmlContent, textContent
    
    if (mailLanguage === 'zh') {
      // 中文邮件
      subject = 'GlowListing 注册验证码'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing 注册验证码</h2>
          <p>您好！</p>
          <p>您的注册验证码是：</p>
          <div style="background-color: #F3F4F6; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>此验证码在 <strong>10分钟</strong> 内有效。</p>
          <p>如果您没有请求此验证码，请忽略此邮件。</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. 保留所有权利。
          </p>
        </div>
      `
      textContent = `您的验证码是: ${code}，10分钟内有效。`
    } else {
      // 英文邮件
      subject = 'GlowListing Verification Code'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing Verification Code</h2>
          <p>Hello!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #F3F4F6; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. All rights reserved.
          </p>
        </div>
      `
      textContent = `Your verification code is: ${code}, valid for 10 minutes.`
    }

    try {
      // 优先使用 SendGrid API（推荐，适用于 Render 免费服务）
      if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey)
        
        const msg = {
          to: email,
          from: {
            email: sendGridFromEmail,
            name: fromName,
          },
          subject: subject,
          text: textContent,
          html: htmlContent,
        }

        await sgMail.send(msg)
        console.log(`✅ 验证码邮件已通过 SendGrid 成功发送到 ${email}`)
      } 
      // 备选：使用 SMTP（仅当升级到付费服务时可用）
      else if (smtpHost && smtpPort && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: smtpSecure, // true for 465, false for other ports
          requireTLS: !smtpSecure && parseInt(smtpPort) === 587, // 对于587端口使用STARTTLS
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 30000, // 30秒连接超时
          greetingTimeout: 30000, // 30秒问候超时
          socketTimeout: 60000, // 60秒socket超时
          tls: {
            rejectUnauthorized: false, // 允许自签名证书（仅用于测试）
            minVersion: 'TLSv1.2', // 使用 TLS 1.2 或更高版本
          },
          debug: process.env.NODE_ENV === 'development',
          logger: process.env.NODE_ENV === 'development',
        })

        await transporter.sendMail({
          from: `"${fromName}" <${smtpUser}>`,
          to: email,
          subject: subject,
          html: htmlContent,
          text: textContent,
        })

        console.log(`✅ 验证码邮件已通过 SMTP 成功发送到 ${email}`)
      }
    } catch (emailError) {
      console.error('❌ 发送邮件失败:', emailError)
      console.error('错误代码:', emailError.code)
      console.error('错误消息:', emailError.message)
      console.error('SMTP配置:', {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
      })
      
      // 根据错误类型返回更具体的错误信息
      let errorMessage
      if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ECONNREFUSED') {
        errorMessage = mailLanguage === 'zh'
          ? '无法连接到邮件服务器，请检查SMTP配置或网络连接'
          : 'Cannot connect to email server. Please check SMTP configuration or network connection'
      } else if (emailError.code === 'EAUTH') {
        errorMessage = mailLanguage === 'zh'
          ? '邮箱认证失败，请检查用户名和密码'
          : 'Email authentication failed. Please check username and password'
      } else {
        errorMessage = mailLanguage === 'zh'
          ? `邮件发送失败: ${emailError.message || '未知错误'}`
          : `Failed to send email: ${emailError.message || 'Unknown error'}`
      }
      
      return res.status(500).json({ error: errorMessage })
    }

    res.json({
      success: true,
      message: mailLanguage === 'zh' 
        ? '验证码已发送到您的邮箱' 
        : 'Verification code sent to your email',
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    res.status(500).json({ error: 'Failed to send verification code' })
  }
})

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, verificationCode, recaptchaToken } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // 验证 reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA verification is required' })
    }

    const RECAPTCHA_SECRET_KEY = '6Lf9lyQsAAAAAIyz2SmbXK-NEaZFiswWhcyWQjw_'
    try {
      const recaptchaResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      })

      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' })
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA verification error:', recaptchaError)
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' })
    }

    // 验证验证码
    if (!verificationCode) {
      return res.status(400).json({ error: 'Verification code is required' })
    }

    const storedCode = verificationCodes.get(email)
    if (!storedCode) {
      return res.status(400).json({ error: 'Verification code not found. Please request a new code.' })
    }

    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' })
    }

    if (storedCode.code !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // 验证码正确，删除验证码
    verificationCodes.delete(email)

    const user = await registerUser(name, email, password)
    const token = generateToken(user.id)
    const userTokens = await getUserTokensSafe(user.id)

    // 移除密码
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      tokens: userTokens,
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password' })
    }

    const user = await loginUser(email, password)
    const token = generateToken(user.id)
    const userTokens = await getUserTokensSafe(user.id)

    // 记录登录IP与地理信息
    if (useDb) {
      const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
      const ip = Array.isArray(ipRaw) ? ipRaw[0] : String(ipRaw || '').split(',')[0].trim()
      const geo = ip ? geoip.lookup(ip) : null
      const country = geo?.country || null
      const city = geo?.city || null
      const countryCode = country || null
      await query(
        `UPDATE users SET last_login_at=NOW(), last_login_ip=$1, last_login_country=$2, last_login_country_code=$3, last_login_city=$4 WHERE id=$5`,
        [ip || null, geo?.country || null, countryCode, city || null, user.id]
      )
    }

    // 移除密码
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      tokens: userTokens,
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

// 忘记密码 - 发送重置邮件
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, language = 'en' } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const { generatePasswordResetToken } = await import('./auth.js')
    const user = await getUserByEmailSafe(email)

    // 确定邮件语言（'zh' 或 'en'）
    const mailLanguage = language === 'zh' ? 'zh' : 'en'

    // 即使用户不存在，也返回成功（防止邮箱枚举攻击）
    // 但只有在邮件服务配置正确的情况下才返回成功
    if (!user) {
      // 检查邮件服务是否配置
      const sendGridApiKey = process.env.SENDGRID_API_KEY
      const smtpHost = process.env.SMTP_HOST
      const smtpPort = process.env.SMTP_PORT
      const smtpUser = process.env.SMTP_USER
      const smtpPass = process.env.SMTP_PASS
      
      if (!sendGridApiKey && (!smtpHost || !smtpPort || !smtpUser || !smtpPass)) {
        return res.status(500).json({ 
          error: mailLanguage === 'zh' 
            ? '邮件服务未配置，请联系管理员' 
            : 'Email service not configured. Please contact administrator'
        })
      }
      
      return res.json({ success: true, message: 'If the email exists, a password reset link has been sent' })
    }

    // 生成重置token
    const resetToken = generatePasswordResetToken(email)

    // 发送重置邮件 - 使用与注册验证码相同的逻辑
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@glowlisting.ai'
    const fromName = process.env.SMTP_FROM_NAME || 'GlowListing'
    
    // 备选：SMTP 配置（仅当升级到付费服务时可用）
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpSecure = process.env.SMTP_SECURE === 'true'

    // 检查是否有可用的邮件服务配置
    if (!sendGridApiKey && (!smtpHost || !smtpPort || !smtpUser || !smtpPass)) {
      console.error('❌ 邮件服务未配置')
      return res.status(500).json({ 
        error: mailLanguage === 'zh' 
          ? '邮件服务未配置，请联系管理员' 
          : 'Email service not configured. Please contact administrator'
      })
    }

    // 构建重置链接（前端URL + token）
    const frontendUrl = process.env.FRONTEND_URL || 'https://glowlisting.ai'
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`

    // 根据语言生成邮件内容
    let subject, htmlContent, textContent
    
    if (mailLanguage === 'zh') {
      subject = 'GlowListing 密码重置'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing 密码重置</h2>
          <p>您好！</p>
          <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">重置密码</a>
          </div>
          <p>如果按钮无法点击，请复制以下链接到浏览器：</p>
          <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${resetLink}</p>
          <p>此链接将在 <strong>1小时</strong> 后过期。</p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. 保留所有权利。
          </p>
        </div>
      `
      textContent = `请点击以下链接重置密码：${resetLink}（1小时内有效）`
    } else {
      subject = 'GlowListing Password Reset'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing Password Reset</h2>
          <p>Hello!</p>
          <p>We received a request to reset your password. Please click the link below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${resetLink}</p>
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. All rights reserved.
          </p>
        </div>
      `
      textContent = `Please click the following link to reset your password: ${resetLink} (valid for 1 hour)`
    }

    try {
      // 优先使用 SendGrid API（推荐，适用于 Render 免费服务）
      if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey)
        
        const msg = {
          to: email,
          from: {
            email: sendGridFromEmail,
            name: fromName,
          },
          subject: subject,
          text: textContent,
          html: htmlContent,
        }

        await sgMail.send(msg)
        console.log(`✅ 密码重置邮件已通过 SendGrid 成功发送到 ${email}`)
      } 
      // 备选：使用 SMTP（仅当升级到付费服务时可用）
      else if (smtpHost && smtpPort && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: smtpSecure,
          requireTLS: !smtpSecure && parseInt(smtpPort) === 587,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
          },
          debug: process.env.NODE_ENV === 'development',
          logger: process.env.NODE_ENV === 'development',
        })

        await transporter.sendMail({
          from: `"${fromName}" <${smtpUser}>`,
          to: email,
          subject: subject,
          html: htmlContent,
          text: textContent,
        })

        console.log(`✅ 密码重置邮件已通过 SMTP 成功发送到 ${email}`)
      }
    } catch (emailError) {
      console.error('❌ 发送密码重置邮件失败:', emailError)
      console.error('错误代码:', emailError.code)
      console.error('错误消息:', emailError.message)
      if (emailError.response?.body) {
        console.error('错误响应:', emailError.response.body)
      }
      
      // 提供更详细的错误信息
      let errorMessage = mailLanguage === 'zh' 
        ? '发送密码重置邮件失败，请稍后重试' 
        : 'Failed to send password reset email. Please try again later'
      
      if (emailError.code === 'EENVELOPE') {
        errorMessage = mailLanguage === 'zh' 
          ? '发件人邮箱未验证，请联系管理员' 
          : 'Sender email not verified. Please contact administrator'
      } else if (emailError.response?.body?.errors) {
        errorMessage = emailError.response.body.errors[0]?.message || errorMessage
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      })
    }

    res.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    console.error('❌ 发送密码重置邮件失败:', error)
    console.error('错误详情:', error.message)
    const mailLanguage = req.body?.language === 'zh' ? 'zh' : 'en'
    res.status(500).json({ 
      error: mailLanguage === 'zh' 
        ? '发送密码重置邮件失败，请稍后重试' 
        : 'Failed to send password reset email. Please try again later',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// 重置密码
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' })
    }

    const { resetPassword } = await import('./auth.js')
    await resetPassword(email, token, newPassword)

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 更新用户个人信息
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body
    const user = await getUserByIdSafe(req.userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingUser = await getUserByEmailSafe(email)
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    // 更新用户信息
    if (useDb) {
      await query('UPDATE users SET name=$1, email=$2 WHERE id=$3', [
        name || user.name,
        email || user.email,
        req.userId,
      ])
      const updated = await getUserByIdSafe(req.userId)
      res.json({ success: true, user: updated })
    } else {
      if (name) user.name = name
      if (email) user.email = email
      const { password: _, ...userWithoutPassword } = user
      res.json({ success: true, user: userWithoutPassword })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 修改密码
app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    let hashedPassword = null
    if (useDb) {
      const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.userId])
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }
      hashedPassword = result.rows[0].password_hash
    } else {
      const user = getUserById(req.userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
      hashedPassword = user.password
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, hashedPassword)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // 验证新密码
    const { validatePassword } = await import('./auth.js')
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message })
    }

    // 更新密码
    const newHash = await bcrypt.hash(newPassword, 10)
    if (useDb) {
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [newHash, req.userId])
    } else {
      const user = getUserById(req.userId)
      user.password = newHash
    }

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取图片历史记录
app.get('/api/images/history', authMiddleware, async (req, res) => {
  try {
    if (!useDb) {
      // 如果没有数据库，返回空数组
      return res.json({ success: true, images: [] })
    }
    
    // 只获取30分钟内创建的图片
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    // 检查表是否存在，如果不存在或字段不存在，使用基础查询
    let result
    try {
      // 尝试查询所有字段（包括新添加的字段）
      result = await query(
        `SELECT id, filename, original_filename, thumbnail_data, enhanced_data, original_data, 
                file_size, mime_type, created_at
         FROM images 
         WHERE user_id = $1 AND created_at >= $2
         ORDER BY created_at DESC 
         LIMIT 100`,
        [req.userId, thirtyMinutesAgo]
      )
    } catch (queryError) {
      // 如果查询失败（可能是字段不存在），使用基础字段查询
      console.warn('使用基础字段查询图片历史:', queryError.message)
      result = await query(
        `SELECT id, filename, created_at
         FROM images 
         WHERE user_id = $1 AND created_at >= $2
         ORDER BY created_at DESC 
         LIMIT 100`,
        [req.userId, thirtyMinutesAgo]
      )
    }
    
    const images = result.rows.map(row => ({
      id: row.id,
      filename: row.filename || 'image.jpg',
      originalFilename: row.original_filename || null,
      thumbnail: row.thumbnail_data || null,
      enhanced: row.enhanced_data || null,
      original: row.original_data || null,
      fileSize: row.file_size ? Number(row.file_size) : 0,
      mimeType: row.mime_type || 'image/jpeg',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }))
    
    res.json({ success: true, images })
  } catch (error) {
    console.error('Get image history error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to fetch image history', message: error.message })
  }
})

// 获取单张图片详情（用于再次编辑/下载）
app.get('/api/images/:imageId', authMiddleware, async (req, res) => {
  try {
    if (!useDb) {
      return res.status(404).json({ error: 'Image not found' })
    }
    
    const { imageId } = req.params
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    const result = await query(
      `SELECT id, filename, original_filename, thumbnail_data, enhanced_data, original_data, 
              file_size, mime_type, created_at
       FROM images 
       WHERE id = $1 AND user_id = $2 AND created_at >= $3`,
      [imageId, req.userId, thirtyMinutesAgo]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found or expired (30 minutes limit)' })
    }
    
    const row = result.rows[0]
    res.json({
      success: true,
      image: {
        id: row.id,
        filename: row.filename || row.original_filename || 'image.jpg',
        originalFilename: row.original_filename,
        thumbnail: row.thumbnail_data || null,
        enhanced: row.enhanced_data || null,
        original: row.original_data || null,
        fileSize: row.file_size ? Number(row.file_size) : 0,
        mimeType: row.mime_type || 'image/jpeg',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Get image error:', error)
    res.status(500).json({ error: 'Failed to fetch image' })
  }
})

// 删除图片
app.delete('/api/images/:imageId', authMiddleware, async (req, res) => {
  try {
    const { imageId } = req.params
    
    if (useDb) {
      // 从数据库删除
      const result = await query(
        `DELETE FROM images WHERE id = $1 AND user_id = $2 RETURNING id`,
        [imageId, req.userId]
      )
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' })
      }
      
      res.json({ success: true, message: 'Image deleted successfully' })
    } else {
      // 从文件系统删除（fallback）
      const imagePath = path.join(__dirname, 'uploads', `hd-${imageId}.jpg`)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
        res.json({ success: true, message: 'Image deleted successfully' })
      } else {
        res.status(404).json({ error: 'Image not found' })
      }
    }
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserByIdSafe(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found, please re-login' })
    }

    const userTokens = await getUserTokensSafe(req.userId)

    // 移除密码（DB 版本已不返回密码）
    const { password: _, password_hash, ...userWithoutPassword } = user

    // 添加活跃session
    addActiveSession(req.userId)

    res.json({
      success: true,
      user: userWithoutPassword,
      tokens: userTokens,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== 管理员 API ====================

// 检查是否为管理员
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await getUserByIdSafe(req.userId)
    if (!user || !(user.isAdmin || user.is_admin)) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// 获取统计数据
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 本周（周一）
    const thisWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    thisWeek.setDate(today.getDate() - daysToMonday)
    thisWeek.setHours(0, 0, 0, 0)
    
    // 上周（周一）
    const lastWeek = new Date(thisWeek)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    // 本月第一天
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 今年第一天
    const thisYear = new Date(now.getFullYear(), 0, 1)
    
    // 所有时间（设置一个很早的日期）
    const allTime = new Date(2020, 0, 1)

    // 检查是否有自定义日期范围
    let customStats = null
    let chartData = null
    if (req.query.startDate && req.query.endDate) {
      const customStart = new Date(req.query.startDate)
      const customEnd = new Date(req.query.endDate)
      customEnd.setHours(23, 59, 59, 999) // 设置为当天的最后一刻
      
      const customRevenue = await getRevenueStatsSafe(customStart, customEnd)
      const customTokenUsage = await getTokenUsageStatsSafe(customStart, customEnd)
      customStats = {
        totalRevenue: customRevenue.totalRevenue,
        tokenUsage: customTokenUsage,
      }
      
      chartData = await getChartDataSafe(customStart, customEnd)
    } else {
      // 根据timeRange生成图表数据
      let chartStart, chartEnd
      switch (req.query.range) {
        case 'today':
          chartStart = today
          chartEnd = now
          break
        case 'yesterday':
          chartStart = yesterday
          chartEnd = new Date(yesterday.getTime() + 86400000 - 1)
          break
        case 'weekToDate':
          chartStart = thisWeek
          chartEnd = now
          break
        case 'lastWeek':
          chartStart = lastWeek
          chartEnd = new Date(thisWeek.getTime() - 1)
          break
        case 'monthToDate':
          chartStart = thisMonth
          chartEnd = now
          break
        case 'yearToDate':
          chartStart = thisYear
          chartEnd = now
          break
        case 'allTime':
        default:
          chartStart = allTime
          chartEnd = now
          break
      }
      chartData = await getChartDataSafe(chartStart, chartEnd)
    }

    const revenueToday = await getRevenueStatsSafe(today, now)
    const revenueYesterday = await getRevenueStatsSafe(yesterday, new Date(yesterday.getTime() + 86400000 - 1))
    const revenueWeek = await getRevenueStatsSafe(thisWeek, now)
    const revenueLastWeek = await getRevenueStatsSafe(lastWeek, new Date(thisWeek.getTime() - 1))
    const revenueMonth = await getRevenueStatsSafe(thisMonth, now)
    const revenueYear = await getRevenueStatsSafe(thisYear, now)
    const revenueAll = await getRevenueStatsSafe(allTime, now)

    const tokenToday = await getTokenUsageStatsSafe(today, now)
    const tokenYesterday = await getTokenUsageStatsSafe(yesterday, new Date(yesterday.getTime() + 86400000 - 1))
    const tokenWeek = await getTokenUsageStatsSafe(thisWeek, now)
    const tokenLastWeek = await getTokenUsageStatsSafe(lastWeek, new Date(thisWeek.getTime() - 1))
    const tokenMonth = await getTokenUsageStatsSafe(thisMonth, now)
    const tokenYear = await getTokenUsageStatsSafe(thisYear, now)
    const tokenAll = await getTokenUsageStatsSafe(allTime, now)

    const totalUsersCount = useDb
      ? Number((await query('SELECT COUNT(*) FROM users')).rows[0].count)
      : users.length

    const stats = {
      activeUsers: getActiveSessionsCount(),
      totalUsers: totalUsersCount,
      totalRevenue: {
        today: revenueToday.totalRevenue,
        yesterday: revenueYesterday.totalRevenue,
        weekToDate: revenueWeek.totalRevenue,
        lastWeek: revenueLastWeek.totalRevenue,
        monthToDate: revenueMonth.totalRevenue,
        yearToDate: revenueYear.totalRevenue,
        allTime: revenueAll.totalRevenue,
        ...(customStats && { custom: customStats.totalRevenue }),
      },
      subscriptions: await getSubscriptionStatsSafe(),
      tokenUsage: {
        today: tokenToday,
        yesterday: tokenYesterday,
        weekToDate: tokenWeek,
        lastWeek: tokenLastWeek,
        monthToDate: tokenMonth,
        yearToDate: tokenYear,
        allTime: tokenAll,
        ...(customStats && { custom: customStats.tokenUsage }),
      },
    }

    res.json({ success: true, stats, chartData })
  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 管理员总览 /admin/overview
app.get('/api/admin/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) {
      return res.status(400).json({ error: 'Overview requires database' })
    }
    const { range = '30d' } = req.query
    const now = new Date()
    const startMap = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    }
    const rangeStart = startMap[range] || startMap['30d']
    const start30d = startMap['30d']

    // 总营收 & 30天营收
    const revenueAll = await query(`SELECT COALESCE(SUM(amount),0) AS total FROM revenue`)
    const revenue30 = await query(`SELECT COALESCE(SUM(amount),0) AS total FROM revenue WHERE created_at >= $1`, [start30d])

    // 活跃订阅数、MRR 估算（简单按活跃订阅 * 1 计，无价格信息可用时为 0）
    const activeSubs = await query(`SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'active'`)
    const activeSubscriptions = Number(activeSubs.rows[0]?.cnt || 0)
    const mrrEstimate = 0 // TODO: 如果有价格表，可按计划价格计算

    // 新增注册数
    const newSignups = await query(`SELECT COUNT(*) AS cnt FROM users WHERE created_at >= $1`, [rangeStart])

    // 活跃用户（30天内有登录或使用记录）
    const activeUsersResult = await query(
      `SELECT COUNT(DISTINCT u.id) AS cnt
       FROM users u
       LEFT JOIN token_usage tu ON tu.user_id = u.id AND tu.created_at >= $1
       WHERE u.last_login_at >= $1 OR tu.user_id IS NOT NULL`,
      [start30d]
    )

    // 处理的图片数（job 统计）
    const jobsAll = await query(`SELECT COALESCE(SUM(processed_images),0) AS cnt FROM jobs WHERE status = 'succeeded'`)
    const jobs30 = await query(`SELECT COALESCE(SUM(processed_images),0) AS cnt FROM jobs WHERE status = 'succeeded' AND created_at >= $1`, [start30d])

    // 错误率（30天）
    const jobTotals = await query(`SELECT COUNT(*) AS total FROM jobs WHERE created_at >= $1`, [start30d])
    const jobFails = await query(`SELECT COUNT(*) AS failed FROM jobs WHERE status = 'failed' AND created_at >= $1`, [start30d])
    const totalJobs30 = Number(jobTotals.rows[0]?.total || 0)
    const failedJobs30 = Number(jobFails.rows[0]?.failed || 0)
    const errorRate = totalJobs30 > 0 ? failedJobs30 / totalJobs30 : 0

    // 图表：收入（30天）
    const revenueDaily = await query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(amount),0) AS total
       FROM revenue
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start30d]
    )

    // 图表：订阅创建（30天）
    const subsDaily = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS cnt
       FROM subscriptions
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start30d]
    )

    // 图表：图片处理（30天，按 job）
    const jobsDaily = await query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(processed_images),0) AS total
       FROM jobs
       WHERE status = 'succeeded' AND created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start30d]
    )

    // 图表：新用户（30天）
    const usersDaily = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS cnt
       FROM users
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start30d]
    )

    // 最近活动（用户注册/订阅/收入/任务）
    const recentUsers = await query(
      `SELECT 'user' AS type, id, email, name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    )
    const recentSubs = await query(
      `SELECT 'subscription' AS type, id, plan_type AS plan, status, created_at
       FROM subscriptions
       ORDER BY created_at DESC
       LIMIT 5`
    )
    const recentRev = await query(
      `SELECT 'revenue' AS type, id, amount, currency, source, created_at
       FROM revenue
       ORDER BY created_at DESC
       LIMIT 5`
    )
    const recentJobs = await query(
      `SELECT 'job' AS type, id, status, processed_images, error_count, created_at
       FROM jobs
       ORDER BY created_at DESC
       LIMIT 5`
    )

    const recentActivity = [
      ...recentUsers.rows,
      ...recentSubs.rows,
      ...recentRev.rows,
      ...recentJobs.rows
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)

    res.json({
      success: true,
      kpis: {
        totalRevenueAll: Number(revenueAll.rows[0]?.total || 0),
        totalRevenue30d: Number(revenue30.rows[0]?.total || 0),
        mrrEstimate: mrrEstimate,
        activeSubscriptions,
        newSignups: Number(newSignups.rows[0]?.cnt || 0),
        activeUsers: Number(activeUsersResult.rows[0]?.cnt || 0),
        photosProcessedAll: Number(jobsAll.rows[0]?.cnt || 0),
        photosProcessed30d: Number(jobs30.rows[0]?.cnt || 0),
        errorRate,
      },
      charts: {
        revenueDaily: revenueDaily.rows,
        subscriptionsDaily: subsDaily.rows,
        jobsDaily: jobsDaily.rows,
        usersDaily: usersDaily.rows,
      },
      recentActivity
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin billing: subscriptions list
app.get('/api/admin/billing/subscriptions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Billing requires database' })
    const { status, limit = 50, offset = 0 } = req.query
    const clauses = []
    const params = []
    if (status) {
      clauses.push(`s.status = $${params.length + 1}`)
      params.push(status)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT s.id, s.user_id, s.plan_type, s.plan_name, s.status, s.created_at, s.current_period_start, s.current_period_end,
             s.cancel_at_period_end, s.cancel_at, s.trial_end,
             s.stripe_subscription_id, s.stripe_customer_id, s.stripe_price_id, s.stripe_product_id,
             s.amount, s.currency, s.interval,
             u.email, u.name
      FROM subscriptions s
      LEFT JOIN users u ON u.id = s.user_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ${Number(limit) || 50} OFFSET ${Number(offset) || 0}
    `
    const rows = await query(sql, params)
    const count = await query(`SELECT COUNT(*) FROM subscriptions s ${where}`, params)
    res.json({ success: true, subscriptions: rows.rows, total: Number(count.rows[0].count) })
  } catch (error) {
    console.error('Admin billing subscriptions error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin billing: subscription detail
app.get('/api/admin/billing/subscriptions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Billing requires database' })
    const { id } = req.params
    const sub = await query(
      `SELECT s.*, u.email, u.name
       FROM subscriptions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    )
    if (sub.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // 计算当前周期内的已用 credits（基于 token_usage action=process）
    let creditsUsed = null
    try {
      if (sub.rows[0].current_period_start && sub.rows[0].current_period_end) {
        const used = await query(
          `SELECT COUNT(*) AS cnt
           FROM token_usage
           WHERE user_id = $1
             AND action = 'process'
             AND created_at BETWEEN $2 AND $3`,
          [sub.rows[0].user_id, sub.rows[0].current_period_start, sub.rows[0].current_period_end]
        )
        creditsUsed = Number(used.rows[0].cnt || 0)
      }
    } catch (e) {
      creditsUsed = null
    }

    res.json({
      success: true,
      subscription: sub.rows[0],
      usage: {
        creditsUsed,
      },
    })
  } catch (error) {
    console.error('Admin billing subscription detail error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin billing: one-time purchases
app.get('/api/admin/billing/one-time', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Billing requires database' })
    const { limit = 100, offset = 0 } = req.query
    const rows = await query(
      `SELECT r.id, r.user_id, r.amount, r.currency, r.source, r.plan_type, r.credits, r.quantity,
              r.stripe_payment_intent_id, r.stripe_charge_id, r.stripe_price_id, r.stripe_product_id,
              r.created_at, u.email, u.name
       FROM revenue r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.source = 'one_time_pack' OR r.plan_type = 'one_time'
       ORDER BY r.created_at DESC
       LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}`
    )
    const count = await query(
      `SELECT COUNT(*) FROM revenue r WHERE r.source = 'one_time_pack' OR r.plan_type = 'one_time'`
    )
    res.json({ success: true, purchases: rows.rows, total: Number(count.rows[0].count) })
  } catch (error) {
    console.error('Admin billing one-time error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin billing: revenue summary
app.get('/api/admin/billing/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Billing requires database' })
    const { range = '30d' } = req.query
    const now = new Date()
    const startMap = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    }
    const rangeStart = startMap[range] || startMap['30d']

    // 收入按产品/计划
    const revenueByPlan = await query(
      `SELECT COALESCE(plan_type, source, 'unknown') AS plan, COALESCE(SUM(amount),0) AS total
       FROM revenue
       WHERE created_at >= $1
       GROUP BY plan_type, source`,
      [rangeStart]
    )

    // 收入按日
    const revenueDaily = await query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(amount),0) AS total
       FROM revenue
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [rangeStart]
    )

    // Top customers by revenue
    const topCustomers = await query(
      `SELECT u.email, u.name, COALESCE(SUM(r.amount),0) AS total
       FROM revenue r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.created_at >= $1
       GROUP BY u.email, u.name
       ORDER BY total DESC
       LIMIT 20`,
      [rangeStart]
    )

    res.json({
      success: true,
      revenueByPlan: revenueByPlan.rows,
      revenueDaily: revenueDaily.rows,
      topCustomers: topCustomers.rows
    })
  } catch (error) {
    console.error('Admin billing summary error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin Support: feedback list
app.get('/api/admin/support/feedback', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Support requires database' })
    const { status, category, limit = 100, offset = 0 } = req.query
    const clauses = []
    const params = []
    if (status) {
      clauses.push(`f.status = $${params.length + 1}`)
      params.push(status)
    }
    if (category) {
      clauses.push(`f.category = $${params.length + 1}`)
      params.push(category)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = await query(
      `SELECT f.*, u.email AS user_email, u.name AS user_name, admin_u.email AS admin_email, admin_u.name AS admin_name
       FROM feedback f
       LEFT JOIN users u ON u.id = f.user_id
       LEFT JOIN users admin_u ON admin_u.id = f.admin_reply_by
       ${where}
       ORDER BY f.created_at DESC
       LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}`,
      params
    )
    const count = await query(`SELECT COUNT(*) FROM feedback f ${where}`, params)
    res.json({ success: true, feedback: rows.rows, total: Number(count.rows[0].count) })
  } catch (error) {
    console.error('Admin support feedback error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin Support: update feedback status/note
app.put('/api/admin/support/feedback/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Support requires database' })
    const { id } = req.params
    const { status, internal_note } = req.body
    await query(
      `UPDATE feedback 
       SET status = COALESCE($1, status), internal_note = COALESCE($2, internal_note), updated_at = NOW()
       WHERE id = $3`,
      [status, internal_note, id]
    )
    res.json({ success: true })
  } catch (error) {
    console.error('Admin support feedback update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin Support: reply to feedback (broadcast to user)
app.put('/api/admin/support/feedback/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Support requires database' })
    const { id } = req.params
    const { admin_reply, status } = req.body
    if (!admin_reply) return res.status(400).json({ error: 'Reply is required' })
    await query(
      `UPDATE feedback
       SET admin_reply = $1,
           admin_reply_at = NOW(),
           admin_reply_by = $2,
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4`,
      [admin_reply, req.userId, status || null, id]
    )

    // 获取反馈所属用户，用于推送
    const fb = await query(`SELECT user_id FROM feedback WHERE id = $1`, [id])
    const targetUserId = fb.rows[0]?.user_id
    if (targetUserId) {
      wsBroadcastToUser(targetUserId, {
        type: 'feedback_reply',
        feedbackId: id,
        reply: admin_reply,
        status: status || null,
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Admin support feedback reply error:', error)
    res.status(500).json({ error: error.message })
  }
})

// User: list own feedback (to see admin replies)
app.get('/api/support/feedback', authMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Feedback requires database' })
    const rows = await query(
      `SELECT id, category, message, status, internal_note, admin_reply, admin_reply_at, created_at, updated_at
       FROM feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [req.userId]
    )
    res.json({ success: true, feedback: rows.rows })
  } catch (error) {
    console.error('Get my feedback error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin Support: error overview (failed jobs)
app.get('/api/admin/support/errors', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Support requires database' })
    const { days = 14, limit = 20 } = req.query
    const since = new Date(Date.now() - Number(days || 14) * 24 * 60 * 60 * 1000)

    const failedByDay = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS failed
       FROM jobs
       WHERE status = 'failed' AND created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [since]
    )

    const recentFailed = await query(
      `SELECT j.id, j.user_id, j.error_message, j.processed_images, j.total_images, j.created_at, j.finished_at, u.email, u.name
       FROM jobs j
       LEFT JOIN users u ON u.id = j.user_id
       WHERE j.status = 'failed' AND j.created_at >= $1
       ORDER BY j.created_at DESC
       LIMIT ${Number(limit) || 20}`,
      [since]
    )

    res.json({
      success: true,
      failedByDay: failedByDay.rows,
      recentFailed: recentFailed.rows,
    })
  } catch (error) {
    console.error('Admin support errors error:', error)
    res.status(500).json({ error: error.message })
  }
})

// User submit feedback (auth required for user_id/email; allow manual email if anon is ever needed)
app.post('/api/support/feedback', authMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Feedback requires database' })
    const { category, message, email, status } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const user = await getUserByIdSafe(req.userId)
    const finalEmail = email || user?.email || null

    await query(
      `INSERT INTO feedback (user_id, email, category, message, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.userId || null, finalEmail, category || null, message, status || 'open']
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Submit feedback error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========== 聊天式消息系统 ==========

// 用户：获取自己的消息列表
app.get('/api/support/messages', authMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Messages require database' })
    const rows = await query(
      `SELECT id, user_id, is_admin, message, created_at
       FROM messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 500`,
      [req.userId]
    )
    res.json({ success: true, messages: rows.rows })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 用户：发送消息
app.post('/api/support/messages', authMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Messages require database' })
    const { message } = req.body
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' })

    const result = await query(
      `INSERT INTO messages (user_id, is_admin, message)
       VALUES ($1, FALSE, $2)
       RETURNING id, user_id, is_admin, message, created_at`,
      [req.userId, message.trim()]
    )

    const newMsg = result.rows[0]

    // 广播给所有管理员（新消息通知）
    wsBroadcastToAdmins({
      type: 'message_new',
      messageId: newMsg.id,
      userId: req.userId,
      message: newMsg.message,
      createdAt: newMsg.created_at,
    })

    res.json({ success: true, message: newMsg })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 管理员：获取所有用户的对话列表（按用户分组，显示最新消息）
app.get('/api/admin/support/conversations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Messages require database' })
    
    // 使用窗口函数优化查询
    const rows = await query(
      `WITH latest_messages AS (
         SELECT DISTINCT ON (user_id)
           user_id,
           message AS last_message,
           created_at AS last_message_at
         FROM messages
         ORDER BY user_id, created_at DESC
       ),
       message_counts AS (
         SELECT 
           user_id,
           COUNT(*) FILTER (WHERE is_admin = FALSE) AS user_message_count,
           COUNT(*) FILTER (WHERE is_admin = TRUE) AS admin_message_count
         FROM messages
         GROUP BY user_id
       )
       SELECT 
         lm.user_id,
         u.email AS user_email,
         u.name AS user_name,
         lm.last_message,
         lm.last_message_at,
         COALESCE(mc.user_message_count, 0) AS user_message_count,
         COALESCE(mc.admin_message_count, 0) AS admin_message_count
       FROM latest_messages lm
       LEFT JOIN users u ON u.id = lm.user_id
       LEFT JOIN message_counts mc ON mc.user_id = lm.user_id
       ORDER BY lm.last_message_at DESC`
    )
    res.json({ success: true, conversations: rows.rows || [] })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 管理员：获取指定用户的所有消息
app.get('/api/admin/support/messages/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Messages require database' })
    const { userId } = req.params
    const rows = await query(
      `SELECT id, user_id, is_admin, message, created_at
       FROM messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 500`,
      [userId]
    )
    res.json({ success: true, messages: rows.rows })
  } catch (error) {
    console.error('Get user messages error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 管理员：回复用户消息
app.post('/api/admin/support/messages/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Messages require database' })
    const { userId } = req.params
    const { message } = req.body
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' })

    const result = await query(
      `INSERT INTO messages (user_id, is_admin, message)
       VALUES ($1, TRUE, $2)
       RETURNING id, user_id, is_admin, message, created_at`,
      [userId, message.trim()]
    )

    const newMsg = result.rows[0]

    // 广播给对应用户（管理员回复通知）
    wsBroadcastToUser(userId, {
      type: 'message_reply',
      messageId: newMsg.id,
      message: newMsg.message,
      createdAt: newMsg.created_at,
    })

    res.json({ success: true, message: newMsg })
  } catch (error) {
    console.error('Admin reply error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin 高级统计（留存率、LTV等）
app.get('/api/admin/advanced-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.json({ success: true, stats: {} })
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    // 日活跃用户 (DAU) - 过去7天平均
    const dauResult = await query(`
      SELECT COUNT(DISTINCT user_id) as count, DATE(created_at) as date
      FROM token_usage
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `, [last7Days])
    const dauValues = dauResult.rows.map(r => Number(r.count))
    const avgDAU = dauValues.length > 0 ? dauValues.reduce((a, b) => a + b, 0) / dauValues.length : 0
    
    // 月活跃用户 (MAU) - 过去30天
    const mauResult = await query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM token_usage
      WHERE created_at >= $1
    `, [last30Days])
    const mau = Number(mauResult.rows[0]?.count || 0)
    
    // 用户留存率 (7日、30日)
    const newUsers7DaysAgo = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN $1 AND $2
    `, [new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000), last7Days])
    const newUsers7DaysAgoCount = Number(newUsers7DaysAgo.rows[0]?.count || 0)
    
    const retained7Days = await query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN token_usage tu ON tu.user_id = u.id
      WHERE u.created_at BETWEEN $1 AND $2
        AND tu.created_at >= $3
    `, [new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000), last7Days, last7Days])
    const retained7DaysCount = Number(retained7Days.rows[0]?.count || 0)
    const retention7Days = newUsers7DaysAgoCount > 0 ? (retained7DaysCount / newUsers7DaysAgoCount * 100).toFixed(2) : 0
    
    // 平均生命周期价值 (LTV) - 基于过去90天的数据
    const ltvResult = await query(`
      SELECT 
        AVG(COALESCE(total_revenue, 0)) as avg_ltv,
        COUNT(DISTINCT u.id) as user_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(amount) as total_revenue
        FROM revenue
        WHERE created_at >= $1
        GROUP BY user_id
      ) r ON r.user_id = u.id
      WHERE u.created_at >= $1
    `, [last90Days])
    const avgLTV = Number(ltvResult.rows[0]?.avg_ltv || 0)
    
    // 用户增长趋势 (过去30天每日新增)
    const growthResult = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [last30Days])
    
    // 收入趋势 (过去30天每日收入)
    const revenueTrendResult = await query(`
      SELECT DATE(created_at) as date, SUM(amount) as total
      FROM revenue
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [last30Days])
    
    res.json({
      success: true,
      stats: {
        dau: Math.round(avgDAU),
        mau,
        retention7Days: parseFloat(retention7Days),
        avgLTV: parseFloat(avgLTV.toFixed(2)),
        growthTrend: growthResult.rows.map(r => ({
          date: r.date,
          count: Number(r.count)
        })),
        revenueTrend: revenueTrendResult.rows.map(r => ({
          date: r.date,
          total: parseFloat(r.total || 0)
        }))
      }
    })
  } catch (error) {
    console.error('Advanced stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取所有用户列表
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allUsers = await getAllUsersSafe()
    res.json({ success: true, users: allUsers })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除用户
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    
    // 不能删除自己
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    
    // 获取目标用户信息用于审计日志
    const targetUser = await getUserByIdSafe(userId)
    
    await deleteUserSafe(userId)
    
    // 记录审计日志
    await logAdminAction(req.userId, 'delete_user', userId, {
      targetUserEmail: targetUser?.email,
      targetUserName: targetUser?.name
    }, req)
    
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 切换用户管理员权限
app.put('/api/admin/users/:userId/toggle-admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    
    // 不能修改自己的权限
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot modify your own admin status' })
    }
    
    const user = await toggleUserAdminSafe(userId)
    const { password, password_hash, ...userWithoutPassword } = user
    
    // 记录审计日志
    await logAdminAction(req.userId, 'toggle_admin', userId, {
      targetUserEmail: user.email,
      targetUserName: user.name,
      newAdminStatus: user.is_admin || user.isAdmin
    }, req)
    
    res.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 为用户充值Token
app.post('/api/admin/users/:userId/tokens', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const { amount } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' })
    }
    
    const targetUser = await getUserByIdSafe(userId)
    const newTokenCount = await addTokensToUserSafe(userId, amount)
    
    // 记录审计日志
    await logAdminAction(req.userId, 'add_tokens', userId, {
      targetUserEmail: targetUser?.email,
      targetUserName: targetUser?.name,
      amount: parseInt(amount),
      newBalance: newTokenCount
    }, req)
    
    res.json({ success: true, tokens: newTokenCount, message: 'Tokens added successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取收入记录（订单）
app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.json({ success: true, orders: [] })
    const { startDate, endDate, limit = 100, offset = 0 } = req.query
    const params = []
    let where = ''
    if (startDate && endDate) {
      where = 'WHERE r.created_at BETWEEN $1 AND $2'
      params.push(new Date(startDate), new Date(endDate))
    }
    const sql = `
      SELECT r.id, r.amount, r.currency, r.source, r.created_at,
             u.email, u.name
      FROM revenue r
      LEFT JOIN users u ON u.id = r.user_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}
    `
    const result = await query(sql, params)
    res.json({ success: true, orders: result.rows })
  } catch (error) {
    console.error('Admin orders error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取 token 使用记录
app.get('/api/admin/usage', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.json({ success: true, usage: [] })
    const { startDate, endDate, limit = 100, offset = 0, action } = req.query
    const params = []
    const clauses = []
    if (startDate && endDate) {
      clauses.push(`tu.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
      params.push(new Date(startDate), new Date(endDate))
    }
    if (action) {
      clauses.push(`tu.action = $${params.length + 1}`)
      params.push(action)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT tu.id, tu.action, tu.image_id, tu.created_at,
             u.email, u.name
      FROM token_usage tu
      LEFT JOIN users u ON u.id = tu.user_id
      ${where}
      ORDER BY tu.created_at DESC
      LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}
    `
    const result = await query(sql, params)
    res.json({ success: true, usage: result.rows })
  } catch (error) {
    console.error('Admin usage error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 管理员重置用户密码
app.post('/api/admin/users/:userId/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const { newPassword } = req.body
    if (!newPassword) return res.status(400).json({ error: 'New password is required' })
    const { validatePassword } = await import('./auth.js')
    const validation = validatePassword(newPassword)
    if (!validation.valid) return res.status(400).json({ error: validation.message })

    const targetUser = await getUserByIdSafe(userId)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    const hash = await bcrypt.hash(newPassword, 10)
    if (useDb) {
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId])
    } else {
      const user = getUserById(userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
      user.password = hash
    }
    
    // 记录审计日志
    await logAdminAction(req.userId, 'reset_password', userId, {
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.name
    }, req)
    
    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin 导出用户
app.get('/api/admin/export/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Export requires database' })
    const { search, role, startDate, endDate, hasTokens } = req.query
    
    // 记录审计日志
    await logAdminAction(req.userId, 'export_users', null, {
      filters: { search, role, startDate, endDate, hasTokens }
    }, req)
    const clauses = []
    const params = []
    if (search) {
      clauses.push(`(u.email ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }
    if (role === 'admin') clauses.push(`u.is_admin = true`)
    if (role === 'user') clauses.push(`u.is_admin = false`)
    if (startDate && endDate) {
      clauses.push(`u.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
      params.push(new Date(startDate), new Date(endDate))
    }
    if (hasTokens === 'yes') clauses.push(`COALESCE(tb.balance,0) > 0`)
    if (hasTokens === 'no') clauses.push(`COALESCE(tb.balance,0) = 0`)
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT u.id, u.name, u.email, u.is_admin, u.created_at,
             COALESCE(tb.balance,0) AS balance,
             u.last_login_at, u.last_login_ip, u.last_login_country, u.last_login_country_code, u.last_login_city
      FROM users u
      LEFT JOIN tokens_balance tb ON tb.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT 5000
    `
    const result = await query(sql, params)
    res.json({ success: true, users: result.rows })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin 导出使用记录
app.get('/api/admin/export/usage', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Export requires database' })
    const { action, startDate, endDate, limit = 5000 } = req.query
    
    // 记录审计日志
    await logAdminAction(req.userId, 'export_usage', null, {
      filters: { action, startDate, endDate, limit }
    }, req)
    const clauses = []
    const params = []
    if (action) {
      clauses.push(`tu.action = $${params.length + 1}`)
      params.push(action)
    }
    if (startDate && endDate) {
      clauses.push(`tu.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
      params.push(new Date(startDate), new Date(endDate))
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT tu.id, tu.action, tu.image_id, tu.created_at,
             u.email, u.name
      FROM token_usage tu
      LEFT JOIN users u ON u.id = tu.user_id
      ${where}
      ORDER BY tu.created_at DESC
      LIMIT ${Number(limit) || 5000}
    `
    const result = await query(sql, params)
    res.json({ success: true, usage: result.rows })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin 导出订单
app.get('/api/admin/export/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.status(400).json({ error: 'Export requires database' })
    const { startDate, endDate, limit = 5000 } = req.query
    
    // 记录审计日志
    await logAdminAction(req.userId, 'export_orders', null, {
      filters: { startDate, endDate, limit }
    }, req)
    
    const clauses = []
    const params = []
    if (startDate && endDate) {
      clauses.push(`r.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
      params.push(new Date(startDate), new Date(endDate))
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT r.id, r.amount, r.currency, r.source, r.created_at,
             u.email, u.name
      FROM revenue r
      LEFT JOIN users u ON u.id = r.user_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ${Number(limit) || 5000}
    `
    const result = await query(sql, params)
    res.json({ success: true, orders: result.rows })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin 获取审计日志
app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!useDb) return res.json({ success: true, logs: [] })
    const { startDate, endDate, action, adminUserId, limit = 100, offset = 0 } = req.query
    const clauses = []
    const params = []
    
    if (startDate && endDate) {
      clauses.push(`aal.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
      params.push(new Date(startDate), new Date(endDate))
    }
    if (action) {
      clauses.push(`aal.action = $${params.length + 1}`)
      params.push(action)
    }
    if (adminUserId) {
      clauses.push(`aal.admin_user_id = $${params.length + 1}`)
      params.push(adminUserId)
    }
    
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `
      SELECT aal.id, aal.action, aal.details, aal.ip_address, aal.user_agent, aal.created_at,
             admin_u.email AS admin_email, admin_u.name AS admin_name,
             target_u.email AS target_email, target_u.name AS target_name
      FROM admin_audit_logs aal
      LEFT JOIN users admin_u ON admin_u.id = aal.admin_user_id
      LEFT JOIN users target_u ON target_u.id = aal.target_user_id
      ${where}
      ORDER BY aal.created_at DESC
      LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}
    `
    const result = await query(sql, params)
    
    // 获取总数
    const countSql = `SELECT COUNT(*) FROM admin_audit_logs aal ${where}`
    const countResult = await query(countSql, params)
    const total = Number(countResult.rows[0].count)
    
    res.json({ success: true, logs: result.rows, total })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== 图片增强 API ====================

/**
 * 图片增强端点
 * 这里可以集成 autoenhance.ai 或其他图片增强 API
 */
app.post('/api/enhance', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' })
    }

    // 检查用户token（必须登录才能使用）
    let userId = null
    let userTokens = null
    
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        // 清理临时文件
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(401).json({ 
          success: false,
          error: 'Please register or login to use this service',
          requiresAuth: true
        })
      }
      
      const jwt = await import('jsonwebtoken')
      const JWT_SECRET = process.env.JWT_SECRET || 'glowlisting-stable-secret-change-in-prod'
      const decoded = jwt.default.verify(token, JWT_SECRET)
      userId = decoded.userId
      userTokens = await getUserTokensSafe(userId)
    } catch (authError) {
      // 如果token验证失败，要求用户登录
      console.warn('Auth check failed, requiring login')
      // 清理临时文件
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(401).json({ 
        success: false,
        error: 'Please register or login to use this service',
        requiresAuth: true
      })
    }

    const imagePath = req.file.path
    
    // 检查剩余次数（token），不足则拒绝
    if (userTokens <= 0) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(403).json({ success: false, error: 'No images remaining. Please purchase a plan.' })
    }
    let imageBuffer = fs.readFileSync(imagePath)
    let mimeType = req.file.mimetype || 'image/jpeg'
    let finalImagePath = imagePath
    
    // 检查是否为 HEIC 格式，如果是则转换为 JPEG
    const fileExt = path.extname(req.file.originalname).toLowerCase()
    const isHeic = fileExt === '.heic' || fileExt === '.heif' || 
                   mimeType === 'image/heic' || mimeType === 'image/heif'
    
    if (isHeic) {
      console.log('检测到 HEIC 格式，正在转换为 JPEG...')
      try {
        // 使用 heic-convert 转换为 JPEG
        const jpegBuffer = await heicConvert({
          buffer: imageBuffer,
          format: 'JPEG',
          quality: 0.95 // 高质量转换
        })
        
        // 保存转换后的 JPEG 文件
        const jpegPath = imagePath.replace(/\.(heic|heif)$/i, '.jpg')
        fs.writeFileSync(jpegPath, jpegBuffer)
        
        // 更新变量
        imageBuffer = jpegBuffer
        mimeType = 'image/jpeg'
        finalImagePath = jpegPath
        
        // 删除原始 HEIC 文件
        if (fs.existsSync(imagePath) && imagePath !== jpegPath) {
          fs.unlinkSync(imagePath)
        }
        
        console.log('HEIC 转换成功，已转换为 JPEG 格式')
      } catch (heicError) {
        console.error('HEIC 转换失败:', heicError.message)
        throw new Error('HEIC 格式转换失败，请尝试上传 JPEG 或 PNG 格式的图片: ' + heicError.message)
      }
    }

    // 计算原始图片的hash（用于跟踪重新生成次数）- 在HEIC转换之后计算
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex')
    
    // 检查是否是重新生成请求
    const isRegenerate = req.body.isRegenerate === 'true' || req.body.isRegenerate === true
    let regenerateInfo = imageRegenerateMap.get(imageHash)
    
    if (isRegenerate) {
      // 如果是重新生成，检查次数限制
      if (!regenerateInfo) {
        // 如果找不到记录，可能是服务器重启导致记录丢失
        // 在这种情况下，重新初始化为首次生成（允许用户继续使用）
        console.warn(`No previous generation found for image hash ${imageHash}, initializing as first generation`)
        regenerateInfo = {
          regenerateCount: 0,
          originalImageId: null
        }
        imageRegenerateMap.set(imageHash, regenerateInfo)
        // 注意：这里不返回错误，而是继续处理，当作首次生成
      } else {
        // 找到了记录，检查次数限制
        if (regenerateInfo.regenerateCount >= MAX_REGENERATE_COUNT) {
          return res.status(403).json({ 
            error: 'Maximum regenerate count reached',
            regenerateCount: regenerateInfo.regenerateCount,
            maxRegenerateCount: MAX_REGENERATE_COUNT
          })
        }
        
        // 增加重新生成次数
        regenerateInfo.regenerateCount++
        imageRegenerateMap.set(imageHash, regenerateInfo)
      }
    } else {
      // 首次生成，初始化
      regenerateInfo = {
        regenerateCount: 0,
        originalImageId: null
      }
      imageRegenerateMap.set(imageHash, regenerateInfo)
    }
    
    const base64Image = imageBuffer.toString('base64')

    // 创建 job 记录（用于统计/错误率）
    let jobId = null
    if (useDb && userId) {
      const jobResult = await query(
        `INSERT INTO jobs (user_id, status, total_images, processed_images, error_count)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [userId, 'processing', 1, 0, 0]
      )
      jobId = jobResult.rows[0].id
    }

    // 使用 nanobanna (Gemini 2.5 Flash Image) API 进行图像增强
    // 参考文档: https://ai.google.dev/gemini-api/docs/image-generation
    
    // 准备 prompt - Commercial Real Estate Photo Enhancement Prompt (Refined Tonal Balance)
    const prompt = `1. 曝光、色彩与 HDR (Refined Tonal Balance)

核心目标： 明亮、干净，但保持柔和的过渡和自然的对比度。

曝光与白平衡： 校正至完美中性白，墙壁必须是纯净的白色（无任何可见偏色）。

HDR 效果强度： 应用微妙且精致的 HDR 融合，重点在于细节恢复而非戏剧性的对比。

阴影处理： 提亮暗部细节，消除死黑，但保留极轻微、自然的阴影以提供深度和立体感。

高光处理： 精确控制室内光源和天花板的高光，严格避免过曝和光晕，保持细节。

色彩增强： 保持色彩自然、真实。微量提升主要材质（如木材、织物）的生命力，但严禁过度饱和或不真实的鲜艳。

2. 透视与几何 (Crucial Precision)

核心目标： 完美对齐，营造建筑的稳定感和结构美。（保持不变，确保所有线条笔直）

直线对齐： 强制校正所有垂直线和水平线。消除所有倾斜或鱼眼畸变。

空间优化： 在保证不失真的前提下，利用几何校正微调构图，最大限度地展现房间的开阔感，但严禁拉伸或夸大房间尺寸。

3. 天空与外部处理 (Priority: Realism)

核心目标： 绝对优先保留窗外真实景色和光线氛围。

A. 室内照片 (窗户可见)：

真实性优先原则 (强化): 如果窗户外的景色可见清晰细节（如天空、云朵、邻里建筑），严禁替换成任何假景色或假蓝天。

处理焦点: 应用 HDR 融合，使室内和窗外景色的曝光完美平衡。窗外景色必须清晰，但亮度应与室内光线合理融合。

替换条件： 仅在窗外景色完全、不可挽回地过曝（纯白/纯灰）时，才允许替换为简单、自然的柔和蓝天。

B. 室外照片 (Facade/Garden)：

如果天空沉闷或灰暗，替换为明亮、纯净的晴朗蓝天和自然云朵。

4. 杂物移除与画面净化 (Editorial Cleanliness)

核心目标： 达到样板房般的编辑级干净。（保持不变）

必须移除： 所有临时物品、电线、插座（若不影响结构）、小污渍、不必要的个人物品、明显的反光和轻微瑕疵。

清理环境： 移除多余的草屑、地上的小垃圾，使画面背景环境整洁。

5. 高级降噪与细节保留 (High-Fidelity Output)

核心目标： 最终图像必须极度清晰且纹理自然。

降噪标准： 彻底消除噪点，同时最大限度保留墙壁、地毯和织物的精细纹理。避免任何形式的"塑料化"外观。

6. 细节增强与锐化 (Crisp Final Look)

核心目标： 最终输出必须清晰且平滑。

锐化级别： 应用适度、柔和的锐化，提升照片的质感和清晰度，但严格避免边缘光晕或过度锐化的数字化外观。锐化应专注于提升纹理细节而非边缘对比。

7. 摄影风格与合规性

风格参照： 匹配**"极简、现代、高保真"**的房产杂志风格。

最终外观： 整体感觉专业、平静、自然。

原则： 允许技术增强，严禁任何误导性修改。

8. 输出要求 (CRITICAL)

分辨率： 确保最长边至少为 4000 像素（如果源文件质量允许），以便承受高分辨率展示和多次压缩。

质量： 最终 JPEG 质量必须在 90% 以上，确保图像上传到任何平台后仍保持清晰、无损、无压缩带。`

    if (NANOBANNA_API_KEY) {
      try {
        // 调用 nanobanna API
        console.log('Calling nanobanna API for image enhancement...')
        
        const requestBody = {
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              },
              {
                text: prompt
              }
            ]
          }],
          generationConfig: {
            // 注意：某些模型可能不支持 responseModalities: ['IMAGE']
            // 如果 API 返回不支持图像生成，可能需要使用其他方式
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        }

        console.log('Sending request to:', NANOBANNA_API_URL)
        console.log('Image size:', base64Image.length, 'bytes')
        console.log('MIME type:', mimeType)
        
        const apiResponse = await axios.post(
          `${NANOBANNA_API_URL}?key=${NANOBANNA_API_KEY}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 120000, // 120秒超时
            validateStatus: function (status) {
              return status < 500; // 不抛出 4xx 错误，让我们自己处理
            }
          }
        )
        
        console.log('API Response status:', apiResponse.status)
        
        // 检查 HTTP 状态码
        if (apiResponse.status !== 200) {
          console.error('API returned non-200 status:', apiResponse.status)
          console.error('Response data:', JSON.stringify(apiResponse.data, null, 2))
          
          // 提供更友好的错误信息
          let errorMessage = 'Image processing failed'
          if (apiResponse.status === 429) {
            errorMessage = 'API quota exceeded. Please try again later or contact support.'
          } else if (apiResponse.status === 401 || apiResponse.status === 403) {
            errorMessage = 'API authentication failed. Please check API key configuration.'
          } else if (apiResponse.data?.error?.message) {
            errorMessage = `API error: ${apiResponse.data.error.message}`
          } else {
            errorMessage = `API returned error status: ${apiResponse.status}`
          }
          
          throw new Error(errorMessage)
        }

        // 从响应中提取生成的图像
        // 根据 Gemini API 文档，响应格式为: candidates[0].content.parts[].inlineData.data
        let enhancedImageBase64 = null
        
        console.log('API Response status:', apiResponse.status)
        
        // 遍历所有 parts 查找图片数据
        if (apiResponse.data?.candidates?.[0]?.content?.parts) {
          for (const part of apiResponse.data.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              enhancedImageBase64 = part.inlineData.data
              console.log('找到图片数据，大小:', enhancedImageBase64.length, 'bytes')
              break
            }
            // 也检查是否有文本响应（可能包含错误信息）
            if (part.text) {
              console.log('API 返回文本:', part.text.substring(0, 200))
            }
          }
        }
        
        if (!enhancedImageBase64) {
          console.error('未找到图片数据。完整响应:', JSON.stringify(apiResponse.data, null, 2))
          throw new Error('API 响应中未找到图像数据。响应: ' + JSON.stringify(apiResponse.data).substring(0, 500))
        }

        const enhancedImageBuffer = Buffer.from(enhancedImageBase64, 'base64')
        
        // 生成唯一 ID 用于存储原始高清图像
        let imageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        
        // 如果是重新生成，使用原来的imageId（这样下载时能找到正确的文件）
        if (isRegenerate && regenerateInfo.originalImageId) {
          imageId = regenerateInfo.originalImageId
        } else {
          // 首次生成，保存原始imageId
          regenerateInfo.originalImageId = imageId
          imageRegenerateMap.set(imageHash, regenerateInfo)
        }
        
        const hdImagePath = path.join(__dirname, 'uploads', `hd-${imageId}.jpg`)
        
        // 确保目录存在
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
          fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true })
        }
        
        // 保存高清版本
        fs.writeFileSync(hdImagePath, enhancedImageBuffer)
        
        // 创建大型白色半透明水印 - 放在图片正中间，干扰图片内容
        // 先获取图片尺寸以计算合适的水印大小
        const imageMetadata = await sharp(enhancedImageBuffer).metadata()
        const imageWidth = imageMetadata.width || 1200
        const imageHeight = imageMetadata.height || 800
        
        // 计算预览图尺寸（限制最大宽度为 1200px）
        const maxPreviewWidth = 1200
        const previewWidth = imageWidth > maxPreviewWidth ? maxPreviewWidth : imageWidth
        const previewHeight = Math.floor((previewWidth / imageWidth) * imageHeight)
        
        // 水印大小根据预览图尺寸动态调整，占据图片宽度的 55%，确保明显干扰图片内容
        const watermarkWidth = Math.max(500, Math.floor(previewWidth * 0.55))
        const watermarkHeight = Math.floor(watermarkWidth * 0.25)
        const fontSize = Math.floor(watermarkWidth * 0.18) // 字体大小约为水印宽度的 18%，确保足够大
        
        console.log(`水印尺寸: ${watermarkWidth}x${watermarkHeight}, 字体大小: ${fontSize}, 预览图尺寸: ${previewWidth}x${previewHeight}`)
        
        const watermarkSvg = `
          <svg width="${watermarkWidth}" height="${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
            <!-- 白色半透明文字，带轻微阴影以提高可读性 -->
            <defs>
              <filter id="shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <text x="${watermarkWidth / 2}" y="${watermarkHeight / 2 + fontSize / 3}" 
                  font-family="Arial, Helvetica, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="700" 
                  fill="rgba(255,255,255,0.7)" 
                  text-anchor="middle" 
                  filter="url(#shadow)">
              GlowListing
            </text>
          </svg>
        `
        
        // 创建预览图并添加大型中心水印
        // 先创建预览图，然后计算居中位置
        const resizedImage = await sharp(enhancedImageBuffer)
          .resize(previewWidth, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .toBuffer()
        
        const resizedMetadata = await sharp(resizedImage).metadata()
        const actualPreviewWidth = resizedMetadata.width || previewWidth
        const actualPreviewHeight = resizedMetadata.height || previewHeight
        
        // 计算水印在图片中的居中位置
        const watermarkX = Math.floor((actualPreviewWidth - watermarkWidth) / 2)
        const watermarkY = Math.floor((actualPreviewHeight - watermarkHeight) / 2)
        
        console.log(`预览图实际尺寸: ${actualPreviewWidth}x${actualPreviewHeight}`)
        console.log(`水印位置: x=${watermarkX}, y=${watermarkY}`)
        
        const previewImageBuffer = await sharp(resizedImage)
          .composite([
            // 正中间水印 - 使用精确的居中位置
            {
              input: Buffer.from(watermarkSvg),
              left: watermarkX,
              top: watermarkY
            }
          ])
          .jpeg({ quality: 85 })
          .toBuffer()
        
        const previewBase64 = previewImageBuffer.toString('base64')
        
        // 清理临时上传文件
        if (fs.existsSync(finalImagePath)) {
          fs.unlinkSync(finalImagePath)
        }
        // 如果原始 HEIC 文件还存在，也删除它
        if (fs.existsSync(imagePath) && imagePath !== finalImagePath) {
          fs.unlinkSync(imagePath)
        }

        // 注意：增强时不扣token，只有下载时才扣token
        // 但是要记录一次生成（用于统计Total Token Usage）
        let remainingTokens = null
        if (userId) {
          // 消耗一次（1 token = 1 image）
          remainingTokens = await decrementUserTokensSafe(userId, 'process')
          await recordTokenUsageSafe(userId, 'process', imageId)
          
          // 保存图片到数据库（永久保存历史）
          if (useDb) {
            try {
              // 生成缩略图（用于历史记录列表显示）
              const thumbnailBuffer = await sharp(enhancedImageBuffer)
                .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer()
              
              const originalBase64 = base64Image // 原图 base64
              const enhancedBase64 = enhancedImageBase64 // 增强图 base64
              const thumbnailBase64 = thumbnailBuffer.toString('base64') // 缩略图 base64
              
              // 如果是重新生成，更新现有记录；否则创建新记录
              if (isRegenerate && regenerateInfo.originalImageId) {
                await query(
                  `UPDATE images 
                   SET enhanced_data = $1, thumbnail_data = $2, updated_at = NOW()
                   WHERE id = $3 AND user_id = $4`,
                  [`data:image/jpeg;base64,${enhancedBase64}`, `data:image/jpeg;base64,${thumbnailBase64}`, imageId, userId]
                )
              } else {
                // 生成 UUID 作为数据库 ID
                const dbImageId = crypto.randomUUID()
                await query(
                  `INSERT INTO images (id, user_id, filename, original_filename, original_data, enhanced_data, thumbnail_data, file_size, mime_type, hd_path, thumbnail_path)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                  [
                    dbImageId,
                    userId,
                    `glowlisting-enhanced-${imageId}.jpg`,
                    req.file?.originalname || 'uploaded-image.jpg',
                    `data:${mimeType};base64,${originalBase64}`,
                    `data:image/jpeg;base64,${enhancedBase64}`,
                    `data:image/jpeg;base64,${thumbnailBase64}`,
                    req.file?.size || 0,
                    mimeType,
                    `hd-${imageId}.jpg`,
                    `thumb-${imageId}.jpg`
                  ]
                )
                // 更新 imageId 为数据库 UUID，用于后续查询
                imageId = dbImageId
              }
            } catch (dbError) {
              console.error('Failed to save image to database:', dbError)
              // 不阻止响应，即使数据库保存失败也继续
            }
          }
        }

        // 设置响应头包含剩余token
        if (remainingTokens !== null) {
          res.setHeader('X-Tokens-Remaining', remainingTokens.toString())
        }

        // 更新 job 状态成功
        if (useDb && jobId) {
          try {
            await query(
              `UPDATE jobs 
               SET status = 'succeeded', processed_images = 1, error_count = 0, finished_at = NOW()
               WHERE id = $1`,
              [jobId]
            )
          } catch (jobErr) {
            console.error('更新 job 状态失败:', jobErr)
          }
        }

        res.json({
          success: true,
          image: `data:image/jpeg;base64,${previewBase64}`, // 预览图（带水印）
          imageId: imageId, // 用于下载高清版本
          regenerateCount: regenerateInfo.regenerateCount, // 当前重新生成次数
          remainingRegenerates: MAX_REGENERATE_COUNT - regenerateInfo.regenerateCount, // 剩余重新生成次数
          message: '图像已通过 nanobanna API 增强处理。'
        })
      } catch (apiError) {
        console.error('nanobanna API error:', apiError.message)
        console.error('Error details:', apiError.response?.data || apiError)
        console.error('Error status:', apiError.response?.status)
        console.error('Error headers:', apiError.response?.headers)
        
        // job 标记失败 + 推送
        if (useDb && jobId) {
          try {
            await query(
              `UPDATE jobs 
               SET status = 'failed', error_count = 1, error_message = $1, finished_at = NOW()
               WHERE id = $2`,
              [apiError.message || 'enhance failed', jobId]
            )
            if (userId) {
              wsBroadcastToUser(userId, {
                type: 'job_failed',
                jobId,
                error: apiError.message || 'enhance failed'
              })
            }
          } catch (jobErr) {
            console.error('更新 job 失败状态出错:', jobErr)
          }
        }

        // 清理临时文件
        if (fs.existsSync(finalImagePath)) {
          fs.unlinkSync(finalImagePath)
        }
        if (fs.existsSync(imagePath) && imagePath !== finalImagePath) {
          fs.unlinkSync(imagePath)
        }

        // 提取详细的错误信息
        let errorMessage = '图片处理失败'
        if (apiError.response?.data) {
          const errorData = apiError.response.data
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        // 如果 API 调用失败，不应该消耗用户的 token
        // 所以这里不减少 token

        res.status(500).json({
          success: false,
          error: '图片处理失败',
          message: errorMessage,
          details: apiError.response?.data || null
        })
      }
    } else {
      // 如果没有配置 API key，返回错误
      // 注意：此时 finalImagePath 可能还未定义（如果 HEIC 转换失败）
      if (typeof finalImagePath !== 'undefined' && fs.existsSync(finalImagePath)) {
        fs.unlinkSync(finalImagePath)
      }
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      res.status(400).json({
        success: false,
        error: '未配置 nanobanna API key'
      })
    }
  } catch (error) {
    console.error('Enhance error:', error)
    console.error('Error stack:', error.stack)
    
    // 清理临时文件（如果存在）
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError)
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: '图片处理失败',
      message: error.message || '未知错误',
      details: process.env.NODE_ENV === 'development' ? error.stack : null
    })
  }
})

// ==================== 下载高清版本 API ====================

app.get('/api/download/:imageId', authMiddleware, async (req, res) => {
  try {
    const { imageId } = req.params
    const userId = req.userId
    
    // 查找高清图像文件
    const hdImagePath = path.join(__dirname, 'uploads', `hd-${imageId}.jpg`)
    
    if (!fs.existsSync(hdImagePath)) {
      return res.status(404).json({ error: 'Image not found' })
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Content-Disposition', `attachment; filename="glowlisting-enhanced-${imageId}.jpg"`)
    const remaining = await getUserTokensSafe(userId)
    res.setHeader('X-Tokens-Remaining', remaining.toString())
    
    // 发送文件
    const fileStream = fs.createReadStream(hdImagePath)
    fileStream.pipe(res)
    
    // 文件发送完成后，可以选择删除文件（可选）
    // fileStream.on('end', () => {
    //   fs.unlinkSync(hdImagePath)
    // })
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ 
      error: '下载失败',
      message: error.message 
    })
  }
})

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GlowListing API is running' })
})

// ==================== Stripe 支付 ====================
// 返回可公开的 publishable key
app.get('/api/payments/config', (req, res) => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Stripe publishable key is not configured' })
  }
  res.json({ 
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    stripeConfigured: !!stripe,
    hasSecretKey: !!STRIPE_SECRET_KEY
  })
})

// 测试 Stripe 配置（仅用于调试）
app.get('/api/payments/test-config', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not initialized',
        details: {
          hasSecretKey: !!STRIPE_SECRET_KEY,
          secretKeyPrefix: STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'missing'
        }
      })
    }
    
    // 测试 Stripe API 连接
    const account = await stripe.account.retrieve()
    
    res.json({
      success: true,
      stripeConfigured: true,
      accountId: account.id,
      country: account.country,
      defaultCurrency: account.default_currency
    })
  } catch (error) {
    console.error('Stripe test error:', error)
    res.status(500).json({
      error: 'Stripe configuration test failed',
      message: error.message,
      type: error.type
    })
  }
})

// 创建 Checkout Session
app.post('/api/payments/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe secret key not configured')
      return res.status(500).json({ error: 'Stripe secret key is not configured', message: 'Payment service is not available. Please contact support.' })
    }

    const { planType = 'pro', successUrl, cancelUrl } = req.body
    const origin = req.headers.origin || FRONTEND_URL
    const userId = req.userId
    
    if (!userId) {
      console.error('No userId in request')
      return res.status(401).json({ error: 'User not authenticated', message: 'Please login to continue' })
    }

    const currentUser = await getUserByIdSafe(userId)
    if (!currentUser) {
      console.error('User not found:', userId)
      return res.status(404).json({ error: 'User not found', message: 'User account not found. Please try logging in again.' })
    }

    const customerEmail = currentUser?.email
    if (!customerEmail) {
      console.error('User email not found:', userId)
      return res.status(400).json({ error: 'User email not found', message: 'Please update your email address in your profile.' })
    }

    console.log('Creating checkout session:', { 
      planType, 
      userId, 
      customerEmail, 
      origin, 
      successUrl, 
      cancelUrl,
      usingPriceId: planType === 'pro' ? !!PLAN_PRO.priceId : !!PACK_ONETIME.priceId,
      proPriceId: PLAN_PRO.priceId || 'not set',
      packPriceId: PACK_ONETIME.priceId || 'not set'
    })

    let sessionPayload = {
      client_reference_id: String(userId),
      metadata: {
        userId: String(userId),
        planType,
      },
      success_url: successUrl || `${origin}/payment-success`,
      cancel_url: cancelUrl || `${origin}/payment-cancel`,
      customer_email: customerEmail,
    }

    if (planType === 'pro') {
      // 优先使用 Stripe Dashboard 中创建的 Price ID
      if (PLAN_PRO.priceId) {
        // 检查是否是 Price ID (price_xxxxx) 还是 Product ID (prod_xxxxx)
        const isPriceId = PLAN_PRO.priceId.startsWith('price_')
        const isProductId = PLAN_PRO.priceId.startsWith('prod_')
        
        if (isPriceId) {
          console.log('Using Stripe Price ID for Pro plan:', PLAN_PRO.priceId)
          sessionPayload = {
            ...sessionPayload,
            mode: 'subscription',
            subscription_data: {
              metadata: { userId: String(userId), planType },
            },
            line_items: [
              {
                price: PLAN_PRO.priceId,
                quantity: 1,
              },
            ],
          }
        } else if (isProductId) {
          console.log('Using Stripe Product ID for Pro plan (will create price dynamically):', PLAN_PRO.priceId)
          // 如果提供的是 Product ID，使用 price_data 并指定 product
          sessionPayload = {
            ...sessionPayload,
            mode: 'subscription',
            subscription_data: {
              metadata: { userId: String(userId), planType },
            },
            line_items: [
              {
                price_data: {
                  currency: PLAN_PRO.currency,
                  product: PLAN_PRO.priceId, // 使用 Product ID
                  unit_amount: PLAN_PRO.amount,
                  recurring: { 
                    interval: PLAN_PRO.interval,
                  },
                },
                quantity: 1,
              },
            ],
          }
        } else {
          console.error('Invalid Price/Product ID format for Pro plan:', PLAN_PRO.priceId)
          return res.status(400).json({ 
            error: 'Invalid Price ID format', 
            message: 'Price ID must start with "price_" or "prod_". Please check your STRIPE_PRICE_ID_PRO environment variable.' 
          })
        }
      } else {
        console.log('Using price_data for Pro plan (Price ID not set)')
        // 使用 price_data 动态创建（需要确保格式正确）
        sessionPayload = {
          ...sessionPayload,
          mode: 'subscription',
          subscription_data: {
            metadata: { userId: String(userId), planType },
          },
          line_items: [
            {
              price_data: {
                currency: PLAN_PRO.currency,
                product_data: { 
                  name: PLAN_PRO.name,
                  description: `${PLAN_PRO.imagesPerMonth} images per month`,
                },
                unit_amount: PLAN_PRO.amount,
                recurring: { 
                  interval: PLAN_PRO.interval,
                },
              },
              quantity: 1,
            },
          ],
        }
      }
    } else if (planType === 'pack') {
      // 优先使用 Stripe Dashboard 中创建的 Price ID
      if (PACK_ONETIME.priceId) {
        // 检查是否是 Price ID (price_xxxxx) 还是 Product ID (prod_xxxxx)
        const isPriceId = PACK_ONETIME.priceId.startsWith('price_')
        const isProductId = PACK_ONETIME.priceId.startsWith('prod_')
        
        if (isPriceId) {
          console.log('Using Stripe Price ID for Pack plan:', PACK_ONETIME.priceId)
          sessionPayload = {
            ...sessionPayload,
            mode: 'payment',
            payment_intent_data: {
              metadata: { userId: String(userId), planType },
            },
            line_items: [
              {
                price: PACK_ONETIME.priceId,
                quantity: 1,
              },
            ],
          }
        } else if (isProductId) {
          console.log('Using Stripe Product ID for Pack plan (will create price dynamically):', PACK_ONETIME.priceId)
          // 如果提供的是 Product ID，使用 price_data 并指定 product
          sessionPayload = {
            ...sessionPayload,
            mode: 'payment',
            payment_intent_data: {
              metadata: { userId: String(userId), planType },
            },
            line_items: [
              {
                price_data: {
                  currency: PACK_ONETIME.currency,
                  product: PACK_ONETIME.priceId, // 使用 Product ID
                  unit_amount: PACK_ONETIME.amount,
                },
                quantity: 1,
              },
            ],
          }
        } else {
          console.error('Invalid Price/Product ID format for Pack plan:', PACK_ONETIME.priceId)
          return res.status(400).json({ 
            error: 'Invalid Price ID format', 
            message: 'Price ID must start with "price_" or "prod_". Please check your STRIPE_PRICE_ID_PACK environment variable.' 
          })
        }
      } else {
        // 使用 price_data 动态创建
        sessionPayload = {
          ...sessionPayload,
          mode: 'payment',
          payment_intent_data: {
            metadata: { userId: String(userId), planType },
          },
          line_items: [
            {
              price_data: {
                currency: PACK_ONETIME.currency,
                product_data: { 
                  name: PACK_ONETIME.name,
                  description: `${PACK_ONETIME.images} images`,
                },
                unit_amount: PACK_ONETIME.amount,
              },
              quantity: 1,
            },
          ],
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid plan type', message: `Plan type "${planType}" is not supported. Please select a valid plan.` })
    }

    console.log('Stripe session payload:', JSON.stringify(sessionPayload, null, 2))
    console.log('Stripe instance check:', {
      hasStripe: !!stripe,
      hasSecretKey: !!STRIPE_SECRET_KEY,
      secretKeyPrefix: STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'missing'
    })
    
    // 验证 Stripe 配置
    if (!stripe) {
      console.error('Stripe instance is null')
      return res.status(500).json({ 
        error: 'Stripe not initialized', 
        message: 'Stripe payment service is not available. Please contact support.',
        details: 'STRIPE_SECRET_KEY is not set or invalid'
      })
    }
    
    const session = await stripe.checkout.sessions.create(sessionPayload)
    console.log('Stripe session created:', { id: session.id, url: session.url })

    if (!session.url) {
      console.error('Stripe session created but no URL returned:', session)
      return res.status(500).json({ error: 'Failed to get checkout URL', message: 'Checkout session was created but no URL was returned. Please try again.' })
    }

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Create checkout session error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw,
      stack: error.stack
    })
    const errorMessage = error.message || 'Failed to create checkout session'
    const userMessage = error.type === 'StripeCardError' 
      ? 'Your card was declined. Please check your card details and try again.'
      : error.type === 'StripeRateLimitError'
      ? 'Too many requests. Please try again in a moment.'
      : error.type === 'StripeInvalidRequestError'
      ? 'Invalid request. Please check your information and try again.'
      : error.type === 'StripeAPIError'
      ? 'Payment service error. Please try again later.'
      : 'Failed to create checkout session. Please try again or contact support.'
    
    res.status(error.statusCode || 500).json({ 
      error: errorMessage,
      message: userMessage,
      type: error.type,
      code: error.code
    })
  }
})

// Stripe Webhook（简化处理，不校验签名，如果需要请配置 STRIPE_WEBHOOK_SECRET 并启用校验）
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event = req.body

  // 可选：如果配置了 webhook secret，则验证签名
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      const sig = req.headers['stripe-signature']
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      const planType = session.metadata?.planType

      if (userId && planType === 'pack') {
        await addTokensToUserSafe(userId, PACK_ONETIME.images)
        if (useDb) {
          await query(
            `INSERT INTO revenue (user_id, amount, currency, source) VALUES ($1,$2,$3,$4)`,
            [userId, PACK_ONETIME.amount / 100, PACK_ONETIME.currency, 'stripe_pack']
          )
        }
      } else if (userId && planType === 'pro') {
        await setUserTokensSafe(userId, PLAN_PRO.imagesPerMonth)
        if (useDb) {
          await query(
            `INSERT INTO revenue (user_id, amount, currency, source) VALUES ($1,$2,$3,$4)`,
            [userId, PLAN_PRO.amount / 100, PLAN_PRO.currency, 'stripe_pro']
          )
          await query(
            `INSERT INTO subscriptions (user_id, plan_type, status, current_period_end)
             VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days')
             ON CONFLICT (user_id) DO UPDATE SET plan_type=$2, status='active', current_period_end=EXCLUDED.current_period_end`,
            [userId, 'pro']
          )
        }
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      const userId = invoice.metadata?.userId || invoice.customer_email // fallback
      if (userId) {
        await setUserTokensSafe(userId, PLAN_PRO.imagesPerMonth)
        if (useDb) {
          await query(
            `INSERT INTO revenue (user_id, amount, currency, source) VALUES ($1,$2,$3,$4)`,
            [userId, (invoice.amount_paid || PLAN_PRO.amount) / 100, invoice.currency || PLAN_PRO.currency, 'stripe_pro']
          )
          const periodEnd = invoice.lines?.data?.[0]?.period?.end || Math.floor(Date.now() / 1000) + 2592000
          await query(
            `INSERT INTO subscriptions (user_id, plan_type, status, current_period_end)
             VALUES ($1, $2, 'active', to_timestamp($3))
             ON CONFLICT (user_id) DO UPDATE SET plan_type=$2, status='active', current_period_end=to_timestamp($3)`,
            [userId, 'pro', periodEnd]
          )
        }
      }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const subscription = event.data.object
      const userId = subscription.metadata?.userId || subscription.customer_email
      if (userId) {
        // 禁用订阅权益：不自动清零，用户仍保留当前剩余次数
        console.log(`Subscription ended for user ${userId}`)
        if (useDb) {
          await query(
            `UPDATE subscriptions SET status='canceled', current_period_end=NOW() WHERE user_id=$1`,
            [userId]
          )
        }
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).send()
  }
})

// 测试邮件发送端点（仅用于测试）
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, language = 'en' } = req.body
    if (!to) {
      return res.status(400).json({ error: 'Email address is required' })
    }

    const sendGridApiKey = process.env.SENDGRID_API_KEY
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@glowlisting.ai'
    const fromName = process.env.SMTP_FROM_NAME || 'GlowListing'
    
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpSecure = process.env.SMTP_SECURE === 'true'

    if (!sendGridApiKey && (!smtpHost || !smtpPort || !smtpUser || !smtpPass)) {
      return res.status(500).json({ error: 'Email service configuration is incomplete' })
    }

    const testCode = '123456' // 测试验证码
    const mailLanguage = language === 'zh' ? 'zh' : 'en'
    
    console.log(`📧 发送测试邮件到 ${to}，语言: ${language}，使用: ${mailLanguage}`)

    // 根据语言生成邮件内容
    let subject, htmlContent, textContent
    
    if (mailLanguage === 'zh') {
      // 中文测试邮件
      subject = 'GlowListing 测试邮件'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing 测试邮件</h2>
          <p>您好！</p>
          <p>这是一封测试邮件，用于验证邮件配置是否正确。</p>
          <p>测试验证码是：</p>
          <div style="background-color: #F3F4F6; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0; letter-spacing: 5px;">${testCode}</h1>
          </div>
          <p>如果您收到这封邮件，说明邮件配置成功！✅</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. 保留所有权利。
          </p>
        </div>
      `
      textContent = `测试验证码: ${testCode}`
      textContent = `这是一封测试邮件。测试验证码是: ${testCode}`
    } else {
      // 英文测试邮件
      subject = 'GlowListing Test Email'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">GlowListing Test Email</h2>
          <p>Hello!</p>
          <p>This is a test email to verify the email configuration.</p>
          <p>Test verification code:</p>
          <div style="background-color: #F3F4F6; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0; letter-spacing: 5px;">${testCode}</h1>
          </div>
          <p>If you receive this email, the configuration is successful! ✅</p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            © 2025 GlowListing. All rights reserved.
          </p>
        </div>
      `
      textContent = `This is a test email. Test code: ${testCode}`
    }

    console.log(`📧 邮件主题: ${subject}`)
    console.log(`📧 邮件语言: ${mailLanguage}`)
    
    // 优先使用 SendGrid API
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey)
      
      const msg = {
        to: to,
        from: {
          email: sendGridFromEmail,
          name: fromName,
        },
        subject: subject,
        text: textContent,
        html: htmlContent,
      }

      await sgMail.send(msg)
      console.log(`✅ 测试邮件已通过 SendGrid 成功发送到 ${to} (${mailLanguage === 'zh' ? '中文' : '英文'})`)
    } 
    // 备选：使用 SMTP
    else if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        requireTLS: !smtpSecure && parseInt(smtpPort) === 587,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
      })

      await transporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent,
      })

      console.log(`✅ 测试邮件已通过 SMTP 成功发送到 ${to} (${mailLanguage === 'zh' ? '中文' : '英文'})`)
    }

    res.json({
      success: true,
      message: `Test email sent successfully to ${to}`,
    })
  } catch (error) {
    console.error('发送测试邮件失败:', error)
    console.error('错误代码:', error.code)
    console.error('错误消息:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message,
    })
  }
})

// 清理超过30分钟的图片记录（定时任务）
const cleanupOldImages = async () => {
  if (!useDb) return
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const result = await query(
      `DELETE FROM images WHERE created_at < $1`,
      [thirtyMinutesAgo]
    )
    if (result.rowCount > 0) {
      console.log(`🧹 清理了 ${result.rowCount} 条超过30分钟的图片记录`)
    }
  } catch (error) {
    console.error('清理旧图片记录失败:', error.message)
  }
}

// 启动时自动运行迁移（如果数据库可用）
if (useDb) {
  (async () => {
    try {
      // 检查 admin_audit_logs 表是否存在，如果不存在则运行迁移
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_audit_logs'
        )
      `)
      const tableExists = tableCheck.rows[0]?.exists
      
      if (!tableExists) {
        console.log('🔄 检测到新的迁移，正在运行...')
        const migrationPath = path.join(__dirname, 'db', 'migrations', '004_admin_audit_logs.sql')
        if (fs.existsSync(migrationPath)) {
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
          await query(migrationSQL)
          console.log('✅ 迁移完成: admin_audit_logs 表已创建')
        }
      }
      
      // 检查并运行图片历史迁移（如果表存在但字段不存在）
      try {
        const imagesTableCheck = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'images' AND column_name = 'original_data'
        `)
        if (imagesTableCheck.rows.length === 0) {
          // 字段不存在，运行迁移
          console.log('🔄 检测到需要运行图片历史迁移...')
          const migrationPath = path.join(__dirname, 'db', 'migrations', '005_images_history.sql')
          if (fs.existsSync(migrationPath)) {
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
            await query(migrationSQL)
            console.log('✅ 迁移完成: images 表已扩展')
          }
        }
      } catch (migrationError) {
        console.warn('⚠️ 图片历史迁移检查失败（不影响应用启动）:', migrationError.message)
      }
      
      // 检查并运行 messages 表迁移
      try {
        const messagesTableCheck = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'messages'
          )
        `)
        const messagesTableExists = messagesTableCheck.rows[0]?.exists
        
        if (!messagesTableExists) {
          console.log('🔄 检测到需要运行 messages 表迁移...')
          const migrationPath = path.join(__dirname, 'db', 'migrations', '010_messages.sql')
          if (fs.existsSync(migrationPath)) {
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
            await query(migrationSQL)
            console.log('✅ 迁移完成: messages 表已创建')
          }
        }
      } catch (migrationError) {
        console.warn('⚠️ messages 表迁移检查失败（不影响应用启动）:', migrationError.message)
      }
      
      // 启动时清理一次旧图片
      await cleanupOldImages()
      
      // 每10分钟清理一次超过30分钟的图片
      setInterval(cleanupOldImages, 10 * 60 * 1000)
      console.log('🔄 已启动图片清理任务（每10分钟清理超过30分钟的图片）')
    } catch (error) {
      console.error('⚠️ 迁移检查失败（不影响应用启动）:', error.message)
    }
  })()
}

const wss = new WebSocketServer({ noServer: true })

// Broadcast helper
const wsSend = (ws, data) => {
  try {
    ws.send(JSON.stringify(data))
  } catch (e) {
    console.error('WS send error:', e)
  }
}

const wsBroadcastToUser = (userId, payload) => {
  const set = wsClients.get(userId)
  if (!set) return
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) {
      wsSend(ws, payload)
    }
  }
}

// 广播给所有管理员
const wsBroadcastToAdmins = async (payload) => {
  if (!useDb) return
  try {
    const adminRows = await query(`SELECT id FROM users WHERE is_admin = TRUE`)
    for (const row of adminRows.rows) {
      wsBroadcastToUser(row.id, payload)
    }
  } catch (e) {
    console.error('wsBroadcastToAdmins error:', e)
  }
}

// Upgrade server to handle WS
const server = app.listen(PORT, () => {
  console.log(`🚀 GlowListing API 服务器运行在 http://localhost:${PORT}`)
  console.log(`📝 已配置 nanobanna API 进行图像增强`)
  console.log(`📧 SMTP配置: ${process.env.SMTP_HOST || '未配置'}`)
  if (useDb) {
    console.log(`🗄️  数据库连接: 已配置`)
  }
})

server.on('upgrade', (req, socket, head) => {
  // Auth via query ?token= or header Authorization
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token') || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null)
  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }
  let userId = null
  try {
    const jwt = JSON.parse(JSON.stringify({})) // placeholder to satisfy lint; actual import below
  } catch (e) {}
  import('jsonwebtoken').then(({ default: jwt }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      userId = decoded.userId
    } catch (e) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      if (!wsClients.has(userId)) wsClients.set(userId, new Set())
      wsClients.get(userId).add(ws)
      ws.on('close', () => {
        const set = wsClients.get(userId)
        if (set) {
          set.delete(ws)
          if (set.size === 0) wsClients.delete(userId)
        }
      })
      wsSend(ws, { type: 'connected', userId })
    })
  }).catch(() => {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  })
})

