import { Camera, Menu, X, User, Coins, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import LanguageSelector from './LanguageSelector'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { t } = useLanguage()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const userMenuRef = useRef(null)
  const location = useLocation()

  // 滚动到指定section的函数，考虑header高度
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 64 // header高度是h-16，即64px
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  return (
    <header className="glass-dark shadow-lg sticky top-0 z-50 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <Link 
              to="/" 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Camera className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
              <span className="text-xl md:text-2xl font-bold text-white">GlowListing</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="#detailed-features" 
              className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                if (location.pathname === '/') {
                  scrollToSection('detailed-features')
                } else {
                  navigate('/#detailed-features')
                }
              }}
            >
              {t('nav.features')}
            </a>
            <a 
              href="#pricing" 
              className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                if (location.pathname === '/') {
                  scrollToSection('pricing')
                } else {
                  navigate('/#pricing')
                }
              }}
            >
              {t('nav.pricing')}
            </a>
            <Link 
              to="/about" 
              className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="/blog" 
              className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              {t('nav.blog')}
            </Link>
            <a 
              href="#faq" 
              className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                if (location.pathname === '/') {
                  scrollToSection('faq')
                } else {
                  navigate('/#faq')
                }
              }}
            >
              {t('nav.faq')}
            </a>
            
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* 用户菜单 */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <User className="h-5 w-5 text-gray-300" />
                      <span className="text-sm font-medium text-gray-100">{user.name}</span>
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t('nav.dashboard')}
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-red-300 hover:bg-gray-700 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t('nav.admin')}
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout()
                            setUserMenuOpen(false)
                            navigate('/')
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                {t('auth.login')}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a 
              href="#detailed-features" 
              className="block text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                if (location.pathname === '/') {
                  scrollToSection('detailed-features')
                } else {
                  navigate('/#detailed-features')
                }
              }}
            >
              {t('nav.features')}
            </a>
            <a 
              href="#pricing" 
              className="block text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                if (location.pathname === '/') {
                  scrollToSection('pricing')
                } else {
                  navigate('/#pricing')
                }
              }}
            >
              {t('nav.pricing')}
            </a>
            <Link 
              to="/about" 
              className="block text-gray-300 hover:text-blue-400 transition-colors cursor-pointer" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="/blog" 
              className="block text-gray-300 hover:text-blue-400 transition-colors cursor-pointer" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.blog')}
            </Link>
            <a 
              href="#faq" 
              className="block text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                if (location.pathname === '/') {
                  scrollToSection('faq')
                } else {
                  navigate('/#faq')
                }
              }}
            >
              {t('nav.faq')}
            </a>
            
            {user ? (
              <>
                <Link to="/dashboard" className="block text-gray-300 hover:text-blue-400 transition-colors">{t('nav.dashboard')}</Link>
                {isAdmin && (
                  <Link to="/admin" className="block text-red-300 hover:text-red-400 transition-colors">{t('nav.admin')}</Link>
                )}
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}
                className="btn-primary w-full"
              >
                {t('auth.login')}
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

