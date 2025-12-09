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
    const token = localStorage.getItem('glowlisting_token')
    const successUrl = `${window.location.origin}/payment-success`
    const cancelUrl = `${window.location.origin}/payment-cancel`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await api.post(
      '/payments/create-checkout-session',
      {
        planType,
        successUrl,
        cancelUrl,
      },
      { headers }
    )
    return res.data
  },
}


