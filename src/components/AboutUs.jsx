import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { Target, Lightbulb, Users, Award, TrendingUp, Image as ImageIcon, Building2, Heart } from 'lucide-react'

export default function AboutUs() {
  const { t } = useLanguage()
  const about = t('aboutUs')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 tech-grid opacity-10"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <ScrollReveal variant="fadeScale">
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
                {about.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                {about.subtitle}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal variant="slideUp">
              <div className="card-glass p-8 md:p-12">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{about.mission.title}</h2>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{about.mission.content}</p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal variant="slideUp">
              <div className="card-glass p-8 md:p-12">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center">
                    <Lightbulb className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{about.story.title}</h2>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{about.story.content}</p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal variant="slideUp">
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
                {about.values.title}
              </h2>
              {about.values.subtitle && (
                <div className="max-w-4xl mx-auto mb-12">
                  <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{about.values.subtitle}</p>
                </div>
              )}
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScrollRevealItem variant="fadeScale" delay={0.05}>
                <div className="card-glass p-6">
                  <Award className="h-10 w-10 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{about.values.quality.title}</h3>
                  <p className="text-gray-300">{about.values.quality.desc}</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.1}>
                <div className="card-glass p-6">
                  <TrendingUp className="h-10 w-10 text-cyan-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{about.values.innovation.title}</h3>
                  <p className="text-gray-300">{about.values.innovation.desc}</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.15}>
                <div className="card-glass p-6">
                  <Users className="h-10 w-10 text-indigo-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{about.values.accessibility.title}</h3>
                  <p className="text-gray-300">{about.values.accessibility.desc}</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.2}>
                <div className="card-glass p-6">
                  <Heart className="h-10 w-10 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{about.values.reliability.title}</h3>
                  <p className="text-gray-300">{about.values.reliability.desc}</p>
                </div>
              </ScrollRevealItem>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal variant="slideUp">
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
                {about.team.title}
              </h2>
              {about.team.members && about.team.members.length > 0 ? (
                <p className="text-xl text-gray-300 text-center mb-12">
                  {about.team.subtitle}
                </p>
              ) : null}
            </ScrollReveal>
            {about.team.members && about.team.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {about.team.members.map((member, index) => (
                  <ScrollRevealItem key={index} variant="fadeScale" delay={index * 0.1}>
                    <div className="card-glass p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                          <p className="text-blue-400 font-semibold mb-3">{member.role}</p>
                          <p className="text-gray-300 leading-relaxed">{member.bio}</p>
                        </div>
                      </div>
                    </div>
                  </ScrollRevealItem>
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <ScrollReveal variant="slideUp">
                  <div className="card-glass p-8 md:p-12">
                    <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{about.team.subtitle}</p>
                  </div>
                </ScrollReveal>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal variant="slideUp">
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
                {about.stats.title}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ScrollRevealItem variant="fadeScale" delay={0.05}>
                <div className="card-glass p-6 text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-blue-400 mb-2">{about.stats.users}</div>
                  <div className="text-gray-300">{about.stats.usersDesc}</div>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.1}>
                <div className="card-glass p-6 text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-cyan-400 mb-2">{about.stats.photos}</div>
                  <div className="text-gray-300">{about.stats.photosDesc}</div>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.15}>
                <div className="card-glass p-6 text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-indigo-400 mb-2">{about.stats.companies}</div>
                  <div className="text-gray-300">{about.stats.companiesDesc}</div>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem variant="fadeScale" delay={0.2}>
                <div className="card-glass p-6 text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-purple-400 mb-2">{about.stats.satisfaction}</div>
                  <div className="text-gray-300">{about.stats.satisfactionDesc}</div>
                </div>
              </ScrollRevealItem>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}


