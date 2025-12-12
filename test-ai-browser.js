// ============================================
// AI Bot 浏览器测试代码
// ============================================
// 使用方法：
// 1. 在浏览器中登录管理员账号
// 2. 打开控制台 (F12)
// 3. 复制下面的代码并粘贴到控制台运行
// ============================================

(async function testAIBot() {
  console.log('🧪 开始测试 AI Bot...')
  console.log('')
  
  // 自动获取 token 和 API URL
  const token = localStorage.getItem('glowlisting_token')
  const apiUrl = (import.meta.env?.VITE_API_URL || window.location.origin.replace(':3000', ':3001').replace('vercel.app', 'onrender.com')) + '/api'
  
  if (!token) {
    console.error('❌ 未找到 token，请先登录')
    return
  }
  
  console.log('🔑 Token:', token.substring(0, 20) + '...')
  console.log('📡 API URL:', apiUrl)
  console.log('')
  
  try {
    const testMessage = '你好，我想了解如何使用这个服务'
    console.log('📝 测试消息:', testMessage)
    console.log('⏳ 正在调用 AI Bot...')
    console.log('')
    
    const response = await fetch(`${apiUrl}/admin/test-ai-bot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage
      })
    })
    
    const data = await response.json()
    
    console.log('📊 HTTP 状态码:', response.status)
    console.log('')
    
    if (response.ok && data.success) {
      console.log('✅ 测试成功!')
      console.log('')
      console.log('📋 响应数据:')
      console.log(JSON.stringify(data, null, 2))
      console.log('')
      
      if (data.reply) {
        console.log('🤖 AI Bot 回复:')
        console.log('─'.repeat(60))
        console.log(data.reply)
        console.log('─'.repeat(60))
        console.log('')
        console.log('✅ AI Bot 工作正常!')
        
        // 显示弹窗
        alert('✅ 测试成功！\n\nAI回复:\n' + data.reply.substring(0, 200) + (data.reply.length > 200 ? '...' : ''))
      } else {
        console.warn('⚠️ AI Bot 未返回回复')
        alert('⚠️ AI Bot 未返回回复，请查看控制台和服务器日志')
      }
    } else {
      console.error('❌ 测试失败!')
      console.error('错误信息:', data)
      
      if (response.status === 401) {
        console.error('💡 Token 可能无效或已过期，请重新登录')
      } else if (response.status === 403) {
        console.error('💡 当前账号可能不是管理员')
      } else if (response.status === 404) {
        console.error('💡 API URL 可能不正确')
        console.error('💡 请手动设置正确的 API URL')
      }
      
      alert('❌ 测试失败: ' + (data.error || '未知错误'))
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
    console.error('')
    console.error('可能的原因:')
    console.error('  1. API URL 不正确')
    console.error('  2. 网络连接问题')
    console.error('  3. 服务器未运行')
    console.error('')
    console.error('💡 提示: 如果 API URL 不正确，请手动设置:')
    console.error('  const apiUrl = "https://your-render-backend-url/api"')
    
    alert('❌ 请求失败: ' + error.message)
  }
})()

