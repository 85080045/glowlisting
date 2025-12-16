import { Sparkles, Upload, Zap } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function Hero() {
  const { t } = useLanguage()
  
  return (
    <section className="relative pt-8 pb-20 md:pb-24 px-4 overflow-visible min-h-screen flex items-center">
      {/* 全屏渐变背景动画 - 参考科技公司设计，从页面顶部开始 */}
      <div className="absolute top-0 left-0 right-0 w-full z-0 h-full min-h-screen">
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
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-16 md:mb-20 max-w-4xl mx-auto leading-relaxed px-4">
            {t('hero.description')}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          <ScrollRevealItem variant="fadeScale" delay={0.05}>
            <div className="card-glass text-center p-8">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-white">{t('hero.feature1')}</h3>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">{t('hero.feature1Desc')}</p>
            </div>
          </ScrollRevealItem>
          
          <ScrollRevealItem variant="fadeScale" delay={0.1}>
            <div className="card-glass text-center p-8">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Upload className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-white">{t('hero.feature2')}</h3>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">{t('hero.feature2Desc')}</p>
            </div>
          </ScrollRevealItem>
          
          <ScrollRevealItem variant="fadeScale" delay={0.15}>
            <div className="card-glass text-center p-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-white">{t('hero.feature3')}</h3>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">{t('hero.feature3Desc')}</p>
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

