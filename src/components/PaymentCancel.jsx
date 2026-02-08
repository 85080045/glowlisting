import { XCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'

export default function PaymentCancel() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="glass-dark rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white">{t('payment.cancelTitle')}</h1>
          <p className="text-gray-300">{t('payment.cancelDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/pricing')}
              className="btn-primary inline-flex items-center justify-center space-x-2 w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('payment.backPricing')}</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary w-full"
            >
              {t('payment.goDashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




