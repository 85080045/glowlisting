import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { Shield, Lock, Eye, FileText, Mail } from 'lucide-react'

export default function PrivacyPolicy() {
  const { t } = useLanguage()
  const privacy = t('privacyPolicy')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 tech-grid opacity-10"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <ScrollReveal variant="fadeScale">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-16 w-16 text-blue-400" />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
                {privacy.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
                {privacy.lastUpdated}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal variant="fadeScale">
              <div className="card-glass p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-400" />
                    <span>{privacy.intro.title}</span>
                  </h2>
                  <p className="text-gray-300 leading-relaxed">{privacy.intro.content}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center space-x-3">
                    <Eye className="h-8 w-8 text-cyan-400" />
                    <span>{privacy.dataCollection.title}</span>
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-4">{privacy.dataCollection.content}</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    {privacy.dataCollection.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center space-x-3">
                    <Lock className="h-8 w-8 text-indigo-400" />
                    <span>{privacy.dataUse.title}</span>
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-4">{privacy.dataUse.content}</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    {privacy.dataUse.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.dataStorage.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{privacy.dataStorage.content}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.dataSecurity.title}</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">{privacy.dataSecurity.content}</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    {privacy.dataSecurity.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.userRights.title}</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">{privacy.userRights.content}</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    {privacy.userRights.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.cookies.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{privacy.cookies.content}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.thirdParty.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{privacy.thirdParty.content}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{privacy.changes.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{privacy.changes.content}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center space-x-3">
                    <Mail className="h-8 w-8 text-purple-400" />
                    <span>{privacy.contact.title}</span>
                  </h2>
                  <p className="text-gray-300 leading-relaxed">
                    {privacy.contact.content}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}


