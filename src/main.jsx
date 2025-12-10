import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 过滤 hCaptcha 的 401 错误（来自 Stripe 或其他第三方服务，不影响功能）
const originalError = console.error
console.error = (...args) => {
  const errorMessage = args.join(' ')
  // 忽略 hCaptcha 的 401 错误
  if (errorMessage.includes('hcaptcha.com') && errorMessage.includes('401')) {
    return // 静默忽略
  }
  originalError.apply(console, args)
}

// 过滤网络请求中的 hCaptcha 401 错误
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      // 如果是 hCaptcha 的 401 错误，不记录到控制台
      if (response.url && response.url.includes('hcaptcha.com') && response.status === 401) {
        // 静默处理，不影响功能
        return response
      }
      return response
    } catch (error) {
      // 如果是 hCaptcha 相关的错误，静默处理
      if (error.message && error.message.includes('hcaptcha')) {
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

