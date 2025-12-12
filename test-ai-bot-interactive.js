#!/usr/bin/env node

/**
 * AI Bot 交互式测试脚本
 * 自动尝试从环境变量或提示用户输入
 */

import axios from 'axios'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function testAIBot() {
  console.log('🧪 AI Bot 测试工具')
  console.log('='.repeat(50))
  console.log('')

  // 获取 API URL
  let API_URL = process.env.API_URL || process.env.VITE_API_URL
  
  if (!API_URL) {
    console.log('📡 未找到 API_URL 环境变量')
    API_URL = await question('请输入 Render 后端 URL (例如: https://your-app.onrender.com/api): ')
    if (!API_URL.startsWith('http')) {
      API_URL = `https://${API_URL}`
    }
    if (!API_URL.endsWith('/api')) {
      API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`
    }
  } else {
    if (!API_URL.endsWith('/api')) {
      API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`
    }
    console.log(`📡 使用 API URL: ${API_URL}`)
  }

  // 获取 Token
  let ADMIN_TOKEN = process.env.ADMIN_TOKEN
  
  if (!ADMIN_TOKEN) {
    console.log('')
    console.log('🔑 未找到 ADMIN_TOKEN 环境变量')
    console.log('   获取方法:')
    console.log('   1. 在浏览器中登录管理员账号')
    console.log('   2. 打开控制台 (F12)')
    console.log('   3. 运行: localStorage.getItem("glowlisting_token")')
    console.log('   4. 复制返回的token')
    console.log('')
    ADMIN_TOKEN = await question('请输入管理员 Token: ')
  } else {
    console.log(`🔑 使用 Token: ${ADMIN_TOKEN.substring(0, 20)}...`)
  }

  if (!ADMIN_TOKEN) {
    console.error('❌ Token 不能为空')
    rl.close()
    process.exit(1)
  }

  console.log('')
  console.log('⏳ 正在测试 AI Bot...')
  console.log('')

  try {
    // 测试消息
    const testMessage = '你好，我想了解如何使用这个服务'
    
    // 调用测试端点
    const response = await axios.post(
      `${API_URL}/admin/test-ai-bot`,
      {
        message: testMessage
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒超时
      }
    )

    console.log('✅ 测试成功!')
    console.log('')
    console.log('📋 响应数据:')
    console.log(JSON.stringify(response.data, null, 2))
    console.log('')
    
    if (response.data.reply) {
      console.log('🤖 AI Bot 回复:')
      console.log('─'.repeat(60))
      console.log(response.data.reply)
      console.log('─'.repeat(60))
      console.log('')
      console.log('✅ AI Bot 工作正常!')
    } else {
      console.warn('⚠️ AI Bot 未返回回复')
    }

  } catch (error) {
    console.error('')
    console.error('❌ 测试失败!')
    console.error('')
    
    if (error.response) {
      console.error(`状态码: ${error.response.status}`)
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2))
      
      if (error.response.status === 401) {
        console.error('')
        console.error('💡 提示: Token 可能无效或已过期，请重新登录获取新token')
      } else if (error.response.status === 403) {
        console.error('')
        console.error('💡 提示: 当前账号可能不是管理员，请使用管理员账号')
      } else if (error.response.status === 404) {
        console.error('')
        console.error('💡 提示: API URL 可能不正确，请检查后端URL')
      }
    } else if (error.request) {
      console.error('错误: 请求已发送但未收到响应')
      console.error('')
      console.error('可能的原因:')
      console.error('  1. API URL 不正确')
      console.error('  2. 服务器未运行')
      console.error('  3. 网络连接问题')
      console.error('  4. 防火墙阻止了连接')
    } else {
      console.error('错误信息:', error.message)
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('')
      console.error('💡 提示: 无法连接到服务器，请检查:')
      console.error('  - 服务器是否正在运行')
      console.error('  - API URL 是否正确')
    }
    
    process.exit(1)
  } finally {
    rl.close()
  }
}

testAIBot().catch(err => {
  console.error('未预期的错误:', err)
  rl.close()
  process.exit(1)
})

