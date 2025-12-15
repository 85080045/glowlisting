import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { query } from './db/client.js'

// 使用稳定的默认 JWT_SECRET，避免每次重启 token 失效；可被环境变量覆盖
const JWT_SECRET = process.env.JWT_SECRET || 'glowlisting-stable-secret-change-in-prod'

const useDb = !!process.env.DATABASE_URL

// 简单的内存数据库（生产环境应使用真实数据库，已改为优先使用 Postgres）
const users = []
const tokens = new Map() // userId -> token count (fallback for无数据库)
const activeSessions = new Set() // 在线用户session ID集合
const tokenUsageHistory = [] // Token使用历史记录 { userId, timestamp, action }
const revenueHistory = [] // 收入记录 { userId, amount, timestamp, type }
const subscriptions = [] // 订阅记录 { userId, plan, startDate, endDate, status }
const passwordResetTokens = new Map() // email -> { token, expiresAt }

// 初始化默认用户（用于测试）
users.push({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: bcrypt.hashSync('password123', 10),
  createdAt: new Date(),
  totalProcessed: 0,
  tokensUsed: 0,
  isAdmin: false,
})
tokens.set('1', 10) // 给测试用户10个token

// 超级管理员账户
users.push({
  id: '999',
  name: 'Super Admin',
  email: 'dingmason@gmail.com',
  password: '$2a$10$2703XbKuA8714QX00ULjJekUKwJDiFrq9dGDwn5uRqKYKbVGBCanK', // dy5878022
  createdAt: new Date(),
  totalProcessed: 0,
  tokensUsed: 0,
  isAdmin: true,
})
tokens.set('999', 9999) // 超级管理员有9999个token

export const authMiddleware = (req, res, next) => {
  try {
    // 处理 OPTIONS 预检请求（不应该到达这里，但为了安全还是处理）
    if (req.method === 'OPTIONS') {
      console.log(`[Auth] OPTIONS request to ${req.path} - allowing preflight`)
      return res.status(200).end()
    }
    
    const authHeader = req.headers.authorization
    const requestPath = req.path
    const requestMethod = req.method
    
    console.log(`[Auth] ${requestMethod} ${requestPath}`)
    console.log(`[Auth] All headers:`, Object.keys(req.headers))
    console.log(`[Auth] Authorization header:`, authHeader ? `Present (${authHeader.substring(0, 20)}...)` : 'Missing')
    
    if (!authHeader) {
      console.error(`[Auth] ${requestMethod} ${requestPath} - No authorization header`)
      console.error(`[Auth] Request headers received:`, JSON.stringify(req.headers, null, 2))
      return res.status(401).json({ 
        error: 'No token provided', 
        message: 'Please login to continue',
        path: requestPath
      })
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error(`[Auth] ${requestMethod} ${requestPath} - Invalid authorization format`)
      console.error(`[Auth] Authorization header value:`, authHeader)
      return res.status(401).json({ 
        error: 'Invalid authorization format', 
        message: 'Authorization header must be in format: Bearer <token>',
        path: requestPath,
        receivedFormat: authHeader.substring(0, 20)
      })
    }

    const token = parts[1]
    
    if (!token) {
      console.error(`[Auth] ${requestMethod} ${requestPath} - No token in header`)
      return res.status(401).json({ 
        error: 'No token provided', 
        message: 'Please login to continue',
        path: requestPath
      })
    }

    console.log(`[Auth] ${requestMethod} ${requestPath} - Verifying token`)
    console.log(`[Auth] JWT_SECRET exists: ${!!JWT_SECRET}, length: ${JWT_SECRET?.length || 0}`)
    console.log(`[Auth] Token preview: ${token.substring(0, 20)}...`)
    console.log(`[Auth] Token length: ${token.length}`)
    
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log(`[Auth] ✅ ${requestMethod} ${requestPath} - Token verified successfully, userId: ${decoded.userId}`)
    req.userId = decoded.userId
    next()
  } catch (error) {
    console.error(`[Auth] ❌ Token verification failed for ${req.method} ${req.path}:`, error.message)
    console.error(`[Auth] Error type: ${error.name}`)
    console.error(`[Auth] Full error:`, error)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Your session has expired. Please login again.',
        errorType: 'TokenExpiredError'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'Invalid authentication token. Please login again.',
        errorType: 'JsonWebTokenError',
        details: error.message
      })
    }
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'Please login to continue',
      errorType: error.name,
      details: error.message
    })
  }
}

