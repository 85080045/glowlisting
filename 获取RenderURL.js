// ============================================
// 自动获取 Render 后端 URL
// ============================================
// 使用方法：
// 1. 在浏览器中打开你的网站（已登录）
// 2. 打开控制台 (F12)
// 3. 复制下面的代码并运行
// ============================================

(function getRenderURL() {
  console.log('🔍 正在查找 Render 后端 URL...')
  console.log('')
  
  // 方法1: 从 localStorage 或 sessionStorage 查找
  console.log('方法1: 检查存储...')
  const storedURL = localStorage.getItem('api_url') || sessionStorage.getItem('api_url')
  if (storedURL) {
    console.log('✅ 找到存储的 URL:', storedURL)
    return storedURL
  }
  
  // 方法2: 从环境变量查找
  console.log('方法2: 检查环境变量...')
  if (import.meta.env?.VITE_API_URL) {
    console.log('✅ 找到环境变量 URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }
  
  // 方法3: 从网络请求中提取
  console.log('方法3: 分析网络请求...')
  console.log('💡 请执行以下操作以触发网络请求:')
  console.log('   - 发送一条聊天消息')
  console.log('   - 或者上传一张图片')
  console.log('   - 或者刷新页面')
  console.log('')
  console.log('然后运行以下代码查看请求 URL:')
  console.log('')
  console.log(`
// 查看最近的网络请求
const requests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/'))
  .map(r => {
    const url = new URL(r.name)
    return url.origin + url.pathname.split('/').slice(0, -1).join('/')
  })

if (requests.length > 0) {
  const apiUrl = requests[0]
  console.log('✅ 找到 API URL:', apiUrl)
  console.log('')
  console.log('📋 完整的 API URL:', apiUrl)
  console.log('')
  console.log('💡 使用这个 URL 进行测试:')
  console.log('   const apiUrl = "' + apiUrl + '"')
} else {
  console.log('❌ 未找到 API 请求')
  console.log('请先执行一些操作（发送消息、上传图片等）')
}
  `)
  
  // 方法4: 从当前页面 URL 推断
  console.log('方法4: 从当前页面推断...')
  const currentOrigin = window.location.origin
  console.log('当前页面:', currentOrigin)
  
  // 如果是 Vercel 部署，后端可能在 Render
  if (currentOrigin.includes('vercel.app')) {
    console.log('💡 前端部署在 Vercel，后端可能在 Render')
    console.log('请检查 Vercel 环境变量 VITE_API_URL')
  }
  
  console.log('')
  console.log('='.repeat(60))
  console.log('📝 手动查找方法:')
  console.log('')
  console.log('1. 登录 Render: https://dashboard.render.com')
  console.log('2. 找到你的后端服务（Web Service）')
  console.log('3. 点击进入服务详情')
  console.log('4. 在页面顶部查看 URL')
  console.log('5. URL 格式通常是: https://xxx.onrender.com')
  console.log('6. 完整的 API URL: https://xxx.onrender.com/api')
  console.log('')
  console.log('或者:')
  console.log('1. 登录 Vercel: https://vercel.com')
  console.log('2. 进入项目设置')
  console.log('3. 查看环境变量 VITE_API_URL')
  console.log('='.repeat(60))
})()

