import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      console.log('Request headers:', { ...requestHeaders, Authorization: 'Bearer ***' })
      
      const res = await api.post(
        '/payments/create-checkout-session',
        {
          planType,
          successUrl,
          cancelUrl,
        },
        {
          headers: requestHeaders,
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
      console.error('Request headers sent:', error.config?.headers)
      
      // 如果是 401，提供更详细的错误信息
      if (error.response?.status === 401) {
        console.error('401 Unauthorized - Possible causes:')
        console.error('1. Token expired or invalid')
        console.error('2. JWT_SECRET mismatch between frontend and backend')
        console.error('3. User needs to re-login after JWT_SECRET change')
        console.error('Current token:', localStorage.getItem('glowlisting_token')?.substring(0, 30) + '...')
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


