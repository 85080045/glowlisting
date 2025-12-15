import { useState, useRef, useEffect } from 'react'
import { Upload, Loader2, Download, X, Image as ImageIcon, AlertTriangle, Maximize2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock3, RefreshCw, Coins } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { enhanceImage, downloadHDImage } from '../services/enhanceService'
import heic2any from 'heic2any'
import BeforeAfterSlider from './BeforeAfterSlider'

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
  const [isConvertingHeic, setIsConvertingHeic] = useState(false) // HEIC 转换状态
  const [regenerateCount, setRegenerateCount] = useState(0) // 当前重新生成次数
  const [remainingRegenerates, setRemainingRegenerates] = useState(3) // 剩余重新生成次数
  // 批量任务队列
  const [tasks, setTasks] = useState([]) // {id,name,dataUrl,status,enhanced,imageId,errorMsg}
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [isQueuePaused, setIsQueuePaused] = useState(false)
  // 隐私保护选项
  const [privacyOptions, setPrivacyOptions] = useState({
    blurFaces: false,      // 模糊人脸
    blurLicensePlates: false, // 模糊车牌
    removeSmallObjects: false, // 移除小物体
  })

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

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const fileExt = file.name.toLowerCase()
      const isImage = file.type.startsWith('image/') || 
                      fileExt.endsWith('.heic') || 
                      fileExt.endsWith('.heif')
      if (!isImage) return reject(new Error(t('upload.errorImageOnly')))
      if (file.size > 10 * 1024 * 1024) return reject(new Error(t('upload.errorSize')))

      const isHeic = fileExt.endsWith('.heic') || fileExt.endsWith('.heif') || 
                     file.type === 'image/heic' || file.type === 'image/heif'

      const readBlob = (blob) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const result = ev.target.result
          if (result && result.startsWith('data:')) {
            resolve(result)
          } else {
            reject(new Error(t('upload.errorImageFormat')))
          }
        }
        reader.onerror = () => reject(new Error(t('upload.errorImageRead')))
        reader.onabort = () => reject(new Error(t('upload.errorImageAbort')))
        reader.readAsDataURL(blob)
      }

      if (!isHeic) {
        return readBlob(file)
      }

      setIsConvertingHeic(true)
      heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      }).then((convertedBlob) => {
        const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        readBlob(jpegBlob)
        setIsConvertingHeic(false)
      }).catch((err) => {
        setIsConvertingHeic(false)
        reject(new Error(t('upload.errorHeicConvert') + `: ${err.message}`))
      })
    })
  }

  const genId = () => {
    const c = typeof crypto !== 'undefined' ? crypto : null
    if (c?.randomUUID) return c.randomUUID()
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError(null)
    const newTasks = []
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        newTasks.push({
          id: genId(),
          name: file.name,
          dataUrl,
          status: 'queued',
          enhanced: null,
          imageId: null,
          errorMsg: null,
        })
      } catch (err) {
        setError(err.message)
      }
    }
    if (newTasks.length) {
      setTasks(prev => [...prev, ...newTasks])
      setUploadedImage(newTasks[0].dataUrl)
      setEnhancedImage(null)
      setImageId(null)
      // 不自动开始批处理，等待用户手动点击"开始增强"按钮
      // setIsBatchProcessing(true)
    }
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

    // 如果有批量任务，启动批量处理
    if (tasks.length > 0 && !isRegenerate) {
      setIsBatchProcessing(true)
      setIsQueuePaused(false)
      return
    }

    // 单张图片处理
    setIsProcessing(true)
    setError(null)

    try {
      const result = await enhanceImage(uploadedImage, isRegenerate, privacyOptions)
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

  // 队列顺序处理
  useEffect(() => {
    if (!isBatchProcessing || isQueuePaused) return
    // 如果已有进行中的任务，等待
    if (isProcessing) return
    const next = tasks.find(t => t.status === 'queued')
    if (!next) {
      setIsBatchProcessing(false)
      setActiveTaskId(null)
      return
    }
    setActiveTaskId(next.id)
    const run = async () => {
      setTasks(prev => prev.map(t => t.id === next.id ? { ...t, status: 'processing', errorMsg: null } : t))
      setIsProcessing(true)
      setUploadedImage(next.dataUrl)
      setEnhancedImage(null)
      setImageId(null)
      try {
        const result = await enhanceImage(next.dataUrl, false, privacyOptions)
        setEnhancedImage(result.image)
        setImageId(result.imageId)
        if (result.tokensRemaining !== null && result.tokensRemaining !== undefined) {
          updateTokens(result.tokensRemaining)
        }
        if (result.regenerateCount !== undefined) setRegenerateCount(result.regenerateCount)
        if (result.remainingRegenerates !== undefined) setRemainingRegenerates(result.remainingRegenerates)
        setTasks(prev => prev.map(t => t.id === next.id ? { ...t, status: 'done', enhanced: result.image, imageId: result.imageId } : t))
      } catch (err) {
        console.error('Batch enhance error:', err)
        setTasks(prev => prev.map(t => t.id === next.id ? { ...t, status: 'error', errorMsg: err.message || 'Failed' } : t))
        setError(getTranslatedError(err.message || 'Enhance failed'))
      } finally {
        setIsProcessing(false)
      }
    }
    run()
  }, [isBatchProcessing, isQueuePaused, tasks, isProcessing, privacyOptions])

  const retryTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'queued', errorMsg: null } : t))
    // 如果批量处理未启动，启动它
    if (!isBatchProcessing) {
      setIsBatchProcessing(true)
    }
    setIsQueuePaused(false)
  }

  const downloadTask = async (task) => {
    if (!task?.imageId) return
    setIsDownloading(true)
    try {
      await downloadHDImage(task.imageId)
    } catch (err) {
      setError(getTranslatedError(err.message || 'Download failed'))
    } finally {
      setIsDownloading(false)
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
    setPrivacyOptions({ blurFaces: false, blurLicensePlates: false, removeSmallObjects: false }) // 重置隐私选项
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="py-10 md:py-18 px-4 md:px-6 relative overflow-hidden">
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

        {/* 手动选项 - 在上传前显示 */}
        <div className="card-glass mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('upload.privacyOptions')}</h3>
          <div className="space-y-4">
            {/* 人脸模糊开关 */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1 pr-4">
                <span className="text-white font-medium block mb-1">{t('upload.blurFaces')}</span>
                <p className="text-sm text-gray-400">{t('upload.blurFacesDesc')}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={privacyOptions.blurFaces}
                  onChange={(e) => setPrivacyOptions({ ...privacyOptions, blurFaces: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-14 h-8 rounded-full transition-all duration-300 ease-in-out ${
                  privacyOptions.blurFaces 
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/50' 
                    : 'bg-gray-700'
                }`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out mt-1 ${
                    privacyOptions.blurFaces ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
            </label>
            
            {/* 车牌模糊开关 */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1 pr-4">
                <span className="text-white font-medium block mb-1">{t('upload.blurLicensePlates')}</span>
                <p className="text-sm text-gray-400">{t('upload.blurLicensePlatesDesc')}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={privacyOptions.blurLicensePlates}
                  onChange={(e) => setPrivacyOptions({ ...privacyOptions, blurLicensePlates: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-14 h-8 rounded-full transition-all duration-300 ease-in-out ${
                  privacyOptions.blurLicensePlates 
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/50' 
                    : 'bg-gray-700'
                }`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out mt-1 ${
                    privacyOptions.blurLicensePlates ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
            </label>
            
            {/* 移除小物体开关 */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1 pr-4">
                <span className="text-white font-medium block mb-1">{t('upload.removeSmallObjects')}</span>
                <p className="text-sm text-gray-400">{t('upload.removeSmallObjectsDesc')}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={privacyOptions.removeSmallObjects}
                  onChange={(e) => setPrivacyOptions({ ...privacyOptions, removeSmallObjects: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-14 h-8 rounded-full transition-all duration-300 ease-in-out ${
                  privacyOptions.removeSmallObjects 
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/50' 
                    : 'bg-gray-700'
                }`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out mt-1 ${
                    privacyOptions.removeSmallObjects ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
            </label>
          </div>
        </div>

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
                  multiple
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

      {/* 队列列表 */}
      {tasks.length > 0 && (
        <div className="card-glass mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h3 className="text-lg font-semibold text-white">{t('upload.queue') || 'Batch queue'}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
              <span>{t('upload.queueTotal') || 'Total'}: {tasks.length}</span>
              <span>• {t('upload.queueProcessing') || 'Processing'}: {tasks.filter(t => t.status === 'processing').length}</span>
              <span>• {t('upload.queueDone') || 'Done'}: {tasks.filter(t => t.status === 'done').length}</span>
              <span>• {t('upload.queueError') || 'Failed'}: {tasks.filter(t => t.status === 'error').length}</span>
            </div>
            {/* 如果队列中有待处理任务且未在处理中，显示开始按钮 */}
            {tasks.some(t => t.status === 'queued') && !isBatchProcessing && !isProcessing && (
              <button
                onClick={() => {
                  if (!user) {
                    setError(t('upload.requiresLogin'))
                    setTimeout(() => {
                      window.location.href = '/login?redirect=upload'
                    }, 2000)
                    return
                  }
                  setIsBatchProcessing(true)
                  setIsQueuePaused(false)
                }}
                className="btn-primary px-4 py-2 text-sm"
              >
                {t('upload.startBatch') || 'Start Processing'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {tasks.map(task => {
              const isActive = task.id === activeTaskId
              return (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-900/40 border border-gray-800 rounded-lg px-3 py-3">
                  <div className="flex items-center gap-3">
                    {task.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                    {task.status === 'queued' && <Clock3 className="h-4 w-4 text-gray-400" />}
                    {task.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                    {task.status === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
                    <div>
                      <p className="text-sm text-white">{task.name}</p>
                      <p className="text-xs text-gray-400">
                        {task.status === 'queued' && (t('upload.statusQueued') || 'Queued')}
                        {task.status === 'processing' && (t('upload.statusProcessing') || 'Processing')}
                        {task.status === 'done' && (t('upload.statusDone') || 'Done')}
                        {task.status === 'error' && (task.errorMsg || (t('upload.statusError') || 'Failed'))}
                      </p>
                    </div>
                    {isActive && <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded-full">{t('upload.currentTask') || 'Current'}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary px-3 py-1 text-xs"
                      onClick={() => {
                        setUploadedImage(task.dataUrl)
                        setEnhancedImage(task.enhanced || null)
                        setImageId(task.imageId || null)
                      }}
                    >
                      {t('upload.view') || 'View'}
                    </button>
                    {task.status === 'done' && task.imageId && (
                      <button
                        className="btn-primary px-3 py-1 text-xs flex items-center gap-1"
                        onClick={() => downloadTask(task)}
                        disabled={isDownloading}
                      >
                        <Download className="h-3 w-3" />
                        {t('upload.downloadResult') || 'Download'}
                      </button>
                    )}
                    {task.status === 'error' && (
                      <button
                        className="btn-secondary px-3 py-1 text-xs flex items-center gap-1"
                        onClick={() => retryTask(task.id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t('upload.retry') || 'Retry'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

        {/* 对比视图 - 使用 BeforeAfterSlider 组件 */}
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
                {t('upload.compareTitle') || 'Compare Original vs Enhanced'}
              </h3>

              {/* 使用 BeforeAfterSlider 组件 */}
              <div className="w-full" style={{ maxHeight: '80vh' }}>
                <BeforeAfterSlider 
                  beforeImage={uploadedImage}
                  afterImage={enhancedImage}
                  className="border border-gray-700"
                  aspectRatio="auto"
                  objectFit="contain"
                />
              </div>

              {/* 提示文字 */}
              <p className="text-center text-gray-400 mt-6 text-sm md:text-base">
                {t('upload.compareHint') || 'Drag the slider to compare'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

