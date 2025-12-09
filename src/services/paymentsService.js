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
      
      console.log('Sending checkout request:', {
        planType,
        successUrl,
        cancelUrl,
        apiUrl: API_URL
      })
      
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
      console.error('Create checkout session error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
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


