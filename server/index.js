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

// 加载环境变量
dotenv.config()
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
} from './auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

// Stripe plan constants
const PLAN_PRO = {
  id: 'glowlisting_pro',
  name: 'GlowListing Pro',
  amount: 2900, // cents
  currency: 'usd',
  interval: 'month',
  imagesPerMonth: 100,
}

const PACK_ONETIME = {
  id: 'one_time_photo_pack',
  name: 'One-Time Photo Pack',
  amount: 2900, // cents
  currency: 'usd',
  images: 25,
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

// 中间件
app.use(cors())

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

    // 发送邮件
    try {
      // 检查SMTP配置
      const smtpHost = process.env.SMTP_HOST
      const smtpPort = process.env.SMTP_PORT
      const smtpUser = process.env.SMTP_USER
      const smtpPass = process.env.SMTP_PASS
      const smtpSecure = process.env.SMTP_SECURE === 'true'
      const fromName = process.env.SMTP_FROM_NAME || 'GlowListing'

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn('SMTP配置不完整，验证码仅在控制台输出:', code)
        console.log(`验证码已发送到 ${email}: ${code} (10分钟内有效)`)
      } else {
        // 创建邮件传输器
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: smtpSecure, // true for 465, false for other ports
          requireTLS: !smtpSecure, // 对于587端口使用STARTTLS
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false, // 仅用于测试，生产环境应设为true
          },
        })

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

        // 发送邮件
        await transporter.sendMail({
          from: `"${fromName}" <${smtpUser}>`,
          to: email,
          subject: subject,
          html: htmlContent,
          text: textContent,
        })

        console.log(`✅ 验证码邮件已成功发送到 ${email}`)
      }
    } catch (emailError) {
      console.error('发送邮件失败:', emailError)
      // 即使邮件发送失败，也返回成功（避免泄露配置问题）
      // 但在开发环境可以记录错误
      if (process.env.NODE_ENV === 'development') {
        console.error('邮件发送错误详情:', emailError.message)
      }
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email',
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
    const userTokens = getUserTokens(user.id)

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
    const userTokens = getUserTokens(user.id)

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

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userTokens = getUserTokens(req.userId)

    // 移除密码
    const { password: _, ...userWithoutPassword } = user

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
const adminMiddleware = (req, res, next) => {
  try {
    const user = getUserById(req.userId)
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// 获取统计数据
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
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
      
      customStats = {
        totalRevenue: getRevenueStats(customStart, customEnd).totalRevenue,
        tokenUsage: getTokenUsageStats(customStart, customEnd),
      }
      
      // 生成图表数据（按日期分组）
      chartData = getChartData(customStart, customEnd)
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
      chartData = getChartData(chartStart, chartEnd)
    }

    const stats = {
      // 在线人数
      activeUsers: getActiveSessionsCount(),
      
      // 注册用户数
      totalUsers: users.length,
      
      // 总收入
      totalRevenue: {
        today: getRevenueStats(today, now).totalRevenue,
        yesterday: getRevenueStats(yesterday, new Date(yesterday.getTime() + 86400000 - 1)).totalRevenue,
        weekToDate: getRevenueStats(thisWeek, now).totalRevenue,
        lastWeek: getRevenueStats(lastWeek, new Date(thisWeek.getTime() - 1)).totalRevenue,
        monthToDate: getRevenueStats(thisMonth, now).totalRevenue,
        yearToDate: getRevenueStats(thisYear, now).totalRevenue,
        allTime: getRevenueStats(allTime, now).totalRevenue,
        ...(customStats && { custom: customStats.totalRevenue }),
      },
      
      // 总订阅数
      subscriptions: getSubscriptionStats(),
      
      // Token消耗情况
      tokenUsage: {
        today: getTokenUsageStats(today, now),
        yesterday: getTokenUsageStats(yesterday, new Date(yesterday.getTime() + 86400000 - 1)),
        weekToDate: getTokenUsageStats(thisWeek, now),
        lastWeek: getTokenUsageStats(lastWeek, new Date(thisWeek.getTime() - 1)),
        monthToDate: getTokenUsageStats(thisMonth, now),
        yearToDate: getTokenUsageStats(thisYear, now),
        allTime: getTokenUsageStats(allTime, now),
        ...(customStats && { custom: customStats.tokenUsage }),
      },
    }

    res.json({ success: true, stats, chartData })
  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取所有用户列表
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const allUsers = getAllUsers()
    res.json({ success: true, users: allUsers })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除用户
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId } = req.params
    
    // 不能删除自己
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    
    deleteUser(userId)
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 切换用户管理员权限
app.put('/api/admin/users/:userId/toggle-admin', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId } = req.params
    
    // 不能修改自己的权限
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot modify your own admin status' })
    }
    
    const user = toggleUserAdmin(userId)
    const { password, ...userWithoutPassword } = user
    
    res.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 为用户充值Token
