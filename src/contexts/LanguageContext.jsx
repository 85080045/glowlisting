import { createContext, useContext, useState, useEffect } from 'react'
import { en } from '../locales/en'
import { zh } from '../locales/zh'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

const translations = {
  en,
  zh,
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // 从 localStorage 读取保存的语言，默认为英文
    const savedLanguage = localStorage.getItem('glowlisting_language') || 'en'
    return savedLanguage
  })

  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('glowlisting_language', lang)
  }

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`)
        return key
      }
    }
    
    // 如果 value 是字符串且有参数，进行替换
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      let result = value
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue))
      }
      return result
    }
    
    return value
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}


