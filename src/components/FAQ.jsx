import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function FAQ() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: t('faq.howToStart'),
      answer: t('faq.howToStartAns'),
    },
    {
      question: t('faq.formats'),
      answer: t('faq.formatsAns'),
    },
    {
      question: t('faq.processingTime'),
      answer: t('faq.processingTimeAns'),
    },
    {
      question: t('faq.quality'),
      answer: t('faq.qualityAns'),
    },
    {
      question: t('faq.privacy'),
      answer: t('faq.privacyAns'),
    },
    {
      question: t('faq.batch'),
      answer: t('faq.batchAns'),
    },
    {
      question: t('faq.pricing'),
      answer: t('faq.pricingAns'),
    },
    {
      question: t('faq.vsManual'),
      answer: t('faq.vsManualAns'),
    },
    {
      question: t('faq.whoFor'),
      answer: t('faq.whoForAns'),
    },
    {
      question: t('faq.notSatisfied'),
      answer: t('faq.notSatisfiedAns'),
    },
    {
      question: t('faq.devices'),
      answer: t('faq.devicesAns'),
    },
    {
      question: t('faq.contact'),
      answer: t('faq.contactAns'),
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 md:py-20 px-4 relative">
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="relative max-w-4xl mx-auto">
        <ScrollReveal variant="slideUpGlow">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
              {t('faq.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300">
              {t('faq.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <ScrollRevealItem 
              key={index}
              variant="fade"
              delay={index * 0.02}
            >
              <div
                className="glass-dark rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
              >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                <span className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
            </ScrollRevealItem>
          ))}
        </div>

        <ScrollReveal variant="fadeScale" delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              {t('faq.moreQuestions')}
            </p>
            <button className="btn-primary">
              {t('faq.contactSupport')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

