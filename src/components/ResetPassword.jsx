import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function ResetPassword() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')

    if (!emailParam || !tokenParam) {
      setError(t('auth.invalidResetLink'))
      return
    }

    setEmail(emailParam)
    setToken(tokenParam)
  }, [searchParams, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password.length < 8) {
      setError(t('auth.passwordTooShort'))
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError(t('auth.passwordNoUppercase'))
      setLoading(false)
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError(t('auth.passwordNoSpecial'))
      setLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsNotMatch'))
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        token,
        newPassword: formData.password,
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.error || t('auth.resetPasswordFailed'))
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.resetPasswordFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="glass-dark rounded-2xl p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-gray-400 mb-6">
              {t('auth.passwordResetSuccessDesc')}
            </p>
            <p className="text-sm text-gray-500">
              {t('auth.redirectingToLogin')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="glass-dark rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('auth.invalidResetLink')}
            </h2>
            <p className="text-gray-400 mb-6">
              {t('auth.invalidResetLinkDesc')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300"
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">
            {t('auth.resetPassword')}
          </h2>
          <p className="text-gray-400">
            {t('auth.resetPasswordSubtitle')}
          </p>
        </div>

        <div className="glass-dark rounded-2xl p-8 relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.passwordRequirements')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {t('auth.processing')}
                </>
              ) : (
                t('auth.resetPassword')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}




