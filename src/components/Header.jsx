import { Camera, Menu, X, User, Coins, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { t } = useLanguage()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const userMenuRef = useRef(null)
  const location = useLocation()

  // 滚动到指定section的函数，考虑header高度
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 64 // header高度是h-16，即64px（包含顶部padding）
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // 滚动时隐藏/显示 header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        // 在顶部时始终显示
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // 向下滚动且超过 80px 时隐藏
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // 向上滚动时显示
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

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
    <header className={`sticky z-50 pt-4 px-4 transition-transform duration-300 ${
      isVisible ? 'top-0' : '-top-24'
    }`}>
      <nav className="max-w-5xl mx-auto">
        <div className="glass-dark backdrop-blur-md bg-black/20 rounded-2xl">
          <div className="flex flex-row justify-between items-center h-[70px] md:h-20 px-4 sm:px-8">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Camera className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-semibold text-white">GlowListing</span>
            </Link>
          
          {/* Desktop Navigation - 参考 Motorfy 风格：简洁短header */}
          <div className="hidden md:flex items-center space-x-7">
            <a 
              href="#detailed-features" 
              className="text-gray-300 hover:text-white transition-colors text-base font-medium cursor-pointer"
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
              className="text-gray-300 hover:text-white transition-colors text-base font-medium cursor-pointer"
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
              className="text-gray-300 hover:text-white transition-colors text-base font-medium"
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="/blog" 
              className="text-gray-300 hover:text-white transition-colors text-base font-medium"
            >
              {t('nav.blog')}
            </Link>
            <a 
              href="#faq" 
              className="text-gray-300 hover:text-white transition-colors text-base font-medium cursor-pointer"
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
            <Link 
              to="/help" 
              className="text-gray-300 hover:text-white transition-colors text-base font-medium"
            >
              {t('nav.support')}
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {/* 用户菜单 */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-dark rounded-lg shadow-xl py-2 z-50">
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.dashboard')}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors"
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
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-2"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {t('auth.login')}
              </button>
            )}
          </div>

          {/* Mobile menu button and login */}
          <div className="md:hidden flex items-center space-x-2 flex-shrink-0">
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium whitespace-nowrap"
              >
                {t('auth.login')}
              </button>
            )}
            <button
              className="p-1.5 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-1 px-4 sm:px-6">
            <a 
              href="#detailed-features" 
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3 cursor-pointer"
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
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3 cursor-pointer"
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
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="/blog" 
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.blog')}
            </Link>
            <a 
              href="#faq" 
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3 cursor-pointer"
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
            <Link 
              to="/help" 
              className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.support')}
            </Link>
            
            {user ? (
              <>
                <div className="px-2 py-3">
                  <p className="text-base font-medium text-white">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <Link 
                  to="/dashboard" 
                  className="block text-gray-300 hover:text-white transition-colors text-base font-medium py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block text-red-400 hover:text-red-300 transition-colors text-base font-medium py-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left text-gray-300 hover:text-white transition-colors text-base font-medium py-3 flex items-center space-x-2"
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
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base font-medium text-center"
              >
                {t('auth.login')}
              </button>
            )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