app.post('/api/admin/users/:userId/tokens', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId } = req.params
    const { amount } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' })
    }
    
    const newTokenCount = addTokensToUser(userId, amount)
    res.json({ success: true, tokens: newTokenCount, message: 'Tokens added successfully' })
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
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
      userId = decoded.userId
      userTokens = getUserTokens(userId)
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

    // 使用 nanobanna (Gemini 2.5 Flash Image) API 进行图像增强
    // 参考文档: https://ai.google.dev/gemini-api/docs/image-generation
    const NANOBANNA_API_KEY = process.env.NANOBANNA_API_KEY || 'AIzaSyCRSRCLsmrqXlTaAoRRlF6a6FQxzJ3oYxo'
    // 使用正确的模型: gemini-2.5-flash-image (Nano Banana)
    // 注意：如果免费配额用完，可能需要升级到付费计划
    const NANOBANNA_API_URL = process.env.NANOBANNA_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
    
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
        console.log('API Key (first 10 chars):', NANOBANNA_API_KEY.substring(0, 10) + '...')
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
          throw new Error(`API 返回错误状态码: ${apiResponse.status}. 错误信息: ${JSON.stringify(apiResponse.data)}`)
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
          remainingTokens = decrementUserTokens(userId, 'process')
          recordTokenUsage(userId, 'process')
          const user = getUserById(userId)
          if (user) {
            user.totalProcessed = (user.totalProcessed || 0) + 1
            user.tokensUsed = (user.tokensUsed || 0) + 1
          }
        }

        // 设置响应头包含剩余token
        if (remainingTokens !== null) {
          res.setHeader('X-Tokens-Remaining', remainingTokens.toString())
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
    res.setHeader('X-Tokens-Remaining', getUserTokens(userId).toString())
    
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
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY })
})

// 创建 Checkout Session
app.post('/api/payments/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe secret key is not configured' })
    }

    const { planType = 'pro', successUrl, cancelUrl } = req.body
    const origin = req.headers.origin || 'http://localhost:5173'
    const userId = req.userId

    let sessionPayload = {
      client_reference_id: userId,
      metadata: {
        userId,
        planType,
      },
      success_url: successUrl || `${origin}/payment-success`,
      cancel_url: cancelUrl || `${origin}/payment-cancel`,
    }

    if (planType === 'pro') {
      sessionPayload = {
        ...sessionPayload,
        mode: 'subscription',
        subscription_data: {
          metadata: { userId, planType },
        },
        line_items: [
          {
            price_data: {
              currency: PLAN_PRO.currency,
              product_data: { name: PLAN_PRO.name },
              unit_amount: PLAN_PRO.amount,
              recurring: { interval: PLAN_PRO.interval },
            },
            quantity: 1,
          },
        ],
      }
    } else if (planType === 'pack') {
      sessionPayload = {
        ...sessionPayload,
        mode: 'payment',
        payment_intent_data: {
          metadata: { userId, planType },
        },
        line_items: [
          {
            price_data: {
              currency: PACK_ONETIME.currency,
              product_data: { name: PACK_ONETIME.name },
              unit_amount: PACK_ONETIME.amount,
            },
            quantity: 1,
          },
        ],
      }
    } else {
      return res.status(400).json({ error: 'Invalid plan type' })
    }

    const session = await stripe.checkout.sessions.create(sessionPayload)

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Create checkout session error:', error)
    res.status(500).json({ error: 'Failed to create checkout session', message: error.message })
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
        addTokensToUser(userId, PACK_ONETIME.images)
      } else if (userId && planType === 'pro') {
        setUserTokens(userId, PLAN_PRO.imagesPerMonth)
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      const userId = invoice.metadata?.userId || invoice.customer_email // fallback
      if (userId) {
        setUserTokens(userId, PLAN_PRO.imagesPerMonth)
      }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const subscription = event.data.object
      const userId = subscription.metadata?.userId || subscription.customer_email
      if (userId) {
        // 禁用订阅权益：不自动清零，用户仍保留当前剩余次数
        console.log(`Subscription ended for user ${userId}`)
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

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpSecure = process.env.SMTP_SECURE === 'true'
    const fromName = process.env.SMTP_FROM_NAME || 'GlowListing'

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return res.status(500).json({ error: 'SMTP configuration is incomplete' })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure,
      requireTLS: !smtpSecure, // 对于587端口使用STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false, // 仅用于测试，生产环境应设为true
      },
    })

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
    
    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent,
    })

    console.log(`✅ 测试邮件已成功发送到 ${to} (${mailLanguage === 'zh' ? '中文' : '英文'})`)
    res.json({
      success: true,
      message: `Test email sent successfully to ${to}`,
    })
  } catch (error) {
    console.error('发送测试邮件失败:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 GlowListing API 服务器运行在 http://localhost:${PORT}`)
  console.log(`📝 已配置 nanobanna API 进行图像增强`)
  console.log(`📧 SMTP配置: ${process.env.SMTP_HOST || '未配置'}`)
})

