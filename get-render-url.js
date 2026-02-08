// ============================================
// Get Render backend URL
// ============================================
// Usage:
// 1. Open your site in the browser (logged in)
// 2. Open DevTools (F12)
// 3. Copy and run the code below
// ============================================

(function getRenderURL() {
  console.log('🔍 Looking for Render backend URL...')
  console.log('')
  
  // Method 1: localStorage or sessionStorage
  console.log('Method 1: Check storage...')
  const storedURL = localStorage.getItem('api_url') || sessionStorage.getItem('api_url')
  if (storedURL) {
    console.log('✅ Found stored URL:', storedURL)
    return storedURL
  }
  
  // Method 2: Environment variable
  console.log('Method 2: Check env...')
  if (import.meta.env?.VITE_API_URL) {
    console.log('✅ Found env URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }
  
  // Method 3: From network requests
  console.log('Method 3: Analyze network requests...')
  console.log('💡 Trigger a request (send a chat message, upload an image, or refresh), then run:')
  console.log('')
  console.log(`
// Inspect recent API requests
const requests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/'))
  .map(r => {
    const url = new URL(r.name)
    return url.origin + url.pathname.split('/').slice(0, -1).join('/')
  })

if (requests.length > 0) {
  const apiUrl = requests[0]
  console.log('✅ API URL:', apiUrl)
} else {
  console.log('❌ No API requests found. Send a message or upload an image first.')
}
  `)
  
  // Method 4: Infer from current page
  console.log('Method 4: From current page...')
  const currentOrigin = window.location.origin
  console.log('Current origin:', currentOrigin)
  
  if (currentOrigin.includes('vercel.app')) {
    console.log('💡 Frontend is on Vercel; backend may be on Render. Check Vercel env VITE_API_URL')
  }
  
  console.log('')
  console.log('='.repeat(60))
  console.log('📝 Manual lookup:')
  console.log('1. Log in at https://dashboard.render.com')
  console.log('2. Open your backend Web Service')
  console.log('3. See the URL at the top (e.g. https://xxx.onrender.com)')
  console.log('4. API base: https://xxx.onrender.com/api')
  console.log('Or: Vercel → Project → Settings → Environment variables → VITE_API_URL')
  console.log('='.repeat(60))
})()
