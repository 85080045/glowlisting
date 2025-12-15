import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { ChevronDown } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
]

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
        aria-label="Select language"
      >
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 glass-dark rounded-lg shadow-xl border border-white/10 py-2 min-w-[150px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                language === lang.code ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300'
              }`}
            >
              <span className="text-sm font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-blue-300">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

