import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { User, Image as ImageIcon, LogOut, Settings, AlertTriangle, Star } from 'lucide-react'
import axios from 'axios'
import Header from './Header'
import UploadSection from './UploadSection'

export default function Dashboard() {
  const { t } = useLanguage()
  const { user, tokens, logout, fetchUserInfo, loading } = useAuth()
  const navigate = useNavigate()
  const [uploadedImage, setUploadedImage] = useState(null)
  const [enhancedImage, setEnhancedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // 只有在加载完成且没有用户时才跳转
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  // 如果没有用户（且不在加载中），返回 null（会触发跳转）
  if (!user) {
    return null
  }


  const getPlanLabel = () => {
    if (user.isAdmin) return t('dashboard.planAdmin')
    if (tokens >= 100) return t('dashboard.planPro')
    if (tokens >= 25) return t('dashboard.planPack')
    if (tokens > 0) return t('dashboard.planTrial')
    return t('dashboard.planFree')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* 用户信息卡片 */}
        <div className="glass-dark rounded-xl p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-white truncate">{user.name}</h2>
                <p className="text-sm md:text-base text-gray-400 truncate">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">{getPlanLabel()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2 text-left">
                <p className="text-xs text-gray-400">{t('dashboard.tokensRemaining')}</p>
                <p className="text-lg font-semibold text-white">{tokens ?? 0}</p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">{t('dashboard.settings')}</span>
              </button>
              <button
                onClick={logout}
                className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">{t('dashboard.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 存储提示横幅 */}
        <div className="bg-amber-900/30 border-l-4 border-amber-500/50 p-4 mb-8 rounded-r-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-300 mb-1">
                {t('dashboard.storageNotice')}
              </h3>
              <p className="text-sm text-amber-200">
                {t('dashboard.storageNoticeDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* 上传区域 */}
        <UploadSection
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          enhancedImage={enhancedImage}
          setEnhancedImage={setEnhancedImage}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />

    {/* 快速操作 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 mb-8">
          <button
            onClick={() => navigate('/history')}
            className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center border border-blue-400/30 group-hover:bg-blue-500/30 transition-colors">
                <ImageIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('dashboard.viewHistory')}</p>
                <p className="text-lg font-semibold text-white">{t('dashboard.imageHistory')}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center border border-purple-400/30 group-hover:bg-purple-500/30 transition-colors">
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('dashboard.accountSettings')}</p>
                <p className="text-lg font-semibold text-white">{t('dashboard.manageAccount')}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center border border-green-400/30 group-hover:bg-green-500/30 transition-colors">
                <ImageIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('dashboard.upgradePlan')}</p>
                <p className="text-lg font-semibold text-white">{t('dashboard.getMoreImages')}</p>
              </div>
            </div>
          </button>
        </div>


        {/* 使用统计 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-dark rounded-xl p-4 md:p-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-blue-500/20 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border border-blue-400/30 flex-shrink-0">
                <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-400">{t('dashboard.totalProcessed')}</p>
                <p className="text-xl md:text-2xl font-bold text-white">{user.totalProcessed || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-4 md:p-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-green-500/20 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border border-green-400/30 flex-shrink-0">
                <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-400">{t('dashboard.remainingImages')}</p>
                <p className="text-xl md:text-2xl font-bold text-white">{tokens}</p>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-4 md:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-purple-500/20 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border border-purple-400/30 flex-shrink-0">
                <Settings className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-400">{t('dashboard.memberSince')}</p>
                <p className="text-base md:text-lg font-semibold text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

