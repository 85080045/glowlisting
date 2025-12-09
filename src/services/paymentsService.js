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
      if (!token) {
        throw new Error('Please login to continue')
      }
      const successUrl = `${window.location.origin}/payment-success`
      const cancelUrl = `${window.location.origin}/payment-cancel`
      const res = await api.post(
        '/payments/create-checkout-session',
        {
          planType,
          successUrl,
          cancelUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.data || !res.data.url) {
        throw new Error(res.data?.error || 'Failed to create checkout session')
      }
      return res.data
    } catch (error) {
      console.error('Create checkout session error:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to create checkout session'
      throw new Error(errorMessage)
    }
  },
}


