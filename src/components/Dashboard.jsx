import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { User, Image as ImageIcon, LogOut, Settings, AlertTriangle, Star, Send } from 'lucide-react'
import axios from 'axios'
import Header from './Header'
import UploadSection from './UploadSection'

export default function Dashboard() {
  const { t } = useLanguage()
  const { user, tokens, logout, fetchUserInfo } = useAuth()
  const navigate = useNavigate()
  const [uploadedImage, setUploadedImage] = useState(null)
  const [enhancedImage, setEnhancedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [supportCategory, setSupportCategory] = useState('bug')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubmitting, setSupportSubmitting] = useState(false)
  const [supportResult, setSupportResult] = useState(null)
  const [supportList, setSupportList] = useState([])
  const [supportLoading, setSupportLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else {
      fetchUserInfo()
      fetchSupportList()
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  const fetchSupportList = async () => {
    try {
      setSupportLoading(true)
      const token = localStorage.getItem('glowlisting_token')
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/support/feedback`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSupportList(res.data.feedback || [])
    } catch (err) {
      console.error('Fetch support list failed:', err)
    } finally {
      setSupportLoading(false)
    }
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

    {/* Support / Feedback */}
    <div className="glass-dark rounded-xl p-6 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{t('dashboard.supportTitle')}</h3>
        {supportResult && (
          <span className="text-sm text-green-400">{t('dashboard.supportSuccess')}</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-300 mb-2">{t('dashboard.supportCategory')}</label>
          <select
            value={supportCategory}
            onChange={(e) => setSupportCategory(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="bug">{t('dashboard.supportCategoryBug')}</option>
            <option value="idea">{t('dashboard.supportCategoryIdea')}</option>
            <option value="complaint">{t('dashboard.supportCategoryComplaint')}</option>
            <option value="other">{t('dashboard.supportCategoryOther')}</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-2">{t('dashboard.supportMessage')}</label>
          <textarea
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            rows={4}
            className="w-full bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('dashboard.supportPlaceholder')}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <button
          disabled={supportSubmitting || !supportMessage}
          onClick={async () => {
            setSupportSubmitting(true)
            setSupportResult(null)
            try {
              const token = localStorage.getItem('glowlisting_token')
              await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/support/feedback`,
                {
                  category: supportCategory,
                  message: supportMessage,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
              setSupportResult('ok')
              setSupportMessage('')
              fetchSupportList()
            } catch (err) {
              console.error('Submit feedback failed:', err)
              setSupportResult('error')
            } finally {
              setSupportSubmitting(false)
            }
          }}
          className={`btn-primary flex items-center gap-2 ${supportSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Send className="h-4 w-4" />
          {supportSubmitting ? t('dashboard.supportSubmitting') : t('dashboard.supportSubmit')}
        </button>
      </div>

      {/* My feedback list */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-3">{t('dashboard.myFeedback') || 'My feedback'}</h4>
        {supportLoading && <p className="text-sm text-gray-400">{t('dashboard.loading') || 'Loading...'}</p>}
        {!supportLoading && (
          <div className="space-y-3">
            {supportList.map((f) => (
              <div key={f.id} className="border border-gray-800 rounded-lg p-3 bg-gray-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{f.created_at ? new Date(f.created_at).toLocaleString() : ''}</span>
                  <span className="text-xs text-blue-300">{f.status || ''}</span>
                </div>
                <div className="text-sm text-gray-200 mt-1 whitespace-pre-wrap break-words">{f.message}</div>
                {f.admin_reply && (
                  <div className="mt-2 text-sm text-green-300 whitespace-pre-wrap break-words">
                    <span className="font-semibold">{t('dashboard.adminReply') || 'Admin reply'}: </span>
                    {f.admin_reply}
                    <div className="text-xs text-gray-400 mt-1">
                      {f.admin_reply_at ? new Date(f.admin_reply_at).toLocaleString() : ''}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {supportList.length === 0 && (
              <p className="text-sm text-gray-400">{t('dashboard.noData') || 'No feedback yet'}</p>
            )}
          </div>
        )}
      </div>
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

