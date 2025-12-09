import { useState } from 'react'
import { Check, Zap, LogIn } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { paymentsService } from '../services/paymentsService'

export default function Pricing() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loadingPlan, setLoadingPlan] = useState(null)
  
  const plans = [
    {
      name: t('pricing.free'),
      price: t('pricing.freePrice'),
      period: '',
      description: t('pricing.freeDesc'),
      features: [
        t('pricing.features.freeImages'),
        t('pricing.features.freeNoCard'),
        t('pricing.features.freeFullQuality'),
      ],
      cta: t('pricing.startFree'),
      popular: false,
      badge: t('pricing.free'),
      action: () => navigate('/login'),
    },
    {
      name: t('pricing.pro'),
      price: t('pricing.proPrice'),
      originalPrice: t('pricing.proOriginalPrice'),
      period: t('pricing.proPeriod'),
      description: t('pricing.proDesc'),
      features: [
        t('pricing.features.proImages'),
        t('pricing.features.proHighRes'),
        t('pricing.features.proSupport'),
        t('pricing.features.proPromo'),
      ],
      cta: t('pricing.startPro'),
      popular: true,
      badge: t('pricing.popular'),
      discountLabel: '70% OFF',
      action: async () => {
        if (!user) {
          navigate('/login')
          return
        }
        try {
          setLoadingPlan('pro')
          console.log('Creating checkout session for pro plan...')
          const session = await paymentsService.createCheckoutSession('pro')
          console.log('Checkout session created:', session)
          if (session?.url) {
            window.location.href = session.url
          } else {
            console.error('No URL in session response:', session)
            alert(t('pricing.checkoutError'))
          }
        } catch (err) {
          console.error('Pro checkout error:', err)
          console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            statusText: err.response?.statusText
          })
          
          // 如果是 401 错误，提示用户重新登录
          if (err.response?.status === 401) {
            const authError = err.response?.data?.message || err.response?.data?.error || 'Your session has expired. Please login again.'
            alert(authError + '\n\nPlease logout and login again to continue.')
            // 清除无效的 token
            localStorage.removeItem('glowlisting_token')
            // 重定向到登录页面
            setTimeout(() => {
              navigate('/login')
            }, 1000)
            return
          }
          
          let errorMsg = err.message
          if (err.response?.data?.message) {
            errorMsg = err.response.data.message
          } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error
          }
          if (!errorMsg || errorMsg === 'pricing.checkoutError') {
            errorMsg = t('pricing.checkoutError')
          }
          alert(errorMsg)
        } finally {
          setLoadingPlan(null)
        }
      },
    },
    {
      name: t('pricing.pack'),
      price: t('pricing.packPrice'),
      period: t('pricing.packPeriod'),
      description: t('pricing.packDesc'),
      features: [
        t('pricing.features.packImages'),
        t('pricing.features.packNoSub'),
        t('pricing.features.packInstant'),
      ],
      cta: t('pricing.buyPack'),
      popular: false,
      badge: 'One-Time',
      action: async () => {
        if (!user) {
          navigate('/login')
          return
        }
        try {
          setLoadingPlan('pack')
          console.log('Creating checkout session for pack plan...')
          const session = await paymentsService.createCheckoutSession('pack')
          console.log('Checkout session created:', session)
          if (session?.url) {
            window.location.href = session.url
          } else {
            console.error('No URL in session response:', session)
            alert(t('pricing.checkoutError'))
          }
        } catch (err) {
          console.error('Pack checkout error:', err)
          console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            statusText: err.response?.statusText
          })
          
          // 如果是 401 错误，提示用户重新登录
          if (err.response?.status === 401) {
            const authError = err.response?.data?.message || err.response?.data?.error || 'Your session has expired. Please login again.'
            alert(authError + '\n\nPlease logout and login again to continue.')
            // 清除无效的 token
            localStorage.removeItem('glowlisting_token')
            // 重定向到登录页面
            setTimeout(() => {
              navigate('/login')
            }, 1000)
            return
          }
          
          let errorMsg = err.message
          if (err.response?.data?.message) {
            errorMsg = err.response.data.message
          } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error
          }
          if (!errorMsg || errorMsg === 'pricing.checkoutError') {
            errorMsg = t('pricing.checkoutError')
          }
          alert(errorMsg)
        } finally {
          setLoadingPlan(null)
        }
      },
    },
    {
      name: t('pricing.enterprise'),
      price: '',
      period: '',
      description: t('pricing.enterpriseDesc'),
      features: [
        t('pricing.features.entCustom'),
        t('pricing.features.entTeams'),
      ],
      cta: t('pricing.contactSales'),
      popular: false,
      badge: 'Enterprise',
      action: () => window.location.href = 'mailto:hello@glowlisting.ai',
    },
  ]

  return (
    <section id="pricing" className="py-24 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('pricing.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('pricing.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <ScrollRevealItem 
              key={index}
              variant="fadeScale"
              delay={index * 0.05}
            >
              <div
                className={`relative rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-2 border-blue-400 ring-4 ring-blue-500/30'
                    : 'glass-dark'
                }`}
              >
              {(plan.popular || plan.discountLabel) && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-center py-3 text-sm font-bold shadow-lg">
                  <Zap className="h-4 w-4 inline mr-1" />
                  {plan.discountLabel || plan.badge}
                </div>
              )}
              
              <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                <h3 className={`text-3xl font-extrabold mb-3 ${plan.popular ? 'text-white' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-8 ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>{plan.description}</p>
                
                <div className="mb-8">
                  {plan.originalPrice && (
                    <div className="text-gray-300 line-through text-sm mb-1">{plan.originalPrice}/{plan.period}</div>
                  )}
                  <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`ml-2 ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>{plan.period}</span>
                  )}
                </div>

                <button
                  onClick={plan.action}
                  disabled={loadingPlan === plan.name}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  } ${loadingPlan === plan.name ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loadingPlan === plan.name ? t('pricing.loading') || 'Processing...' : plan.cta}
                </button>

                <ul className="mt-10 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className={`h-6 w-6 ${plan.popular ? 'text-white' : 'text-blue-400'} mr-3 flex-shrink-0 mt-0.5`} />
                      <span className={plan.popular ? 'text-blue-100' : 'text-gray-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fadeScale" delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              {t('pricing.needCustom')}
            </p>
            <button className="btn-secondary">
              {t('pricing.contactTeam')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

