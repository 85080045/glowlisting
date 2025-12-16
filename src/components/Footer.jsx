import { Camera } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Camera className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">GlowListing</span>
            </Link>
            <p className="text-sm text-gray-400">
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.features')}</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.pricing')}</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.faq')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.help')}</Link></li>
              <li><a href="mailto:hello@glowlisting.ai" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.contact')}</a></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.privacy')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.about')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.aboutUs')}</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.blog')}</Link></li>
              <li><Link to="/reviews" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.reviews')}</Link></li>
              <li><Link to="/media" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.media')}</Link></li>
              <li><Link to="/investors" className="text-gray-400 hover:text-blue-400 transition-colors">{t('footer.links.investors')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">{t('footer.copyright')}</p>
          <LanguageSelector />
        </div>
      </div>
    </footer>
  )
}

