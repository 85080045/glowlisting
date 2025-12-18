import axios from 'axios'

// 配置 API 端点
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * 增强图片
 * @param {string} imageDataUrl - Base64 编码的图片数据
 * @param {boolean} isRegenerate - 是否是重新生成
 * @param {Object} privacyOptions - 隐私保护选项 { blurFaces: boolean, blurLicensePlates: boolean }
 * @returns {Promise<{image: string, tokensRemaining: number, regenerateCount: number, remainingRegenerates: number}>} - 增强后的图片数据 URL 和剩余token
 */
export async function enhanceImage(imageDataUrl, isRegenerate = false, privacyOptions = {}) {
  try {
    // 获取token
    const token = localStorage.getItem('glowlisting_token')
    
    // 将 base64 数据转换为 blob
    const base64Data = imageDataUrl.split(',')[1] || imageDataUrl
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())

    // 创建 FormData
    const formData = new FormData()
    formData.append('image', blob, 'image.jpg')
    if (isRegenerate) {
      formData.append('isRegenerate', 'true')
    }
    if (privacyOptions.blurFaces) {
      formData.append('blurFaces', 'true')
    }
    if (privacyOptions.blurLicensePlates) {
      formData.append('blurLicensePlates', 'true')
    }
    if (privacyOptions.removeSmallObjects) {
      formData.append('removeSmallObjects', 'true')
    }
    if (privacyOptions.twilightLook) {
      formData.append('twilightLook', 'true')
    }

    // 发送请求到后端 API
    const response = await axios.post(`${API_URL}/enhance`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      responseType: 'json', // 接收 JSON 响应（包含 base64 图像）
    })

    // 获取剩余token（从响应头）
    const tokensRemaining = parseInt(response.headers['x-tokens-remaining']) || null

    // 后端返回的是 JSON，包含 base64 图像和 imageId
    if (response.data.success && response.data.image) {
      return {
        image: response.data.image, // 已经是 data:image/jpeg;base64,... 格式（预览图，带水印）
        imageId: response.data.imageId, // 用于下载高清版本
        tokensRemaining,
        regenerateCount: response.data.regenerateCount || 0, // 当前重新生成次数
        remainingRegenerates: response.data.remainingRegenerates || 3, // 剩余重新生成次数
        message: response.data.message,
      }
    } else {
      throw new Error(response.data.error || 'Image enhancement failed')
    }
  } catch (error) {
    console.error('Enhance image error:', error)
    
    // 检查是否是 JSON 响应错误
    if (error.response?.data) {
      const errorData = typeof error.response.data === 'string' 
        ? JSON.parse(error.response.data) 
        : error.response.data
      throw new Error(errorData.error || errorData.message || 'Image enhancement failed')
    }
    
    throw new Error(error.message || 'Image enhancement failed, please check API configuration')
  }
}

/**
 * 下载高清版本（消耗一个 token）
 * @param {string} imageId - 图像 ID
 * @returns {Promise<{blob: Blob, tokensRemaining: number}>} - 高清图像 blob 和剩余token
 */
export async function downloadHDImage(imageId) {
  try {
    const token = localStorage.getItem('glowlisting_token')
    
    if (!token) {
      throw new Error('Please login first')
    }
    
    const response = await axios.get(`${API_URL}/download/${imageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    })
    
    // 获取剩余token（从响应头）
    const tokensRemaining = parseInt(response.headers['x-tokens-remaining']) || null
    
    return {
      blob: response.data,
      tokensRemaining,
    }
  } catch (error) {
    console.error('Download HD image error:', error)
    
    if (error.response?.status === 403) {
      throw new Error('Insufficient tokens to download HD version')
    }
    
    if (error.response?.status === 404) {
      throw new Error('Image not found')
    }
    
    throw new Error(error.response?.data?.error || 'Download failed')
  }
}

/**
 * 使用 autoenhance.ai API 增强图片
 * 注意：您需要替换为实际的 API key
 */
export async function enhanceImageWithAutoEnhance(imageDataUrl, apiKey) {
  try {
    const base64Data = imageDataUrl.split(',')[1] || imageDataUrl
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())

    const formData = new FormData()
    formData.append('image', blob, 'image.jpg')

    // autoenhance.ai API 调用示例
    // 请根据实际的 API 文档调整
    const response = await axios.post(
      'https://api.autoenhance.ai/v1/enhance', // 替换为实际 API 端点
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${apiKey}`, // 替换为实际的 API key
        },
        responseType: 'blob',
      }
    )

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(response.data)
    })
  } catch (error) {
    console.error('AutoEnhance API error:', error)
    throw new Error('图片增强失败：' + (error.response?.data?.message || error.message))
  }
}

