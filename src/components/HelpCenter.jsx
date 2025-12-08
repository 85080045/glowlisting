import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { HelpCircle, Search, BookOpen, MessageCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HelpCenter() {
  const { t } = useLanguage()
  const help = t('helpCenter')
  const [searchQuery, setSearchQuery] = useState('')
  const [openCategory, setOpenCategory] = useState(null)

  // Filter articles based on search
  const filteredCategories = help.categories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0)

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
                <HelpCircle className="h-16 w-16 text-blue-400" />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
                {help.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                {help.subtitle}
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={help.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 glass-dark rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal variant="slideUp">
              <h2 className="text-3xl font-bold text-white text-center mb-8">{help.quickLinks.title}</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {help.quickLinks.items.map((link, index) => (
                <ScrollRevealItem key={index} variant="fadeScale" delay={index * 0.1}>
                  <Link to={link.url}>
                    <div className="card-glass p-6 text-center hover:scale-105 transition-transform cursor-pointer">
                      <div className="flex justify-center mb-4">
                        {index === 0 && <BookOpen className="h-10 w-10 text-blue-400" />}
                        {index === 1 && <MessageCircle className="h-10 w-10 text-cyan-400" />}
                        {index === 2 && <Mail className="h-10 w-10 text-indigo-400" />}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                      <p className="text-gray-300">{link.desc}</p>
                    </div>
                  </Link>
                </ScrollRevealItem>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal variant="slideUp">
              <h2 className="text-3xl font-bold text-white text-center mb-12">{help.categoriesTitle}</h2>
            </ScrollReveal>
            <div className="space-y-6">
              {filteredCategories.map((category, categoryIndex) => (
                <ScrollRevealItem key={categoryIndex} variant="fadeScale" delay={categoryIndex * 0.1}>
                  <div className="card-glass relative">
                    <button
                      onClick={() => setOpenCategory(openCategory === categoryIndex ? null : categoryIndex)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                      {openCategory === categoryIndex ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                    
                    {openCategory === categoryIndex && (
                      <div className="px-6 pb-6 space-y-4">
                        {category.articles.map((article, articleIndex) => (
                          <div key={articleIndex} className="border-t border-gray-700 pt-4">
                            <h4 className="text-xl font-semibold text-white mb-2">{article.title}</h4>
                            <p className="text-gray-300 leading-relaxed">{article.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollRevealItem>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal variant="fadeScale">
              <div className="card-glass p-8 md:p-12 text-center relative">
                <Mail className="h-12 w-12 text-blue-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">{help.contactSupport.title}</h2>
                <p className="text-lg text-gray-300 mb-6">{help.contactSupport.content}</p>
                <a
                  href="mailto:hello@glowlisting.ai"
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>{help.contactSupport.button}</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

