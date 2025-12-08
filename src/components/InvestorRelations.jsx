import { TrendingUp, DollarSign, BarChart, FileText, Mail, Calendar, Download, Users, Globe } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function InvestorRelations() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: 实际发送邮件或提交到后端
    console.log('Investor inquiry submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: '',
        email: '',
        company: '',
        inquiryType: '',
        message: ''
      })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <main className="flex-grow">
        <ScrollReveal>
          {/* Hero Section */}
          <section className="py-24 px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollRevealItem>
                <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full mb-6">
                  <span className="text-green-400 text-sm font-medium">Investor Relations</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  {t('investorRelations.title')}
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  {t('investorRelations.subtitle')}
                </p>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Key Metrics */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollRevealItem>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-blue-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">$2.5M+</h3>
                    <p className="text-gray-400 text-sm">{t('investorRelations.totalRevenue')}</p>
                  </div>
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">50K+</h3>
                    <p className="text-gray-400 text-sm">{t('investorRelations.activeUsers')}</p>
                  </div>
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-yellow-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BarChart className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">150%</h3>
                    <p className="text-gray-400 text-sm">{t('investorRelations.growthRate')}</p>
                  </div>
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-purple-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">25+</h3>
                    <p className="text-gray-400 text-sm">{t('investorRelations.countries')}</p>
                  </div>
                </div>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Financial Documents */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollRevealItem>
                <h2 className="text-3xl font-bold text-white text-center mb-12">
                  {t('investorRelations.financialDocuments')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{t('investorRelations.annualReport')}</h3>
                        <p className="text-sm text-gray-400">2024</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm">{t('investorRelations.annualReportDesc')}</p>
                    <a href="#" className="text-blue-400 hover:text-blue-300 flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>{t('investorRelations.download')}</span>
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <BarChart className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{t('investorRelations.quarterlyReport')}</h3>
                        <p className="text-sm text-gray-400">Q4 2024</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm">{t('investorRelations.quarterlyReportDesc')}</p>
                    <a href="#" className="text-green-400 hover:text-green-300 flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>{t('investorRelations.download')}</span>
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-yellow-500/20 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{t('investorRelations.investorDeck')}</h3>
                        <p className="text-sm text-gray-400">{t('investorRelations.latest')}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm">{t('investorRelations.investorDeckDesc')}</p>
                    <a href="#" className="text-yellow-400 hover:text-yellow-300 flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>{t('investorRelations.download')}</span>
                    </a>
                  </div>
                </div>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Contact Form */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <ScrollRevealItem>
                <div className="glass-dark rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-6">{t('investorRelations.contactTitle')}</h2>
                  
                  {submitted ? (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-6 py-4 rounded-lg mb-6">
                      {t('investorRelations.submitSuccess')}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('investorRelations.name')} *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={t('investorRelations.namePlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('investorRelations.email')} *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={t('investorRelations.emailPlaceholder')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('investorRelations.company')} *
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={t('investorRelations.companyPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('investorRelations.inquiryType')} *
                          </label>
                          <select
                            name="inquiryType"
                            value={formData.inquiryType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">{t('investorRelations.selectInquiryType')}</option>
                            <option value="investment">{t('investorRelations.investment')}</option>
                            <option value="partnership">{t('investorRelations.partnership')}</option>
                            <option value="financial">{t('investorRelations.financial')}</option>
                            <option value="other">{t('investorRelations.other')}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('investorRelations.message')} *
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          placeholder={t('investorRelations.messagePlaceholder')}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full btn-primary"
                      >
                        {t('investorRelations.submit')}
                      </button>
                    </form>
                  )}
                </div>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Contact Information */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollRevealItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <Mail className="h-6 w-6 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{t('investorRelations.emailTitle')}</h3>
                    </div>
                    <a href="mailto:hello@glowlisting.ai" className="text-green-400 hover:text-green-300">
                      hello@glowlisting.ai
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{t('investorRelations.scheduleTitle')}</h3>
                    </div>
                    <p className="text-gray-300">{t('investorRelations.scheduleDesc')}</p>
                  </div>
                </div>
              </ScrollRevealItem>
            </div>
          </section>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  )
}

