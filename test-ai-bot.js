#!/usr/bin/env node

/**
 * AI Bot 测试脚本
 * 使用方法：
 * 1. 在 Render 后台获取管理员 token（登录后从浏览器 localStorage 获取 glowlisting_token）
 * 2. 设置环境变量：
 *    export API_URL=https://your-render-backend-url
 *    export ADMIN_TOKEN=your_admin_token
 * 3. 运行：node test-ai-bot.js
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001/api'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error('❌ 错误: 请设置 ADMIN_TOKEN 环境变量')
  console.error('   从浏览器 localStorage 获取 glowlisting_token')
  console.error('   然后运行: ADMIN_TOKEN=your_token node test-ai-bot.js')
  process.exit(1)
}

async function testAIBot() {
  console.log('🧪 开始测试 AI Bot...')
  console.log(`📡 API URL: ${API_URL}`)
  console.log(`🔑 Token: ${ADMIN_TOKEN.substring(0, 20)}...`)
  console.log('')

  try {
    // 测试消息
    const testMessage = '你好，我想了解如何使用这个服务'
    console.log(`📝 测试消息: "${testMessage}"`)
    console.log('')

    // 调用测试端点
    console.log('⏳ 正在调用 AI Bot...')
    const response = await axios.post(
      `${API_URL}/admin/test-ai-bot`,
      {
        message: testMessage
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('')
    console.log('✅ 测试成功!')
    console.log('📋 响应数据:')
    console.log(JSON.stringify(response.data, null, 2))
    console.log('')
    
    if (response.data.reply) {
      console.log('🤖 AI Bot 回复:')
      console.log('─'.repeat(50))
      console.log(response.data.reply)
      console.log('─'.repeat(50))
    }

  } catch (error) {
    console.error('')
    console.error('❌ 测试失败!')
    console.error('错误信息:', error.message)
    
    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2))
    }
    
    if (error.request) {
      console.error('请求已发送但未收到响应')
      console.error('请检查:')
      console.error('  1. API_URL 是否正确')
      console.error('  2. 服务器是否运行')
      console.error('  3. 网络连接是否正常')
    }
    
    process.exit(1)
  }
}

testAIBot()

