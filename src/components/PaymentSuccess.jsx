import { CheckCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Header from './Header'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="glass-dark rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white">{t('payment.successTitle')}</h1>
          <p className="text-gray-300">{t('payment.successDesc')}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center justify-center space-x-2 w-full"
          >
            <span>{t('payment.goDashboard')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}




