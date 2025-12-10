import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 创建统一的 axios 实例，使用拦截器自动添加 token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 token（与 authService 保持一致）
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

// 响应拦截器：处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token may be invalid or expired')
      // 不自动清除 token 和重定向，让调用方处理
    }
    return Promise.reject(error)
  }
)

export const paymentsService = {
  async getConfig() {
    const res = await api.get('/payments/config')
    return res.data
  },

  async createCheckoutSession(planType = 'pro') {
    try {
      const token = localStorage.getItem('glowlisting_token')
      console.log('=== Payment Checkout Debug ===')
      console.log('Token from localStorage:', token ? 'Present' : 'Missing')
      if (token) {
        console.log('Token preview:', token.substring(0, 30) + '...')
        console.log('Token length:', token.length)
      }
      
      if (!token) {
        console.error('No token found in localStorage')
        throw new Error('Please login to continue')
      }
      
      const successUrl = `${window.location.origin}/payment-success`
      const cancelUrl = `${window.location.origin}/payment-cancel`
      
      console.log('Request details:', {
        planType,
        successUrl,
        cancelUrl,
        apiUrl: API_URL,
        endpoint: `${API_URL}/payments/create-checkout-session`,
        hasToken: !!token,
        tokenPrefix: token.substring(0, 20)
      })
      
      // 使用 api 实例，它会自动通过拦截器添加 Authorization header
      const res = await api.post(
        '/payments/create-checkout-session',
        {
          planType,
          successUrl,
          cancelUrl,
        }
      )
      
      console.log('Checkout response:', res.data)
      
      if (!res.data) {
        throw new Error('No response data from server')
      }
      
      if (!res.data.url) {
        const errorMsg = res.data.error || res.data.message || 'Failed to create checkout session'
        throw new Error(errorMsg)
      }
      
      return res.data
    } catch (error) {
      console.error('=== Payment Checkout Error ===')
      console.error('Error type:', error.name)
      console.error('Error message:', error.message)
      console.error('Error status:', error.response?.status)
      console.error('Error status text:', error.response?.statusText)
      console.error('Error response data:', error.response?.data)
      console.error('Request URL:', error.config?.url)
      console.error('Request headers sent:', {
        ...error.config?.headers,
        Authorization: error.config?.headers?.Authorization ? 'Bearer ***' : 'MISSING!'
      })
      console.error('Full request config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: {
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? 'Bearer ***' : 'MISSING!'
        }
      }, null, 2))
      
      // 如果是 401，提供更详细的错误信息
      if (error.response?.status === 401) {
        console.error('=== 401 Unauthorized Analysis ===')
        console.error('1. Token in localStorage:', localStorage.getItem('glowlisting_token') ? 'Present' : 'Missing')
        console.error('2. Authorization header in request:', error.config?.headers?.Authorization ? 'Present' : 'MISSING!')
        console.error('3. Error response:', error.response?.data)
        console.error('4. Request was sent to:', error.config?.url)
        
        if (!error.config?.headers?.Authorization) {
          console.error('❌ CRITICAL: Authorization header is MISSING in the request!')
          console.error('This means the header was not sent to the server.')
        }
      }
      
      // Preserve the original error structure
      if (error.response?.data) {
        const errorObj = new Error(error.response.data.message || error.response.data.error || error.message)
        errorObj.response = error.response
        throw errorObj
      }
      
      throw error
    }
  },
}


