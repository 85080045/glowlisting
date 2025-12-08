// 测试 nanobanna API 连接
import axios from 'axios'

const NANOBANNA_API_KEY = 'AIzaSyCRSRCLsmrqXlTaAoRRlF6a6FQxzJ3oYxo'
// 使用正确的模型: gemini-2.5-flash-image (Nano Banana)
const NANOBANNA_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'

// 测试 1: 文本到图片生成
async function testTextToImage() {
  console.log('测试 1: 文本到图片生成...')
  try {
    const response = await axios.post(
      `${NANOBANNA_API_URL}?key=${NANOBANNA_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Create a picture of a modern house with a clean, bright interior'
          }]
        }],
        generationConfig: {
          temperature: 0.7
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )
    console.log('✅ 文本到图片请求成功')
    console.log('状态码:', response.status)
    
    // 检查响应中是否有图片
    if (response.data?.candidates?.[0]?.content?.parts) {
      let hasImage = false
      for (const part of response.data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          hasImage = true
          console.log('✅ 找到生成的图片数据，大小:', part.inlineData.data.length, 'bytes')
        }
        if (part.text) {
          console.log('文本响应:', part.text.substring(0, 200))
        }
      }
      if (!hasImage) {
        console.log('⚠️  响应中没有找到图片数据')
        console.log('完整响应:', JSON.stringify(response.data, null, 2).substring(0, 1000))
      }
    } else {
      console.log('⚠️  响应格式异常')
      console.log('响应结构:', JSON.stringify(response.data, null, 2).substring(0, 500))
    }
  } catch (error) {
    console.error('❌ 文本到图片请求失败')
    console.error('错误:', error.message)
    console.error('状态码:', error.response?.status)
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

// 测试 2: 检查 API key 是否有效
async function testAPIKey() {
  console.log('\n测试 2: 检查 API key...')
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${NANOBANNA_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'test'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    console.log('✅ API key 有效')
    console.log('状态码:', response.status)
  } catch (error) {
    console.error('❌ API key 可能无效')
    console.error('错误:', error.message)
    console.error('状态码:', error.response?.status)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('⚠️  API key 认证失败，请检查 API key 是否正确')
    }
  }
}

// 运行测试
console.log('开始测试 nanobanna API (gemini-2.5-flash-image)...\n')
testAPIKey().then(() => {
  setTimeout(() => {
    testTextToImage()
  }, 2000)
})

