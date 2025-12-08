import { Image, Layers, Sun, Palette, Maximize2, Lightbulb, FileImage, Shield, Sparkles } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function DetailedFeatures() {
  const { t } = useLanguage()
  
  const detailedFeatures = [
    {
      icon: <Layers className="h-8 w-8" />,
      title: t('detailedFeatures.hdr.title'),
      description: t('detailedFeatures.hdr.desc'),
      beforeAfter: true,
    },
    {
      icon: <Maximize2 className="h-8 w-8" />,
      title: t('detailedFeatures.windowPull.title'),
      description: t('detailedFeatures.windowPull.desc'),
      beforeAfter: true,
    },
    {
      icon: <Sun className="h-8 w-8" />,
      title: t('detailedFeatures.skyReplacement.title'),
      description: t('detailedFeatures.skyReplacement.desc'),
      beforeAfter: true,
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: t('detailedFeatures.whiteBalance.title'),
      description: t('detailedFeatures.whiteBalance.desc'),
      beforeAfter: true,
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: t('detailedFeatures.perspective.title'),
      description: t('detailedFeatures.perspective.desc'),
      beforeAfter: true,
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: t('detailedFeatures.relighting.title'),
      description: t('detailedFeatures.relighting.desc'),
      beforeAfter: true,
    },
    {
      icon: <FileImage className="h-8 w-8" />,
      title: t('detailedFeatures.raw.title'),
      description: t('detailedFeatures.raw.desc'),
      beforeAfter: false,
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('detailedFeatures.privacy.title'),
      description: t('detailedFeatures.privacy.desc'),
      beforeAfter: true,
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: t('detailedFeatures.colorCorrection.title'),
      description: t('detailedFeatures.colorCorrection.desc'),
      beforeAfter: true,
    },
  ]

  return (
    <section id="detailed-features" className="py-24 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('detailedFeatures.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('detailedFeatures.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-16">
          {detailedFeatures.map((feature, index) => (
            <ScrollRevealItem 
              key={index}
              variant="fadeScale"
              delay={index * 0.05}
            >
              <div 
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8`}
              >
              <div className="flex-1 text-center lg:text-left">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg mx-auto lg:mx-0">
                  {feature.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
              
              <div className="flex-1 w-full">
                {feature.beforeAfter ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="glass-dark rounded-lg p-4 mb-2 text-sm text-gray-400 text-center">
                        {t('detailedFeatures.before')}
                      </div>
                      <div className="aspect-video glass-dark rounded-lg flex items-center justify-center">
                        <Image className="h-16 w-16 text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-2 text-sm text-blue-300 text-center font-semibold">
                        {t('detailedFeatures.after')}
                      </div>
                      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                        <Sparkles className="h-16 w-16 text-blue-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
                    <div className="text-center">
                      <FileImage className="h-16 w-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">{t('detailedFeatures.demoImage')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fadeScale" delay={0.3}>
          <div className="mt-16 text-center">
            <button className="btn-primary text-lg px-8 py-4">
              {t('detailedFeatures.viewAll')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

