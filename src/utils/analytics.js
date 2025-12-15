// 访问追踪工具

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 生成或获取 session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// 从 URL 获取 UTM 参数
function getUTMParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  }
}

// 记录页面访问
export async function trackPageView(pagePath, userId = null) {
  try {
    const sessionId = getSessionId()
    const referrer = document.referrer || ''
    const { utmSource, utmMedium, utmCampaign } = getUTMParams()
    const userAgent = navigator.userAgent
    
    await fetch(`${API_URL}/analytics/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userId,
        pagePath,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        userAgent,
      }),
    })
  } catch (error) {
    console.warn('Failed to track page view:', error)
  }
}

// 记录结账放弃
export async function trackCheckoutAbandonment(planType, priceId, amount, currency, userId = null) {
  try {
    const sessionId = getSessionId()
    const referrer = document.referrer || ''
    const { utmSource, utmMedium, utmCampaign } = getUTMParams()
    const pagePath = window.location.pathname
    
    await fetch(`${API_URL}/analytics/checkout-abandonment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userId,
        planType,
        priceId,
        amount,
        currency,
        pagePath,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
      }),
    })
  } catch (error) {
    console.warn('Failed to track checkout abandonment:', error)
  }
}

