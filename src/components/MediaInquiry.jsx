import { Mail, Phone, MessageSquare, FileText, Calendar, Globe } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'

export default function MediaInquiry() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    mediaType: '',
    subject: '',
    message: '',
    deadline: ''
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
    console.log('Media inquiry submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: '',
        email: '',
        organization: '',
        mediaType: '',
        subject: '',
        message: '',
        deadline: ''
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
                <div className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full mb-6">
                  <span className="text-blue-400 text-sm font-medium">Media & Press</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  {t('mediaInquiry.title')}
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  {t('mediaInquiry.subtitle')}
                </p>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Contact Information */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollRevealItem>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-blue-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{t('mediaInquiry.emailTitle')}</h3>
                    <a href="mailto:hello@glowlisting.ai" className="text-blue-400 hover:text-blue-300">
                      hello@glowlisting.ai
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Phone className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{t('mediaInquiry.phoneTitle')}</h3>
                    <a href="tel:+1234567890" className="text-green-400 hover:text-green-300">
                      +1 (234) 567-8900
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6 text-center">
                    <div className="bg-purple-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{t('mediaInquiry.responseTime')}</h3>
                    <p className="text-gray-300">{t('mediaInquiry.responseTimeDesc')}</p>
                  </div>
                </div>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Inquiry Form */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <ScrollRevealItem>
                <div className="glass-dark rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-6">{t('mediaInquiry.formTitle')}</h2>
                  
                  {submitted ? (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-6 py-4 rounded-lg mb-6">
                      {t('mediaInquiry.submitSuccess')}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('mediaInquiry.name')} *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t('mediaInquiry.namePlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('mediaInquiry.email')} *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t('mediaInquiry.emailPlaceholder')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('mediaInquiry.organization')} *
                          </label>
                          <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t('mediaInquiry.organizationPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('mediaInquiry.mediaType')} *
                          </label>
                          <select
                            name="mediaType"
                            value={formData.mediaType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">{t('mediaInquiry.selectMediaType')}</option>
                            <option value="print">{t('mediaInquiry.print')}</option>
                            <option value="online">{t('mediaInquiry.online')}</option>
                            <option value="broadcast">{t('mediaInquiry.broadcast')}</option>
                            <option value="blog">{t('mediaInquiry.blog')}</option>
                            <option value="podcast">{t('mediaInquiry.podcast')}</option>
                            <option value="other">{t('mediaInquiry.other')}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('mediaInquiry.subject')} *
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('mediaInquiry.subjectPlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('mediaInquiry.message')} *
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder={t('mediaInquiry.messagePlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('mediaInquiry.deadline')}
                        </label>
                        <input
                          type="date"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full btn-primary"
                      >
                        {t('mediaInquiry.submit')}
                      </button>
                    </form>
                  )}
                </div>
              </ScrollRevealItem>
            </div>
          </section>

          {/* Resources Section */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollRevealItem>
                <h2 className="text-3xl font-bold text-white text-center mb-12">
                  {t('mediaInquiry.resourcesTitle')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{t('mediaInquiry.pressKit')}</h3>
                    </div>
                    <p className="text-gray-300 mb-4">{t('mediaInquiry.pressKitDesc')}</p>
                    <a href="#" className="text-blue-400 hover:text-blue-300 flex items-center space-x-2">
                      <span>{t('mediaInquiry.download')}</span>
                      <FileText className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <Globe className="h-6 w-6 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{t('mediaInquiry.brandAssets')}</h3>
                    </div>
                    <p className="text-gray-300 mb-4">{t('mediaInquiry.brandAssetsDesc')}</p>
                    <a href="#" className="text-green-400 hover:text-green-300 flex items-center space-x-2">
                      <span>{t('mediaInquiry.download')}</span>
                      <Globe className="h-4 w-4" />
                    </a>
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

