import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Calendar, CheckCircle, XCircle, ArrowLeft, Download, AlertCircle } from 'lucide-react'
import Header from './Header'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SubscriptionManagement() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [billingHistory, setBillingHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else {
      fetchSubscriptionData()
    }
  }, [user, navigate])

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('glowlisting_token')
      // 这里应该调用实际的 API
      // const response = await axios.get(`${API_URL}/subscription`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      // setSubscription(response.data.subscription)
      // setBillingHistory(response.data.billingHistory)
      
      // 临时数据
      setSubscription({
        plan: 'Free Trial',
        status: 'active',
        imagesRemaining: user.tokens || 0,
        nextBillingDate: null,
      })
      setBillingHistory([])
    } catch (err) {
      console.error('Failed to fetch subscription data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    navigate('/pricing')
  }

  const handleCancelSubscription = async () => {
    if (!confirm(t('subscription.confirmCancel'))) return
    
    try {
      const token = localStorage.getItem('glowlisting_token')
      // await axios.post(`${API_URL}/subscription/cancel`, {}, {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      fetchSubscriptionData()
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('subscription.backToDashboard')}</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">{t('subscription.title')}</h1>

        {/* 当前订阅 */}
        <div className="glass-dark rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>{t('subscription.currentPlan')}</span>
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{subscription.plan}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {subscription.status === 'active' ? (
                      <span className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('subscription.active')}</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span>{t('subscription.inactive')}</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('subscription.imagesRemaining')}</p>
                  <p className="text-2xl font-bold text-white">{subscription.imagesRemaining}</p>
                </div>
              </div>

              {subscription.nextBillingDate && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    {t('subscription.nextBilling')}: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {subscription.plan === 'Free Trial' ? (
                  <button onClick={handleUpgrade} className="btn-primary">
                    {t('subscription.upgrade')}
                  </button>
                ) : (
                  <>
                    <button onClick={handleUpgrade} className="btn-secondary">
                      {t('subscription.changePlan')}
                    </button>
                    <button onClick={handleCancelSubscription} className="btn-secondary bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/50">
                      {t('subscription.cancel')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('subscription.noSubscription')}</p>
              <button onClick={handleUpgrade} className="btn-primary mt-4">
                {t('subscription.getStarted')}
              </button>
            </div>
          )}
        </div>

        {/* 账单历史 */}
        <div className="glass-dark rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{t('subscription.billingHistory')}</span>
          </h2>
          
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">{t('subscription.noBillingHistory')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{bill.description}</p>
                    <p className="text-sm text-gray-400">{new Date(bill.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${bill.amount}</p>
                    {bill.invoiceUrl && (
                      <a
                        href={bill.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>{t('subscription.downloadInvoice')}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

