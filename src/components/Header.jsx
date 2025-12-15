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
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-200/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Camera className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">GlowListing</span>
          </Link>
          
          {/* Desktop Navigation - 参考 Motorfy 风格 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/blog" 
              className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
            >
              {t('nav.blog')}
            </Link>
            <Link 
              to="/help" 
              className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
            >
              {t('nav.support')}
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {/* 用户菜单 */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.dashboard')}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
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
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
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
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {t('auth.login')}
              </button>
            )}
            
            {/* 语言选择器 */}
            <div className="ml-2">
              <LanguageSelector />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <LanguageSelector />
            <button
              className="p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            <Link 
              to="/blog" 
              className="block text-gray-700 hover:text-gray-900 transition-colors font-medium py-2" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.blog')}
            </Link>
            <Link 
              to="/help" 
              className="block text-gray-700 hover:text-gray-900 transition-colors font-medium py-2" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.support')}
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block text-gray-700 hover:text-gray-900 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block text-red-600 hover:text-red-700 transition-colors font-medium py-2"
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
                  className="w-full text-left text-gray-700 hover:text-gray-900 transition-colors font-medium py-2 flex items-center space-x-2"
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
                className="w-full px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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

