import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('glowlisting_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理token过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('glowlisting_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  // 注册
  async register(name, email, password, verificationCode, recaptchaToken) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      verificationCode,
      recaptchaToken,
    })
    return response.data
  },

  // 发送验证码
  async sendVerificationCode(email, language = 'en') {
    const response = await api.post('/auth/send-verification', {
      email,
      language,
    })
    return response.data
  },

  // 登录
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  // 获取用户信息
  async getUserInfo() {
    const response = await api.get('/auth/me')
    return response.data
  },

  // 更新用户信息
  async updateUserInfo(data) {
    const response = await api.put('/auth/me', data)
    return response.data
  },

  // 购买tokens（已弃用，保留兼容）
  async purchaseTokens(amount) {
    return { success: false, message: 'Deprecated' }
  },
}