// 密码验证函数
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }
  
  return { valid: true }
}

export const registerUser = async (name, email, password) => {
  // 验证密码
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message)
  }

  if (useDb) {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.rows.length > 0) {
      throw new Error('User already exists')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const insertUser = await query(
      'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1,$2,$3,$4) RETURNING id, name, email, is_admin, created_at',
      [name, email, hashedPassword, false]
    )
    const user = insertUser.rows[0]
    // 新用户注册送 5 张图片
    await query(
      `INSERT INTO tokens_balance (user_id, balance) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET balance = tokens_balance.balance + EXCLUDED.balance, updated_at = NOW()`,
      [user.id, 5]
    )
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      totalProcessed: 0,
      tokensUsed: 0,
      isAdmin: user.is_admin,
    }
  }

  // fallback 内存
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    throw new Error('User already exists')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    totalProcessed: 0,
    tokensUsed: 0,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  }
  users.push(newUser)
  tokens.set(newUser.id, 5)
  return newUser
}

export const loginUser = async (email, password) => {
  if (useDb) {
    const result = await query('SELECT id, name, email, password_hash, is_admin, created_at FROM users WHERE email=$1', [email])
    if (result.rows.length === 0) {
      throw new Error('Email or password is incorrect')
    }
    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      throw new Error('Email or password is incorrect')
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password_hash,
      createdAt: user.created_at,
      totalProcessed: 0,
      tokensUsed: 0,
      isAdmin: user.is_admin,
    }
  }

  const user = users.find(u => u.email === email)
  if (!user) {
    throw new Error('Email or password is incorrect')
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    throw new Error('Email or password is incorrect')
  }

  return user
}

export const getUserById = (userId) => {
  if (useDb) {
    // 注意：此函数在 index.js 中同步使用，将其改为 async 会影响调用方；这里返回一个同步标记
    throw new Error('getUserById is synchronous; use getUserByIdAsync instead when DB is enabled')
  }
  return users.find(u => u.id === userId)
}

export const getUserByEmail = (email) => {
  if (useDb) {
    throw new Error('getUserByEmail is synchronous; use getUserByEmailAsync instead when DB is enabled')
  }
  return users.find(u => u.email === email)
}

export const getUserByIdAsync = async (userId) => {
  if (!useDb) {
    return getUserById(userId)
  }
  // 查询用户信息并计算 totalProcessed 和 tokensUsed
  const result = await query(
    `SELECT u.id, u.name, u.email, u.is_admin, u.created_at, u.last_login_at, u.last_login_ip, 
            u.last_login_country, u.last_login_country_code, u.last_login_city,
            COALESCE(tb.balance, 0) AS balance,
            COALESCE((
              SELECT COUNT(*) FROM token_usage tu WHERE tu.user_id = u.id AND tu.action = 'process'
            ),0) AS total_processed,
            COALESCE((
              SELECT COUNT(*) FROM token_usage tu 
              WHERE tu.user_id = u.id AND tu.action IN ('process', 'download')
            ),0) AS total_tokens_used
     FROM users u
     LEFT JOIN tokens_balance tb ON tb.user_id = u.id
     WHERE u.id=$1`,
    [userId]
  )
  if (!result.rows.length) return null
  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    totalProcessed: Number(row.total_processed || 0),
    tokensUsed: Number(row.total_tokens_used || 0),
    tokensRemaining: Number(row.balance || 0),
    lastLoginAt: row.last_login_at,
    lastLoginIp: row.last_login_ip,
    lastLoginCountry: row.last_login_country,
    lastLoginCountryCode: row.last_login_country_code,
    lastLoginCity: row.last_login_city,
  }
}

