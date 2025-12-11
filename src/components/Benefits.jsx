import { TrendingUp, DollarSign, Clock, Users } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function Benefits() {
  const { t } = useLanguage()
  
  const benefits = [
    {
      icon: <TrendingUp className="h-12 w-12" />,
      title: t('benefits.higherQuality'),
      description: t('benefits.higherQualityDesc'),
    },
    {
      icon: <DollarSign className="h-12 w-12" />,
      title: t('benefits.reduceCosts'),
      description: t('benefits.reduceCostsDesc'),
    },
    {
      icon: <Clock className="h-12 w-12" />,
      title: t('benefits.scaleQuickly'),
      description: t('benefits.scaleQuicklyDesc'),
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: t('benefits.trustedBy'),
      description: t('benefits.trustedByDesc'),
    },
  ]

  return (
    <section className="py-16 md:py-20 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-20"></div>
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('benefits.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('benefits.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <ScrollRevealItem 
              key={index} 
              variant="fadeScale"
              delay={index * 0.05}
            >
              <div className="card-glass group hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-primary-500 to-blue-500 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:shadow-xl transition-shadow mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 text-center">
                  {benefit.title}
                </h3>
                <p className="text-gray-300 leading-relaxed text-base md:text-lg text-center">
                  {benefit.description}
                </p>
              </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fade" delay={0.1}>
          <div className="mt-20 glass-dark rounded-3xl p-10 md:p-16">
            <div className="text-center">
              <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                {t('benefits.faster')}
              </h3>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                {t('benefits.fasterDesc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <ScrollRevealItem variant="fadeScale" delay={0.05}>
                  <div className="text-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl border border-blue-400/30">
                    <div className="text-6xl font-extrabold mb-3">{t('benefits.seconds')}</div>
                    <div className="text-xl font-semibold text-blue-100">{t('benefits.aiProcessing')}</div>
                  </div>
                </ScrollRevealItem>
                <ScrollRevealItem variant="fadeScale" delay={0.1}>
                  <div className="text-center glass-dark rounded-2xl p-8">
                    <div className="text-6xl font-extrabold text-gray-500 mb-3">{t('benefits.hours')}</div>
                    <div className="text-xl font-semibold text-gray-400">{t('benefits.manualEditing')}</div>
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

