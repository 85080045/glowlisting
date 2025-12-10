import { useState, useRef } from 'react'
import { Upload, Loader2, Download, X, Image as ImageIcon, AlertTriangle, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { enhanceImage, downloadHDImage } from '../services/enhanceService'
import heic2any from 'heic2any'

export default function UploadSection({ 
  uploadedImage, 
  setUploadedImage, 
  enhancedImage, 
  setEnhancedImage,
  isProcessing,
  setIsProcessing 
}) {
  const { t } = useLanguage()
  const { user, tokens, updateTokens } = useAuth()
  const fileInputRef = useRef(null)
  const [error, setError] = useState(null)
  const [imageId, setImageId] = useState(null) // 保存图像 ID 用于下载高清版本
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCompare, setShowCompare] = useState(false) // 是否显示对比视图
  const [comparePosition, setComparePosition] = useState(50) // 对比滑块位置 (0-100)
  const [isConvertingHeic, setIsConvertingHeic] = useState(false) // HEIC 转换状态
  const [regenerateCount, setRegenerateCount] = useState(0) // 当前重新生成次数
  const [remainingRegenerates, setRemainingRegenerates] = useState(3) // 剩余重新生成次数

  // 错误消息映射函数：将英文错误消息转换为翻译键
  const getTranslatedError = (errorMessage) => {
    if (!errorMessage) return t('upload.errorEnhance')
    
    const errorMap = {
      'Please login first': 'upload.errorLoginRequired',
      'Image not found': 'upload.errorImageFormat',
      'Download failed': 'upload.errorDownloadFailed',
      'Image enhancement failed': 'upload.errorEnhance',
      'Image enhancement failed, please check API configuration': 'upload.errorEnhance',
      'No images remaining': 'upload.errorNoImages',
    }
    
    // 检查是否匹配已知错误
    for (const [key, translationKey] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return t(translationKey)
      }
    }
    
    // 如果没有匹配，返回原始错误消息（可能是服务器返回的特定错误）
    return errorMessage
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 检查文件类型，支持 HEIC/HEIF 格式
    const fileExt = file.name.toLowerCase()
    const isImage = file.type.startsWith('image/') || 
                    fileExt.endsWith('.heic') || 
                    fileExt.endsWith('.heif')
    
    if (!isImage) {
      setError(t('upload.errorImageOnly'))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('upload.errorSize'))
      return
    }

    setError(null)
    
    // 检查是否是 HEIC/HEIF 格式（浏览器不支持直接显示）
    const isHeic = fileExt.endsWith('.heic') || fileExt.endsWith('.heif') || 
                   file.type === 'image/heic' || file.type === 'image/heif'
    
    if (isHeic) {
      // HEIC 格式在前端转换为 JPG 用于预览显示
      console.log('HEIC file detected, converting to JPG for preview...')
      setError(null)
      setIsConvertingHeic(true) // 开始转换，显示进度条
      
      try {
        // 使用 heic2any 转换为 JPG
        heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        }).then((convertedBlob) => {
          // heic2any 返回的是数组，取第一个
          const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          
          // 将转换后的 JPG 转换为 data URL 用于显示
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target.result
            console.log('✅ HEIC converted to JPG successfully')
            if (result && result.startsWith('data:')) {
              // 显示转换后的 JPG
              setUploadedImage(result)
              setEnhancedImage(null)
              setImageId(null)
              setShowCompare(false)
              setError(null)
              setIsConvertingHeic(false) // 转换完成，隐藏进度条
            } else {
              setError(t('upload.errorHeicFormat'))
              setIsConvertingHeic(false)
            }
          }
          reader.onerror = () => {
            setError(t('upload.errorHeicRead'))
            setIsConvertingHeic(false)
          }
          reader.readAsDataURL(jpegBlob)
        }).catch((err) => {
          console.error('HEIC conversion error:', err)
          setError(t('upload.errorHeicConvert'))
          setIsConvertingHeic(false) // 转换失败，隐藏进度条
        })
      } catch (err) {
        console.error('HEIC conversion setup error:', err)
        setError(t('upload.errorHeicInit'))
        setIsConvertingHeic(false)
      }
      return
    }

    // 对于其他图片格式，验证图片是否有效
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target.result
      console.log('File loaded successfully')
      console.log('File name:', file.name)
      console.log('File type:', file.type)
      console.log('File size:', file.size)
      console.log('Data URL length:', result?.length)
      console.log('Data URL starts with:', result?.substring(0, 50))
      
      if (result && result.startsWith('data:')) {
        // 验证 data URL 格式并测试图片是否能加载
        const testImg = new Image()
        testImg.onload = () => {
          console.log('✅ Image validation successful')
          setUploadedImage(result)
          setEnhancedImage(null)
          setImageId(null)
          setShowCompare(false)
          setError(null)
          setRegenerateCount(0)
          setRemainingRegenerates(3)
        }
        testImg.onerror = (err) => {
          console.error('❌ Image validation failed')
          console.error('Error details:', err)
          // 即使验证失败，也尝试设置图片（某些浏览器可能验证过于严格）
          // 但添加警告
          console.warn('Image validation failed, but will try to display anyway')
          setUploadedImage(result)
          setEnhancedImage(null)
          setImageId(null)
          setShowCompare(false)
          // 不设置错误，让图片尝试加载，如果失败会在 onError 中处理
        }
        testImg.src = result
      } else {
        console.error('Invalid data URL format')
        setError(t('upload.errorImageFormat'))
      }
    }
    reader.onerror = (error) => {
      console.error('FileReader error:', error)
      setError(t('upload.errorImageRead'))
    }
    reader.onabort = () => {
      console.error('FileReader aborted')
      setError(t('upload.errorImageAbort'))
    }
    reader.readAsDataURL(file)
  }

  const handleEnhance = async (isRegenerate = false) => {
    if (!uploadedImage) return

    // 检查用户是否登录
    if (!user) {
      setError(t('upload.requiresLogin'))
      // 延迟跳转到登录页面，让用户看到提示
      setTimeout(() => {
        window.location.href = '/login?redirect=upload'
      }, 2000)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await enhanceImage(uploadedImage, isRegenerate)
      setEnhancedImage(result.image)
      setImageId(result.imageId) // 保存图像 ID
      
      // 更新重新生成次数信息
      if (result.regenerateCount !== undefined) {
        setRegenerateCount(result.regenerateCount)
      }
      if (result.remainingRegenerates !== undefined) {
        setRemainingRegenerates(result.remainingRegenerates)
      }
      
      // 更新token（不扣token，只是显示当前数量）
      if (result.tokensRemaining !== null) {
        updateTokens(result.tokensRemaining)
      }
    } catch (err) {
      // 检查是否需要登录
      if (err.response?.data?.requiresAuth || err.message.includes('Please register or login')) {
        setError(t('upload.requiresLogin'))
        setTimeout(() => {
          window.location.href = '/login?redirect=upload'
        }, 2000)
      } else if (err.message.includes('Maximum regenerate count reached')) {
        setError(t('upload.maxRegenerateReached'))
      } else if (err.message.includes('No previous generation found')) {
        setError(t('upload.noPreviousGeneration'))
      } else {
        setError(getTranslatedError(err.message))
      }
      console.error('Enhance error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRegenerate = async () => {
    if (remainingRegenerates <= 0) {
      setError(t('upload.maxRegenerateReached'))
      return
    }
    await handleEnhance(true)
  }

  const handleDownload = async () => {
    if (!enhancedImage || !imageId) return
    
    // 检查用户是否登录
    if (!user) {
      setError(t('upload.errorLoginRequired'))
      return
    }
    
    setIsDownloading(true)
    setError(null)
    
    try {
      const result = await downloadHDImage(imageId)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `glowlisting-enhanced-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // 更新剩余可用次数
      if (result.tokensRemaining !== null) {
        updateTokens(result.tokensRemaining)
      }
    } catch (err) {
      setError(getTranslatedError(err.message))
      console.error('Download error:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setEnhancedImage(null)
    setImageId(null)
    setError(null)
    setShowCompare(false) // 关闭对比视图
    setComparePosition(50) // 重置对比位置
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="py-12 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            {t('upload.title')}
          </h2>
          <p className="text-xl md:text-2xl text-gray-300">
            {t('upload.subtitle')}
          </p>
        </div>

        {/* 额度提示 */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm text-gray-400">{t('upload.tokensRemaining')}</p>
                <p className="text-lg font-semibold text-white">{tokens ?? 0}</p>
              </div>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 md:col-span-2 text-sm text-gray-300">
              {t('upload.tokensTip')}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* 上传区域 */}
          <div className="card-glass flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-white">{t('upload.original')}</h3>
            
            {!uploadedImage ? (
              <>
                {isConvertingHeic ? (
                  // HEIC 转换进度显示
                  <div className="border-2 border-dashed border-blue-500/50 rounded-lg p-8 md:p-12 text-center glass-dark flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-blue-400 animate-spin" />
                    <p className="text-blue-300 mb-4 text-base md:text-lg font-semibold">
                      {t('upload.convertingHeic')}
                    </p>
                    {/* 进度条 */}
                    <div className="w-full max-w-xs bg-gray-700 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400">
                      {t('upload.convertingHeic')}
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600/50 rounded-lg p-8 md:p-12 text-center cursor-pointer hover:border-blue-500/50 transition-colors glass-dark flex flex-col items-center justify-center"
                  >
                    <ImageIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-300 mb-2 text-sm md:text-base">{t('upload.clickOrDrag')}</p>
                    <p className="text-xs md:text-sm text-gray-400">{t('upload.supports')}</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            ) : (
              <div className="relative w-full flex flex-col">
                {uploadedImage && uploadedImage.startsWith('data:') ? (
                  <>
                    <img
                      key={uploadedImage.substring(0, 100)} // 添加 key 强制重新渲染
                      src={uploadedImage}
                      alt={t('upload.original')}
                      className="w-full h-auto rounded-lg block"
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        display: 'block',
                        objectFit: 'contain'
                      }}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('=== Image Display Error ===')
                        console.error('Image src type:', typeof uploadedImage)
                        console.error('Image src length:', uploadedImage?.length)
                        console.error('Image src starts with:', uploadedImage?.substring(0, 100))
                        console.error('Image src MIME type:', uploadedImage?.match(/data:([^;]+)/)?.[1])
                        console.error('Error event:', e)
                        console.error('Error target:', e.target)
                        console.error('Error target src:', e.target?.src?.substring(0, 100))
                        
                        // 检查是否是 HEIC 格式
                        const isHeic = uploadedImage.includes('image/heic') || 
                                      uploadedImage.includes('image/heif') ||
                                      fileInputRef.current?.files?.[0]?.name?.toLowerCase().endsWith('.heic') ||
                                      fileInputRef.current?.files?.[0]?.name?.toLowerCase().endsWith('.heif')
                        
                        if (isHeic) {
                          setError(t('upload.errorHeicDisplay'))
                        } else {
                          setError(t('upload.errorImageDisplay'))
                        }
                      }}
                      onLoad={(e) => {
                        console.log('✅ Original image loaded and displayed successfully')
                        console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight)
                        setError(null)
                      }}
                    />
                    {error && (
                      <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                        {error}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                    <div className="text-center">
                      <p className="text-gray-400 mb-2">{t('upload.errorInvalidImage')}</p>
                      <p className="text-sm text-gray-500">{t('upload.errorReupload')}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-20 shadow-lg"
                  title={t('upload.removeImage')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {uploadedImage && !enhancedImage && (
              <button
                onClick={handleEnhance}
                disabled={isProcessing}
                className="btn-primary w-full mt-4 md:mt-6 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    <span className="text-sm md:text-base">{t('upload.processing')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-sm md:text-base">{t('upload.startEnhance')}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 增强结果区域 */}
          <div className="card-glass flex flex-col">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">{t('upload.enhanced')}</h3>
            
            {!enhancedImage ? (
              <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-8 md:p-12 text-center glass-dark flex flex-col items-center justify-center">
                <div className="bg-gray-800 rounded-lg p-6 md:p-8 mb-4 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-500" />
                </div>
                <p className="text-gray-400 text-sm md:text-base">
                  {isProcessing ? t('upload.processing') : t('upload.enhancedWillShow')}
                </p>
              </div>
            ) : (
              <div className="relative flex flex-col">
                {/* 图片 */}
                <img
                  src={enhancedImage}
                  alt={t('upload.enhanced')}
                  className="w-full h-auto rounded-lg"
                />
                
                {/* 底部提示区域 - 移动端优化，确保按钮可见 */}
                <div className="mt-4 space-y-3">
                  {/* 存储提示 */}
                  <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-start space-x-2 md:space-x-3">
                      <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-semibold text-amber-300 mb-1">
                          {t('upload.storageWarningTitle')}
                        </p>
                        <p className="text-xs md:text-sm text-amber-200">
                          {t('upload.storageWarning')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 水印提示 */}
                  <div className="p-2 md:p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <p className="text-xs md:text-sm text-blue-200 text-center">
                      {t('upload.watermarkNotice')}
                    </p>
                  </div>

                  {/* 重新生成提示 */}
                  {remainingRegenerates > 0 && enhancedImage && (
                    <div className="p-2 md:p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                      <p className="text-xs md:text-sm text-green-200 text-center">
                        {t('upload.regenerateNotice').replace('{{count}}', remainingRegenerates.toString())}
                      </p>
                    </div>
                  )}
                  
                  {/* 按钮 - 移动端垂直排列，iPad和桌面端水平排列 */}
                  <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    {remainingRegenerates > 0 && enhancedImage && (
                      <button
                        onClick={handleRegenerate}
                        disabled={isProcessing}
                        className="btn-secondary flex-1 flex items-center justify-center space-x-2 py-3 md:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                            <span className="text-sm md:text-base">{t('upload.regenerating')}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-sm md:text-base">{t('upload.regenerate')}</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setShowCompare(true)}
                      className="btn-secondary flex-1 flex items-center justify-center space-x-2 py-3 md:py-2"
                    >
                      <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">{t('upload.compare')}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading || !user}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed py-3 md:py-2"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                          <span className="text-sm md:text-base">{t('upload.downloading')}</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-sm md:text-base">{t('upload.downloadHD')}</span>
                        </>
                      )}
                    </button>
                <div className="flex-1 text-center text-xs text-gray-400">
                  {t('upload.remainingImages', { count: tokens ?? 0 })}
                </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {enhancedImage && (
          <div className="mt-6 md:mt-8 text-center relative z-10">
            <button
              onClick={handleReset}
              className="btn-secondary px-6 py-3 md:py-2"
            >
              {t('upload.processNew')}
            </button>
          </div>
        )}

        {/* 对比视图 - 揭示式对比效果：原图在底，增强图覆盖在上，拖动滑块揭示原图 */}
        {showCompare && uploadedImage && enhancedImage && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-7xl bg-gray-900 rounded-2xl p-6 md:p-8 shadow-2xl">
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowCompare(false)}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-2 transition-colors z-30 shadow-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* 标题 */}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                {t('upload.compareTitle')}
              </h3>

              {/* 对比容器 - 揭示式对比 */}
              <div 
                className="relative w-full rounded-xl overflow-hidden bg-gray-800 shadow-2xl cursor-ew-resize"
                style={{ 
                  aspectRatio: '16/9', 
                  minHeight: '400px',
                  maxHeight: '80vh'
                }}
                onMouseDown={(e) => {
                  // 点击容器任意位置也可以拖动
                  if (e.target === e.currentTarget || e.target.closest('img')) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
                    setComparePosition(percentage)
                    
                    const handleMouseMove = (moveEvent) => {
                      const newX = moveEvent.clientX - rect.left
                      const newPercentage = Math.max(0, Math.min(100, (newX / rect.width) * 100))
                      setComparePosition(newPercentage)
                    }
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }
                }}
              >
                {/* 原图背景 - 始终完整显示在底层（底图） */}
                {uploadedImage ? (
                  <div className="absolute inset-0" style={{ zIndex: 1 }}>
                    <img
                      src={uploadedImage}
                      alt={t('upload.original')}
                      className="w-full h-full object-contain"
                      style={{ 
                        display: 'block', 
                        userSelect: 'none', 
                        pointerEvents: 'none',
                        width: '100%',
                        height: '100%'
                      }}
                      draggable={false}
                    />
                  </div>
                ) : null}

                {/* 增强图覆盖层 - 完整覆盖原图，但只显示左边部分，拖动滑块时逐渐揭示更多增强图 */}
                {enhancedImage ? (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      zIndex: 2,
                      clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                    }}
                  >
                    <img
                      src={enhancedImage}
                      alt={t('upload.enhanced')}
                      className="w-full h-full object-contain"
                      style={{ 
                        display: 'block', 
                        userSelect: 'none', 
                        pointerEvents: 'none',
                        width: '100%',
                        height: '100%'
                      }}
                      draggable={false}
                    />
                  </div>
                ) : null}

                {/* 滑块控制条 - 拖动时揭示原图 */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-2xl z-30 touch-none cursor-ew-resize"
                  style={{ 
                    left: `${comparePosition}%`, 
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const container = e.currentTarget.parentElement
                    const rect = container.getBoundingClientRect()
                    
                    const handleMouseMove = (moveEvent) => {
                      const x = moveEvent.clientX - rect.left
                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
                      setComparePosition(percentage)
                    }
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const container = e.currentTarget.parentElement
                    const rect = container.getBoundingClientRect()
                    
                    const handleTouchMove = (moveEvent) => {
                      const touch = moveEvent.touches[0] || moveEvent.changedTouches[0]
                      const x = touch.clientX - rect.left
                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
                      setComparePosition(percentage)
                    }
                    
                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                      document.removeEventListener('touchend', handleTouchEnd)
                    }
                    
                    document.addEventListener('touchmove', handleTouchMove, { passive: false })
                    document.addEventListener('touchend', handleTouchEnd)
                  }}
                >
                  {/* 圆形滑块按钮 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-2xl border-2 border-gray-200 hover:scale-110 transition-transform">
                    <div className="flex items-center space-x-1">
                      <ChevronLeft className="h-4 w-4 text-gray-700" />
                      <div className="w-1 h-4 bg-gray-400 rounded"></div>
                      <ChevronRight className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* Before/After 标签 */}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-xl z-20">
                  <span className="text-gray-900 font-bold text-sm md:text-base">{t('upload.compareOriginal')}</span>
                </div>
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-xl z-20">
                  <span className="text-gray-900 font-bold text-sm md:text-base">{t('upload.compareEnhanced')}</span>
                </div>
              </div>

              {/* 提示文字 */}
              <p className="text-center text-gray-400 mt-6 text-sm md:text-base">
                {t('upload.compareHint')}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

