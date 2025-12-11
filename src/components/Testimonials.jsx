import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function Testimonials() {
  const { t } = useLanguage()
  const testimonials = t('testimonials.list').map(item => ({
    ...item,
    rating: 5,
  }))

  return (
    <section id="testimonials" className="py-16 md:py-20 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300">
              {t('testimonials.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <ScrollRevealItem 
              key={index} 
              variant="fadeScale"
              delay={index * 0.05}
            >
              <div className="card-glass group hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
              <div className="border-t border-gray-700 pt-4">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
                {testimonial.company && (
                  <p className="text-xs text-gray-500 mt-1">{testimonial.company}</p>
                )}
              </div>
            </div>
            </ScrollRevealItem>
          ))}
        </div>
        
        <ScrollReveal variant="fadeScale" delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6 text-base sm:text-lg">
              {t('testimonials.trustedBy')}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 sm:gap-10 opacity-90">
              <div className="text-center">
                <ScrollRevealItem variant="countUp" delay={0.4}>
                  <div className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 leading-tight">1000+</div>
                </ScrollRevealItem>
                <div className="text-sm sm:text-base text-gray-300 mt-1">{t('testimonials.companies')}</div>
              </div>
              <div className="text-center">
                <ScrollRevealItem variant="countUp" delay={0.5}>
                  <div className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 leading-tight">5000+</div>
                </ScrollRevealItem>
                <div className="text-sm sm:text-base text-gray-300 mt-1">{t('testimonials.photographers')}</div>
              </div>
              <div className="text-center">
                <ScrollRevealItem variant="countUp" delay={0.6}>
                  <div className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 leading-tight">10000+</div>
                </ScrollRevealItem>
                <div className="text-sm sm:text-base text-gray-300 mt-1">{t('testimonials.agents')}</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

