// AI Bot 诊断脚本
// 检查 AI Bot 配置和状态

import https from 'https'

const API_URL = 'https://glowlisting.onrender.com/api'

console.log('🔍 AI Bot 诊断工具')
console.log('='.repeat(60))
console.log('')

// 1. 检查服务器是否在线
console.log('1️⃣ 检查服务器连接...')
const checkServer = () => {
  return new Promise((resolve, reject) => {
    https.get(API_URL.replace('/api', ''), (res) => {
      console.log(`   ✅ 服务器在线 (状态码: ${res.statusCode})`)
      resolve(true)
    }).on('error', (err) => {
      console.log(`   ❌ 服务器连接失败: ${err.message}`)
      reject(err)
    })
  })
}

// 2. 检查测试端点是否存在（会返回401，但说明端点存在）
const checkTestEndpoint = () => {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}/admin/test-ai-bot`)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log(`   ✅ 测试端点存在 (需要认证，状态码: ${res.statusCode})`)
        } else if (res.statusCode === 404) {
          console.log(`   ❌ 测试端点不存在 (状态码: ${res.statusCode})`)
        } else {
          console.log(`   ⚠️  测试端点响应异常 (状态码: ${res.statusCode})`)
        }
        resolve()
      })
    })
    
    req.on('error', (err) => {
      console.log(`   ❌ 请求失败: ${err.message}`)
      resolve()
    })
    
    req.write(JSON.stringify({ message: 'test' }))
    req.end()
  })
}

// 3. 检查消息端点
const checkMessagesEndpoint = () => {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}/support/messages`)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log(`   ✅ 消息端点存在 (需要认证，状态码: ${res.statusCode})`)
        } else if (res.statusCode === 404) {
          console.log(`   ❌ 消息端点不存在 (状态码: ${res.statusCode})`)
        } else {
          console.log(`   ⚠️  消息端点响应异常 (状态码: ${res.statusCode})`)
        }
        resolve()
      })
    })
    
    req.on('error', (err) => {
      console.log(`   ❌ 请求失败: ${err.message}`)
      resolve()
    })
    
    req.end()
  })
}

// 运行诊断
(async () => {
  try {
    await checkServer()
    console.log('')
    
    console.log('2️⃣ 检查 API 端点...')
    await checkTestEndpoint()
    await checkMessagesEndpoint()
    console.log('')
    
    console.log('3️⃣ 配置检查建议:')
    console.log('   请检查 Render 环境变量:')
    console.log('   - GOOGLE_AI_API_KEY（必须是这个名称）')
    console.log('   - 确保 API key 已正确设置')
    console.log('')
    
    console.log('4️⃣ 下一步:')
    console.log('   1. 登录管理员账号')
    console.log('   2. 在浏览器控制台运行测试代码')
    console.log('   3. 或查看 Render 日志，检查 AI Bot 配置状态')
    console.log('')
    console.log('📋 查看 Render 日志的方法:')
    console.log('   1. 登录 https://dashboard.render.com')
    console.log('   2. 进入后端服务')
    console.log('   3. 查看 "Logs" 标签')
    console.log('   4. 查找 "AI Bot configured" 或 "AI Bot NOT configured"')
    console.log('')
    
  } catch (error) {
    console.error('诊断失败:', error.message)
  }
})()

