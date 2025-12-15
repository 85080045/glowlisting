import { Sparkles, Upload, Zap, ShieldCheck, Lock, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Hero() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleLearnMore = () => {
    if (location.pathname === '/') {
      // 如果在主页，直接滚动到 features section
      const featuresSection = document.getElementById('features')
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // 如果不在主页，先跳转到主页
      navigate('/')
      // 等待页面加载完成后再滚动
      setTimeout(() => {
        const featuresSection = document.getElementById('features')
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }
  
  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden min-h-screen flex items-center">
      {/* 全屏渐变背景动画 - 参考科技公司设计，从页面顶部开始 */}
      <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0" style={{ top: '-64px', height: 'calc(100% + 64px)' }}>
        {/* 主渐变层 - 蓝色到紫色到粉色 */}
        <div className="absolute inset-0 hero-gradient-flow"></div>
        
        {/* 第二层渐变 - 反向流动 */}
        <div className="absolute inset-0 hero-gradient-flow-2"></div>
        
        {/* 径向光晕层 - 左上角蓝色 */}
        <div className="absolute inset-0 hero-radial-glow-1"></div>
        
        {/* 径向光晕层 - 右下角粉色 */}
        <div className="absolute inset-0 hero-radial-glow-2"></div>
        
        {/* 径向光晕层 - 中心混合 */}
        <div className="absolute inset-0 hero-radial-glow-3"></div>
      </div>
      
      {/* 背景装饰 - 微妙的网格 */}
      <div className="absolute inset-0 tech-grid opacity-5 z-10"></div>
      
      <div className="relative max-w-7xl mx-auto text-center z-20">
        <ScrollReveal variant="fadeScale" delay={0}>
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>{t('hero.badge')}</span>
          </div>
        </ScrollReveal>
        
        <ScrollReveal variant="slideUp" delay={0.05}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 md:mb-8 leading-tight px-2">
            {t('hero.title')}
            <br />
            <span className="gradient-text">{t('hero.titleHighlight')}</span>
          </h1>
        </ScrollReveal>
        
        <ScrollReveal variant="fade" delay={0.1}>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            {t('hero.description')}
          </p>
        </ScrollReveal>
        
        {/* Trust Badges */}
        <ScrollReveal variant="fade" delay={0.12}>
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 text-[11px] md:text-xs tracking-[0.25em] uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t('hero.trustTitle')}</span>
            </div>
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
                <div className="px-2.5 py-1 rounded-md bg-white text-[#635bff] text-xs font-black tracking-wide shadow-sm">
                  stripe
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] md:text-xs font-semibold text-gray-100">
                    {t('hero.trustStripe')}
                  </p>
                  <p className="text-[10px] text-gray-400 hidden md:block">
                    {t('hero.trustStripeDesc')}
                  </p>
                </div>
              </div>
              <div className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
                <div className="p-2 rounded-full bg-blue-500/20 text-blue-300">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] md:text-xs font-semibold text-gray-100">
                    {t('hero.trustSecurity')}
                  </p>
                  <p className="text-[10px] text-gray-400 hidden md:block">
                    {t('hero.trustSecurityDesc')}
                  </p>
                </div>
              </div>
              <div className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
                <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-300">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] md:text-xs font-semibold text-gray-100">
                    {t('hero.trustCompliance')}
                  </p>
                  <p className="text-[10px] text-gray-400 hidden md:block">
                    {t('hero.trustComplianceDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="btn-primary text-lg px-10 py-4 flex items-center space-x-2 relative">
              <Upload className="h-5 w-5" />
              <span>{t('hero.startNow')}</span>
            </button>
            <button 
              onClick={handleLearnMore}
              className="btn-secondary text-lg px-10 py-4"
            >
              {t('hero.learnMore')}
            </button>
          </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <ScrollRevealItem variant="fadeScale" delay={0.05}>
            <div className="card-glass text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t('hero.feature1')}</h3>
              <p className="text-gray-300 leading-relaxed">{t('hero.feature1Desc')}</p>
            </div>
          </ScrollRevealItem>
          
          <ScrollRevealItem variant="fadeScale" delay={0.1}>
            <div className="card-glass text-center">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t('hero.feature2')}</h3>
              <p className="text-gray-300 leading-relaxed">{t('hero.feature2Desc')}</p>
            </div>
          </ScrollRevealItem>
          
          <ScrollRevealItem variant="fadeScale" delay={0.15}>
            <div className="card-glass text-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t('hero.feature3')}</h3>
              <p className="text-gray-300 leading-relaxed">{t('hero.feature3Desc')}</p>
            </div>
          </ScrollRevealItem>
        </div>

        {/* 节省金额统计 */}
        <ScrollReveal variant="fadeScale" delay={0.2}>
          <div className="mt-16 glass-dark rounded-3xl p-8 md:p-12 border border-blue-500/30">
            <div className="text-center">
              <p className="text-lg md:text-xl text-gray-300 mb-4">
                {t('hero.moneySaved')}
              </p>
              <div className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 mb-2">
                $30,000+
              </div>
              <p className="text-sm md:text-base text-gray-400">
                {t('hero.moneySavedDesc')}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

