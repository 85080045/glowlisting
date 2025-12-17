import { useState, useEffect } from 'react'
import { Check, Zap, LogIn } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { paymentsService } from '../services/paymentsService'
import { trackCheckoutAbandonment, trackEvent } from '../utils/analytics'

export default function Pricing() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loadingPlan, setLoadingPlan] = useState(null)
  
  const plans = [
    {
      name: t('pricing.free'),
      subtitle: t('pricing.freeSubtitle'),
      price: t('pricing.freePrice'),
      period: '',
      description: t('pricing.freeDesc'),
      features: [
        t('pricing.features.freeProperty'),
        t('pricing.features.freePhotos'),
        t('pricing.features.freeEnhancements') + ' ' + t('pricing.features.freeEnhancementsDetail'),
        t('pricing.features.freeExport'),
      ],
      cta: t('pricing.startFree'),
      popular: false,
      badge: t('pricing.free'),
      action: () => navigate('/login'),
    },
    {
      name: t('pricing.listing'),
      subtitle: '',
      price: t('pricing.listingPrice'),
      period: t('pricing.listingPeriod'),
      description: t('pricing.listingDesc'),
      features: [
        t('pricing.features.listingPhotos'),
        t('pricing.features.listingEnhancements') + ' ' + t('pricing.features.listingEnhancementsDetail'),
        t('pricing.features.listingExport'),
        t('pricing.features.listingOneTime'),
      ],
      cta: t('pricing.buyListing'),
      popular: true,
      badge: t('pricing.popular'),
      action: async () => {
        if (!user) {
          navigate('/login')
          return
        }
        try {
          setLoadingPlan('listing')
          trackEvent('pay_start', { planType: 'listing' })
          console.log('Creating checkout session for listing plan...')
          const session = await paymentsService.createCheckoutSession('listing')
          console.log('Checkout session created:', session)
          if (session?.url) {
            window.location.href = session.url
          } else {
            console.error('No URL in session response:', session)
            alert(t('pricing.checkoutError'))
          }
        } catch (err) {
          console.error('Listing checkout error:', err)
          
          // 如果是 401 错误，提示用户重新登录
          if (err.response?.status === 401) {
            const authError = err.response?.data?.message || err.response?.data?.error || 'Your session has expired. Please login again.'
            alert(authError + '\n\nPlease logout and login again to continue.')
            localStorage.removeItem('glowlisting_token')
            setTimeout(() => {
              navigate('/login')
            }, 1000)
            return
          }
          
          // 显示详细的错误信息
          let errorMsg = err.message
          if (err.response?.data?.message) {
            errorMsg = err.response.data.message
          } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error
          }
          
          if (!errorMsg || errorMsg === 'pricing.checkoutError') {
            errorMsg = t('pricing.checkoutError') || 'Checkout failed, please try again.'
          }
          
          if (err.response?.status) {
            errorMsg += ` (Status: ${err.response.status})`
          }
          
          console.error('Displaying error to user:', errorMsg)
          alert(errorMsg)
          
          // 记录结账放弃
          trackCheckoutAbandonment('listing', 19, null, 'usd', user?.id || null)
          trackEvent('pay_failed', { planType: 'listing', message: err.message })
        } finally {
          setLoadingPlan(null)
        }
      },
    },
    {
      name: t('pricing.pro'),
      subtitle: t('pricing.proSubtitle'),
      price: t('pricing.proPrice'),
      period: t('pricing.proPeriod'),
      description: t('pricing.proDesc'),
      features: [
        t('pricing.features.proListings'),
        t('pricing.features.proPhotosPerListing'),
        t('pricing.features.proPriority'),
        t('pricing.features.proPresets'),
        t('pricing.features.proTurnaround'),
      ],
      cta: t('pricing.startPro'),
      popular: false,
      badge: 'Pro',
      action: async () => {
        if (!user) {
          navigate('/login')
          return
        }
        try {
          setLoadingPlan('pro')
          trackEvent('pay_start', { planType: 'pro' })
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
          
          // 如果是 401 错误，提示用户重新登录
          if (err.response?.status === 401) {
            const authError = err.response?.data?.message || err.response?.data?.error || 'Your session has expired. Please login again.'
            alert(authError + '\n\nPlease logout and login again to continue.')
            localStorage.removeItem('glowlisting_token')
            setTimeout(() => {
              navigate('/login')
            }, 1000)
            return
          }
          
          // 显示详细的错误信息
          let errorMsg = err.message
          if (err.response?.data?.message) {
            errorMsg = err.response.data.message
          } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error
          }
          
          if (!errorMsg || errorMsg === 'pricing.checkoutError') {
            errorMsg = t('pricing.checkoutError') || 'Checkout failed, please try again.'
          }
          
          if (err.response?.status) {
            errorMsg += ` (Status: ${err.response.status})`
          }
          
          console.error('Displaying error to user:', errorMsg)
          alert(errorMsg)
          
          // 记录结账放弃
          trackCheckoutAbandonment('pro', 49, null, 'usd', user?.id || null)
          trackEvent('pay_failed', { planType: 'pro', message: err.message })
        } finally {
          setLoadingPlan(null)
        }
      },
    },
  ]

  return (
    <section id="pricing" className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto z-10">
        <ScrollReveal variant="fade" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollRevealItem key={plan.name} variant="fadeScale" delay={index * 0.1}>
            <div className={`relative h-full ${plan.popular ? 'md:scale-105' : ''}`}>
              <div className={`card-glass relative overflow-hidden h-full flex flex-col ${
                plan.popular ? 'border-2 border-blue-500/50 shadow-2xl' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-bl-lg text-xs font-bold">
                    {plan.badge}
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-12' : ''} flex-grow flex flex-col`}>
                  <div className="mb-6">
                    {!plan.popular && plan.badge && (
                      <span className="inline-block px-3 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300 mb-3">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                    {plan.subtitle && (
                      <p className="text-sm text-gray-400 mb-3">{plan.subtitle}</p>
                    )}
                    <p className={`text-base ${plan.popular ? 'text-blue-100' : 'text-gray-400'} mb-6`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
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
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:scale-105'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    } ${loadingPlan === plan.name ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loadingPlan === plan.name ? t('pricing.loading') || 'Processing...' : plan.cta}
                  </button>

                  <ul className="space-y-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className={`h-6 w-6 ${plan.popular ? 'text-white' : 'text-blue-400'} mr-3 flex-shrink-0 mt-0.5`} />
                        <span className={plan.popular ? 'text-blue-100' : 'text-gray-300'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fade" delay={0.3}>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {t('pricing.enterpriseNote')} <a href="mailto:hello@glowlisting.ai" className="text-blue-400 hover:text-blue-300 underline">{t('pricing.contactUs')}</a>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