export const getUserByEmailAsync = async (email) => {
  if (!useDb) {
    return getUserByEmail(email)
  }
  const result = await query('SELECT id, name, email, is_admin, created_at, last_login_at, last_login_ip, last_login_country, last_login_country_code, last_login_city FROM users WHERE email=$1', [email])
  if (!result.rows.length) return null
  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    lastLoginIp: row.last_login_ip,
    lastLoginCountry: row.last_login_country,
    lastLoginCountryCode: row.last_login_country_code,
    lastLoginCity: row.last_login_city,
  }
}

export const getUserTokens = (userId) => {
  return tokens.get(userId) || 0
}

// 生成密码重置token
export const generatePasswordResetToken = (email) => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 3600000 // 1小时后过期
  
  passwordResetTokens.set(email, { token, expiresAt })
  
  return token
}

// 验证密码重置token
export const verifyPasswordResetToken = (email, token) => {
  const resetInfo = passwordResetTokens.get(email)
  
  if (!resetInfo) {
    return { valid: false, message: 'Invalid or expired reset token' }
  }
  
  if (Date.now() > resetInfo.expiresAt) {
    passwordResetTokens.delete(email)
    return { valid: false, message: 'Reset token has expired' }
  }
  
  if (resetInfo.token !== token) {
    return { valid: false, message: 'Invalid reset token' }
  }
  
  return { valid: true }
}

// 重置密码
export const resetPassword = async (email, token, newPassword) => {
  // 验证token
  const tokenValidation = verifyPasswordResetToken(email, token)
  if (!tokenValidation.valid) {
    throw new Error(tokenValidation.message)
  }
  
  // 验证新密码
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message)
  }
  
  // 找到用户
  const user = getUserByEmail(email)
  if (!user) {
    throw new Error('User not found')
  }
  
  // 更新密码
  user.password = await bcrypt.hash(newPassword, 10)
  
  // 删除重置token
  passwordResetTokens.delete(email)
  
  return user
}

export const setUserTokens = (userId, count) => {
  tokens.set(userId, count)
  return count
}

export const decrementUserTokens = (userId, action = 'download') => {
  const current = tokens.get(userId) || 0
  const newCount = Math.max(0, current - 1)
  tokens.set(userId, newCount)
  
  // 记录token使用历史
  tokenUsageHistory.push({
    userId,
    timestamp: new Date(),
    action,
    tokensBefore: current,
    tokensAfter: newCount,
  })
  
  return newCount
}

// 记录token使用历史（不扣token）
export const recordTokenUsage = (userId, action = 'generate') => {
  const current = tokens.get(userId) || 0
  
  // 记录token使用历史（但不扣token）
  tokenUsageHistory.push({
    userId,
    timestamp: new Date(),
    action,
    tokensBefore: current,
    tokensAfter: current, // 不扣token，所以前后一样
  })
  
  return current
}

// ============ Postgres 版本（异步） ============
export const getUserTokensAsync = async (userId) => {
  if (!useDb) return getUserTokens(userId)
  const result = await query('SELECT balance FROM tokens_balance WHERE user_id=$1', [userId])
  return result.rows.length ? Number(result.rows[0].balance) : 0
}

export const setUserTokensAsync = async (userId, amount) => {
  if (!useDb) return setUserTokens(userId, amount)
  await query(
    `INSERT INTO tokens_balance (user_id, balance) VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, updated_at = NOW()`,
    [userId, amount]
  )
  return amount
}

