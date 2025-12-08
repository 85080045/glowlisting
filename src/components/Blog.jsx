import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useParams, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal'
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react'

export default function Blog() {
  const { t } = useLanguage()
  const { postId } = useParams()
  const blog = t('blog')

  // If viewing a specific post
  if (postId) {
    const post = blog.posts.find(p => p.id === parseInt(postId))
    if (!post) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
          <Header />
          <main className="flex-grow flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
              <Link to="/blog" className="text-blue-400 hover:text-blue-300">Back to Blog</Link>
            </div>
          </main>
          <Footer />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
        <Header />
        <main className="flex-grow">
          <article className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <Link to="/blog" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
                <ArrowLeft className="h-5 w-5" />
                <span>{blog.backToBlog}</span>
              </Link>
              
              <ScrollReveal variant="fadeScale">
                <div className="card-glass p-8 md:p-12 relative">
                  <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-5 w-5" />
                      <span>{post.category}</span>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    {post.title}
                  </h1>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    )
  }

  // Blog listing page
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
                {blog.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                {blog.subtitle}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blog.posts.map((post, index) => (
                <ScrollRevealItem key={post.id} variant="fadeScale" delay={index * 0.1}>
                  <Link to={`/blog/${post.id}`}>
                    <div className="card-glass p-6 h-full flex flex-col hover:scale-105 transition-transform duration-300 cursor-pointer relative">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{post.author}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                          {post.category}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-white mb-4 line-clamp-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-300 mb-6 flex-grow line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="text-blue-400 font-semibold flex items-center space-x-2">
                        <span>{blog.readMore}</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
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

