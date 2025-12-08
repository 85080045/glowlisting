import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { Star, CheckCircle, ThumbsUp, Filter } from 'lucide-react'

export default function Reviews() {
  const { t } = useLanguage()
  const reviews = t('reviews')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  // Calculate average rating
  const avgRating = reviews.reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviews.reviewsList.length

  // Filter and sort reviews
  let filteredReviews = [...reviews.reviewsList]
  
  if (filter !== 'all') {
    filteredReviews = filteredReviews.filter(r => {
      if (filter === 'agents') return r.role.toLowerCase().includes('agent')
      if (filter === 'photographers') return r.role.toLowerCase().includes('photographer')
      if (filter === 'companies') return r.role.toLowerCase().includes('ceo') || r.company.toLowerCase().includes('group')
      if (filter === 'airbnb') return r.role.toLowerCase().includes('host')
      return true
    })
  }

  if (sortBy === 'highest') {
    filteredReviews.sort((a, b) => b.rating - a.rating)
  } else if (sortBy === 'lowest') {
    filteredReviews.sort((a, b) => a.rating - b.rating)
  } else {
    filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

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
                {reviews.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                {reviews.subtitle}
              </p>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-5xl font-extrabold text-white">{avgRating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {reviews.overallRating} • {reviews.basedOn} {reviews.reviewsList.length} {reviews.reviews}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300 font-semibold">{reviews.filter.all}:</span>
                {Object.entries(reviews.filter).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === key
                        ? 'bg-blue-500 text-white'
                        : 'glass-dark text-gray-300 hover:bg-black/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-gray-300 font-semibold">{reviews.sortBy}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-dark text-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">{reviews.newest}</option>
                  <option value="highest">{reviews.highest}</option>
                  <option value="lowest">{reviews.lowest}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews List */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              {filteredReviews.map((review, index) => (
                <ScrollRevealItem key={review.id} variant="fadeScale" delay={index * 0.05}>
                  <div className="card-glass p-6 md:p-8 relative">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-12 h-12 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{review.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xl font-bold text-white">{review.name}</h3>
                              {review.verified && (
                                <CheckCircle className="h-5 w-5 text-blue-400" title={reviews.verified} />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {review.role} {review.company && `• ${review.company}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3 md:mb-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-4">{review.content}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{review.helpful} {reviews.helpful}</span>
                      </div>
                    </div>
                  </div>
                </ScrollRevealItem>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