export const decrementUserTokensAsync = async (userId, action = 'download') => {
  if (!useDb) return decrementUserTokens(userId, action)
  
  // 使用原子操作：直接在数据库层面扣除，避免竞态条件
  // 使用 RETURNING 确保获取更新后的值
  const result = await query(
    `UPDATE tokens_balance 
     SET balance = GREATEST(0, balance - 1), updated_at = NOW() 
     WHERE user_id = $1 
     RETURNING balance`,
    [userId]
  )
  
  // 如果用户没有余额记录，创建一个（余额为0）
  if (result.rows.length === 0) {
    await query(
      `INSERT INTO tokens_balance (user_id, balance, updated_at) 
       VALUES ($1, 0, NOW()) 
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    )
    // 再次尝试扣除
    const retryResult = await query(
      `UPDATE tokens_balance 
       SET balance = GREATEST(0, balance - 1), updated_at = NOW() 
       WHERE user_id = $1 
       RETURNING balance`,
      [userId]
    )
    const newCount = retryResult.rows.length > 0 ? Number(retryResult.rows[0].balance) : 0
    await query('INSERT INTO token_usage (user_id, action) VALUES ($1,$2)', [userId, action])
    return newCount
  }
  
  const newCount = Number(result.rows[0].balance)
  
  // 记录token使用
  await query('INSERT INTO token_usage (user_id, action) VALUES ($1,$2)', [userId, action])
  
  console.log(`Token deduction: User ${userId}, action: ${action}, new balance: ${newCount}`)
  return newCount
}

export const addTokensToUserAsync = async (userId, amount) => {
  if (!useDb) return addTokensToUser(userId, amount)
  const current = await getUserTokensAsync(userId)
  const next = current + amount
  await setUserTokensAsync(userId, next)
  return next
}

export const recordTokenUsageAsync = async (userId, action = 'generate', imageId = null) => {
  if (!useDb) return recordTokenUsage(userId, action)
  await query('INSERT INTO token_usage (user_id, action, image_id) VALUES ($1,$2,$3)', [userId, action, imageId])
}

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

// 管理员相关函数
export const getAllUsers = () => {
  return users.map(user => {
    const { password, ...userWithoutPassword } = user
    return {
      ...userWithoutPassword,
      tokens: tokens.get(user.id) || 0,
    }
  })
}

export const getAllUsersAsync = async () => {
  if (!useDb) return getAllUsers()
  const result = await query(
    `SELECT u.id, u.name, u.email, u.is_admin, u.created_at,
            COALESCE(tb.balance,0) AS balance,
            COALESCE((
              SELECT COUNT(*) FROM token_usage tu WHERE tu.user_id = u.id AND tu.action = 'process'
            ),0) AS total_processed,
            u.last_login_at, u.last_login_ip, u.last_login_country, u.last_login_country_code, u.last_login_city
     FROM users u
     LEFT JOIN tokens_balance tb ON tb.user_id = u.id
     ORDER BY u.created_at DESC`
  )
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    isAdmin: r.is_admin,
    createdAt: r.created_at,
    totalProcessed: Number(r.total_processed || 0),
    tokensUsed: Number(r.total_processed || 0),
    tokens: Number(r.balance || 0),
    lastLoginAt: r.last_login_at,
    lastLoginIp: r.last_login_ip,
    lastLoginCountry: r.last_login_country,
    lastLoginCountryCode: r.last_login_country_code,
    lastLoginCity: r.last_login_city,
  }))
}

export const getActiveSessionsCount = () => {
  return activeSessions.size
}

export const addActiveSession = (sessionId) => {
  activeSessions.add(sessionId)
}

export const removeActiveSession = (sessionId) => {
  activeSessions.delete(sessionId)
}

export const getTokenUsageStats = (startDate, endDate) => {
  const filtered = tokenUsageHistory.filter(record => {
    const recordDate = new Date(record.timestamp)
    return recordDate >= startDate && recordDate <= endDate
  })
  
  // totalUsage: 所有生成（包括下载）的次数
  const totalUsage = filtered.length
  
  // totalDownload: 只有下载的次数
  const totalDownload = filtered.filter(r => r.action === 'download').length
  
  return {
    totalUsage,
    totalDownload,
    uniqueUsers: new Set(filtered.map(r => r.userId)).size,
    records: filtered,
  }
}

export const getTokenUsageStatsAsync = async (startDate, endDate) => {
  if (!useDb) return getTokenUsageStats(startDate, endDate)
  const result = await query(
    `SELECT action, COUNT(*) as count
     FROM token_usage
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY action`,
    [startDate, endDate]
  )
  const totalUsage = result.rows.reduce((sum, r) => sum + Number(r.count), 0)
  const totalDownload = result.rows
    .filter(r => r.action === 'download')
    .reduce((sum, r) => sum + Number(r.count), 0)
  const uniqueUsersRes = await query(
    `SELECT COUNT(DISTINCT user_id) as c FROM token_usage WHERE created_at BETWEEN $1 AND $2`,
    [startDate, endDate]
  )
  return {
    totalUsage,
    totalDownload,
    uniqueUsers: Number(uniqueUsersRes.rows[0]?.c || 0),
    records: [], // 简化
  }
}

export const getRevenueStats = (startDate, endDate) => {
  const filtered = revenueHistory.filter(record => {
    const recordDate = new Date(record.timestamp)
    return recordDate >= startDate && recordDate <= endDate
  })
  
  const totalRevenue = filtered.reduce((sum, record) => sum + record.amount, 0)
  
  return {
    totalRevenue,
    transactionCount: filtered.length,
    records: filtered,
  }
}

export const getRevenueStatsAsync = async (startDate, endDate) => {
  if (!useDb) return getRevenueStats(startDate, endDate)
  const result = await query(
    `SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt FROM revenue WHERE created_at BETWEEN $1 AND $2`,
    [startDate, endDate]
  )
  return {
    totalRevenue: Number(result.rows[0]?.total || 0),
    transactionCount: Number(result.rows[0]?.cnt || 0),
    records: [],
  }
}

export const getSubscriptionStats = () => {
  const active = subscriptions.filter(s => s.status === 'active').length
  const total = subscriptions.length
  
  return {
    active,
    total,
    subscriptions,
  }
}

export const getSubscriptionStatsAsync = async () => {
  if (!useDb) return getSubscriptionStats()
  const result = await query(
    `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active
     FROM subscriptions`
  )
  return {
    active: Number(result.rows[0]?.active || 0),
    total: Number(result.rows[0]?.total || 0),
  }
}

// 管理员功能
export const deleteUser = (userId) => {
  const index = users.findIndex(u => u.id === userId)
  if (index === -1) {
    throw new Error('User not found')
  }
  
  // 不能删除自己
  // 这个检查在API层面进行
  
  users.splice(index, 1)
  tokens.delete(userId)
  return true
}

export const toggleUserAdmin = (userId) => {
  const user = users.find(u => u.id === userId)
  if (!user) {
    throw new Error('User not found')
  }
  
  user.isAdmin = !user.isAdmin
  return user
}

export const addTokensToUser = (userId, amount) => {
  const current = tokens.get(userId) || 0
  const newCount = current + amount
  tokens.set(userId, newCount)
  return newCount
}

export const deleteUserAsync = async (userId) => {
  if (!useDb) return deleteUser(userId)
  await query('DELETE FROM users WHERE id=$1', [userId])
  return true
}

export const toggleUserAdminAsync = async (userId) => {
  if (!useDb) return toggleUserAdmin(userId)
  const result = await query('UPDATE users SET is_admin = NOT is_admin WHERE id=$1 RETURNING id, name, email, is_admin, created_at', [userId])
  if (result.rows.length === 0) throw new Error('User not found')
  return result.rows[0]
}

// 获取图表数据（按日期分组）
export const getChartData = (startDate, endDate) => {
  const dataMap = new Map()
  
  // 初始化所有日期
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0] // YYYY-MM-DD
    dataMap.set(dateKey, {
      date: dateKey,
      totalUsers: 0,
      totalRevenue: 0,
      totalSubscriptions: 0,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // 统计用户注册数据（累计）
  users.forEach(user => {
    const userDate = new Date(user.createdAt).toISOString().split('T')[0]
    if (userDate >= startDate.toISOString().split('T')[0] && userDate <= endDate.toISOString().split('T')[0]) {
      // 从该日期开始，所有后续日期都+1
      const userDateObj = new Date(userDate)
      let checkDate = new Date(userDateObj)
      while (checkDate <= endDate) {
        const dateKey = checkDate.toISOString().split('T')[0]
        if (dataMap.has(dateKey)) {
          dataMap.get(dateKey).totalUsers += 1
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }
    } else if (userDate < startDate.toISOString().split('T')[0]) {
      // 在开始日期之前注册的用户，所有日期都+1
      const checkDate = new Date(startDate)
      while (checkDate <= endDate) {
        const dateKey = checkDate.toISOString().split('T')[0]
        if (dataMap.has(dateKey)) {
          dataMap.get(dateKey).totalUsers += 1
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }
    }
  })
  
  // 统计收入数据（每日累计）
  revenueHistory.forEach(record => {
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0]
    if (recordDate >= startDate.toISOString().split('T')[0] && recordDate <= endDate.toISOString().split('T')[0]) {
      if (dataMap.has(recordDate)) {
        // 从该日期开始，所有后续日期都加上这个收入
        const recordDateObj = new Date(recordDate)
        let checkDate = new Date(recordDateObj)
        while (checkDate <= endDate) {
          const dateKey = checkDate.toISOString().split('T')[0]
          if (dataMap.has(dateKey)) {
            dataMap.get(dateKey).totalRevenue += record.amount
          }
          checkDate.setDate(checkDate.getDate() + 1)
        }
      }
    }
  })
  
  // 统计订阅数据（每日累计）
  subscriptions.forEach(sub => {
    const subDate = new Date(sub.startDate).toISOString().split('T')[0]
    if (subDate >= startDate.toISOString().split('T')[0] && subDate <= endDate.toISOString().split('T')[0]) {
      if (dataMap.has(subDate)) {
        // 从该日期开始，所有后续日期都+1（如果是active）
        if (sub.status === 'active') {
          const subDateObj = new Date(subDate)
          let checkDate = new Date(subDateObj)
          while (checkDate <= endDate) {
            const dateKey = checkDate.toISOString().split('T')[0]
            if (dataMap.has(dateKey)) {
              dataMap.get(dateKey).totalSubscriptions += 1
            }
            checkDate.setDate(checkDate.getDate() + 1)
          }
        }
      }
    } else if (subDate < startDate.toISOString().split('T')[0] && sub.status === 'active') {
      // 在开始日期之前开始的订阅，所有日期都+1
      const checkDate = new Date(startDate)
      while (checkDate <= endDate) {
        const dateKey = checkDate.toISOString().split('T')[0]
        if (dataMap.has(dateKey)) {
          dataMap.get(dateKey).totalSubscriptions += 1
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }
    }
  })
  
  // 转换为数组并排序
  const chartData = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  
  return chartData
}

export const getChartDataAsync = async (startDate, endDate) => {
  if (!useDb) return getChartData(startDate, endDate)
  // 使用 generate_series 生成日期
  const result = await query(
    `WITH dates AS (
       SELECT generate_series($1::date, $2::date, '1 day') AS day
     ),
     users_c AS (
       SELECT day, COUNT(u.id) AS total_users
       FROM dates d
       LEFT JOIN users u ON u.created_at::date <= d.day
       GROUP BY day
     ),
     revenue_c AS (
       SELECT day, COALESCE(SUM(r.amount),0) AS total_revenue
       FROM dates d
       LEFT JOIN revenue r ON r.created_at::date <= d.day
       GROUP BY day
     ),
     subs_c AS (
       SELECT day, COUNT(s.id) FILTER (WHERE s.status='active') AS total_subs
       FROM dates d
       LEFT JOIN subscriptions s ON (s.created_at::date <= d.day)
       GROUP BY day
     )
     SELECT d.day AS date,
            u.total_users,
            r.total_revenue,
            s.total_subs
     FROM dates d
     LEFT JOIN users_c u ON u.day = d.day
     LEFT JOIN revenue_c r ON r.day = d.day
     LEFT JOIN subs_c s ON s.day = d.day
     ORDER BY d.day`,
    [startDate, endDate]
  )
  return result.rows.map(r => ({
    date: r.date.toISOString().split('T')[0],
    totalUsers: Number(r.total_users || 0),
    totalRevenue: Number(r.total_revenue || 0),
    totalSubscriptions: Number(r.total_subs || 0),
  }))
}

// 导出users数组供其他模块使用
export { users, tokens, tokenUsageHistory, revenueHistory, subscriptions }


