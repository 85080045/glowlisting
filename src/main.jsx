import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Suppress hCaptcha 401 errors (third-party; do not affect app)
const originalError = console.error
console.error = (...args) => {
  const errorMessage = args.join(' ')
  if (errorMessage.includes('hcaptcha.com') && errorMessage.includes('401')) {
    return
  }
  originalError.apply(console, args)
}

if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      if (response && response.url && response.url.includes('hcaptcha.com') && response.status === 401) {
        return response
      }
      return response
    } catch (error) {
      if (error && error.message && error.message.includes('hcaptcha')) {
        return Promise.reject(error)
      }
      throw error
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

