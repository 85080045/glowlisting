import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// 简单的内存数据库（生产环境应使用真实数据库）
const users = []
const tokens = new Map() // userId -> token count
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
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
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
  // 检查用户是否已存在
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    throw new Error('User already exists')
  }

  // 验证密码
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message)
  }

  // 创建新用户
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
  tokens.set(newUser.id, 5) // 新用户注册送5个token

  return newUser
}

export const loginUser = async (email, password) => {
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
  return users.find(u => u.id === userId)
}

export const getUserByEmail = (email) => {
  return users.find(u => u.email === email)
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

export const getSubscriptionStats = () => {
  const active = subscriptions.filter(s => s.status === 'active').length
  const total = subscriptions.length
  
  return {
    active,
    total,
    subscriptions,
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

// 导出users数组供其他模块使用
export { users, tokens, tokenUsageHistory, revenueHistory, subscriptions }


