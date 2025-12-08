import { Sparkles, Zap, Camera, DollarSign, Clock, Smartphone } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function Features() {
  const { t } = useLanguage()
  
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: t('features.aiEnhance'),
      description: t('features.aiEnhanceDesc'),
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: t('features.professional'),
      description: t('features.professionalDesc'),
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: t('features.smartphone'),
      description: t('features.smartphoneDesc'),
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t('features.fastProcessing'),
      description: t('features.fastProcessingDesc'),
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: t('features.saveCosts'),
      description: t('features.saveCostsDesc'),
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: t('features.batchProcessing'),
      description: t('features.batchProcessingDesc'),
    },
  ]

  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-20"></div>
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('features.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('features.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollRevealItem 
              key={index} 
              variant="fadeScale"
              delay={index * 0.05}
            >
              <div className="card-glass group hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:shadow-xl transition-shadow mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-white text-center">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base text-center">{feature.description}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fade" delay={0.1}>
          <div className="mt-20 bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 rounded-3xl p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden border border-blue-500/30">
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-extrabold mb-8">{t('features.forEveryone')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <ScrollRevealItem variant="fadeScale" delay={0.05}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h4 className="text-2xl font-bold mb-3">{t('features.agents')}</h4>
                    <p className="text-blue-100 leading-relaxed">{t('features.agentsDesc')}</p>
                  </div>
                </ScrollRevealItem>
                <ScrollRevealItem variant="fadeScale" delay={0.1}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h4 className="text-2xl font-bold mb-3">{t('features.airbnb')}</h4>
                    <p className="text-blue-100 leading-relaxed">{t('features.airbnbDesc')}</p>
                  </div>
                </ScrollRevealItem>
                <ScrollRevealItem variant="fadeScale" delay={0.15}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h4 className="text-2xl font-bold mb-3">{t('features.renters')}</h4>
                    <p className="text-blue-100 leading-relaxed">{t('features.rentersDesc')}</p>
                  </div>
                </ScrollRevealItem>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

