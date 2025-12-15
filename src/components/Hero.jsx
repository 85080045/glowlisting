import { Sparkles, ShieldCheck, Lock, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function Hero() {
  const { t } = useLanguage()
  
  // Hero 对比图片 - 使用房地产相关的图片
  const heroBeforeImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80&auto=format'
  const heroAfterImage = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80&auto=format'
  
  return (
    <section className="relative pt-0 pb-16 md:pb-20 px-4 overflow-visible min-h-screen flex items-center" style={{ marginTop: '-80px', paddingTop: '80px' }}>
      {/* 全屏渐变背景动画 - 参考科技公司设计，从页面顶部开始 */}
      <div className="absolute top-0 left-0 right-0 w-full z-0" style={{ top: '-80px', height: '100vh', minHeight: '100vh' }}>
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
      
      <div className="relative max-w-7xl mx-auto z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 左侧：Before/After Slider */}
          <ScrollReveal variant="fadeScale" delay={0}>
            <div className="w-full">
              <BeforeAfterSlider
                beforeImage={heroBeforeImage}
                afterImage={heroAfterImage}
                aspectRatio="4/3"
                objectFit="cover"
                className="shadow-2xl"
              />
            </div>
          </ScrollReveal>
          
          {/* 右侧：文字内容 */}
          <div className="text-left lg:text-left">
            <ScrollReveal variant="fadeScale" delay={0}>
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <span>{t('hero.badge')}</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal variant="slideUp" delay={0.05}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 md:mb-8 leading-tight">
                {t('hero.title')}
                <br />
                <span className="gradient-text">{t('hero.titleHighlight')}</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal variant="fade" delay={0.1}>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-10 leading-relaxed">
                {t('hero.description')}
              </p>
            </ScrollReveal>
            
            {/* Trust Badges */}
            <ScrollReveal variant="fade" delay={0.12}>
              <div className="mt-8 flex flex-col space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 text-[11px] md:text-xs tracking-[0.25em] uppercase w-fit">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{t('hero.trustTitle')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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
          </div>
        </div>
      </div>
    </section>
  )
}

