import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { LogIn, Mail, Lock, User, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const RECAPTCHA_SITE_KEY = '6Lf9lyQsAAAAAMNbhrVKxqNpNsb3jVFRA-daHyNU'

export default function Login() {
  const { t, language } = useLanguage()
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const recaptchaRef = useRef(null)

  // 错误信息映射函数，将后端错误转换为友好的提示
  const getFriendlyError = (errorMessage) => {
    if (!errorMessage) return t('auth.loginFailed')
    
    const errorLower = errorMessage.toLowerCase()
    
    // 映射常见错误
    if (errorLower.includes('invalid credentials') || 
        errorLower.includes('email or password is incorrect') ||
        errorLower.includes('incorrect')) {
      return t('auth.invalidCredentials')
    }
    
    if (errorLower.includes('user already exists') || 
        errorLower.includes('already exists')) {
      return t('auth.userExists')
    }
    
    if (errorLower.includes('email and password are required') ||
        errorLower.includes('please enter both')) {
      return t('auth.fillAllFields')
    }
    
    if (errorLower.includes('verification code') || 
        errorLower.includes('verification')) {
      return t('auth.verificationCodeRequired')
    }
    
    // 如果是401错误，统一显示为凭据错误
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return t('auth.invalidCredentials')
    }
    
    // 其他错误直接显示，但确保是友好的
    return errorMessage
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isLogin) {
      // 注册验证
      if (!formData.name || !formData.email || !formData.password) {
        setError(t('auth.fillAllFields'))
        setLoading(false)
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('auth.passwordsNotMatch'))
        setLoading(false)
        return
      }
      // 密码验证：8位以上，至少一个大写字母和一个符号
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
      // 检查验证码
      if (!formData.verificationCode) {
        setError(t('auth.verificationCodeRequired'))
        setLoading(false)
        return
      }
      // 检查 reCAPTCHA
      if (!recaptchaToken) {
        setError(t('auth.recaptchaRequired'))
        setLoading(false)
        return
      }
    } else {
      // 登录验证
      if (!formData.email || !formData.password) {
        setError(t('auth.fillAllFields'))
        setLoading(false)
        return
      }
    }

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        result = await register(formData.name, formData.email, formData.password, formData.verificationCode, recaptchaToken)
      }

      if (result.success) {
        // 检查是否有重定向
        const redirect = searchParams.get('redirect')
        if (redirect === 'upload') {
          navigate('/')
        } else {
          navigate('/dashboard')
        }
      } else {
        // 使用友好的错误信息映射
        setError(getFriendlyError(result.error))
      }
    } catch (err) {
      // 使用友好的错误信息映射
      const errorMsg = err.response?.data?.error || err.message
      setError(getFriendlyError(errorMsg))
    } finally {
      setLoading(false)
    }
  }

  // 检查是否有重定向参数
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect === 'upload') {
      setError(t('auth.pleaseRegisterToUse'))
    }
  }, [searchParams, t])

  // 加载 reCAPTCHA 脚本
  useEffect(() => {
    if (!isLogin) {
      const loadRecaptcha = () => {
        if (window.grecaptcha && recaptchaRef.current) {
          // 检查是否已经渲染过
          const widgetId = recaptchaRef.current.getAttribute('data-widget-id')
          if (!widgetId) {
            try {
              const id = window.grecaptcha.render(recaptchaRef.current, {
                sitekey: RECAPTCHA_SITE_KEY,
                callback: (token) => {
                  setRecaptchaToken(token)
                },
                'expired-callback': () => {
                  setRecaptchaToken(null)
                },
                'error-callback': () => {
                  setRecaptchaToken(null)
                }
              })
              if (recaptchaRef.current) {
                recaptchaRef.current.setAttribute('data-widget-id', id)
              }
            } catch (error) {
              console.error('reCAPTCHA render error:', error)
            }
          }
        }
      }

      // 如果 grecaptcha 已经加载，直接渲染
      if (window.grecaptcha) {
        loadRecaptcha()
      } else {
        // 等待 reCAPTCHA 脚本加载
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval)
            loadRecaptcha()
          }
        }, 100)

        // 10秒后停止检查
        setTimeout(() => clearInterval(checkInterval), 10000)
      }
    }
  }, [isLogin])

  // 重置 reCAPTCHA 当切换登录/注册模式
  useEffect(() => {
    if (isLogin) {
      setRecaptchaToken(null)
      if (recaptchaRef.current && window.grecaptcha) {
        const widgetId = recaptchaRef.current.getAttribute('data-widget-id')
        if (widgetId) {
          try {
            window.grecaptcha.reset(widgetId)
          } catch (error) {
            console.error('reCAPTCHA reset error:', error)
          }
        }
      }
    }
  }, [isLogin])

  // 验证码倒计时
  useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [codeCountdown])

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError(t('auth.pleaseEnterEmail'))
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError(t('auth.invalidEmail'))
      return
    }

    setSendingCode(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/auth/send-verification`, {
        email: formData.email,
        language: language, // 传递当前语言
      })

      if (response.data.success) {
        setVerificationSent(true)
        setCodeCountdown(60) // 60秒倒计时
      } else {
        setError(response.data.error || t('auth.sendCodeFailed'))
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.sendCodeFailed'))
    } finally {
      setSendingCode(false)
    }
  }

  const handleGoogleLogin = () => {
    // TODO: 实现Google登录
    setError(t('auth.googleLoginComingSoon'))
  }

  const handleFacebookLogin = () => {
    // TODO: 实现Facebook登录
    setError(t('auth.facebookLoginComingSoon'))
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">
            {isForgotPassword 
              ? t('auth.forgotPassword') 
              : isLogin 
                ? t('auth.login') 
                : t('auth.register')}
          </h2>
          <p className="text-gray-400">
            {isForgotPassword 
              ? t('auth.forgotPasswordSubtitle')
              : isLogin 
                ? t('auth.loginSubtitle') 
                : t('auth.registerSubtitle')}
          </p>
        </div>

        {forgotPasswordSent ? (
          <div className="glass-dark rounded-2xl p-8 text-center">
            <div className="mb-4">
              <Mail className="mx-auto h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('auth.forgotPasswordEmailSent')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('auth.forgotPasswordCheckEmail')}
            </p>
            <button
              onClick={() => {
                setIsForgotPassword(false)
                setForgotPasswordSent(false)
                setFormData({ ...formData, email: '' })
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        ) : isForgotPassword ? (
          <div className="glass-dark rounded-2xl p-8 relative">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('auth.emailPlaceholder')}
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
                    {t('auth.sending')}
                  </>
                ) : (
                  t('auth.sendResetLink')
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setError('')
                }}
                className="w-full text-center text-blue-400 hover:text-blue-300"
              >
                {t('auth.backToLogin')}
              </button>
            </form>
          </div>
        ) : (
        <div className="glass-dark rounded-2xl p-8 relative">
          {/* Google 和 Facebook 登录按钮 */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('auth.loginWithGoogle')}</span>
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] text-white hover:bg-[#166FE5] px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>{t('auth.loginWithFacebook')}</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">{t('auth.or')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.name')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('auth.namePlaceholder')}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('auth.password')}
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('auth.passwordRequirements')}
                </p>
              )}
            </div>

            {!isLogin && (
              <>
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
                    />
                  </div>
                </div>

                {/* 邮箱验证码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('auth.verificationCode')}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        name="verificationCode"
                        value={formData.verificationCode}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('auth.verificationCodePlaceholder')}
                        maxLength="6"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode || codeCountdown > 0 || !formData.email}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      {sendingCode ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : codeCountdown > 0 ? (
                        `${codeCountdown}s`
                      ) : (
                        t('auth.sendCode')
                      )}
                    </button>
                  </div>
                  {verificationSent && (
                    <p className="mt-2 text-sm text-green-400">{t('auth.codeSent')}</p>
                  )}
                </div>

                {/* reCAPTCHA */}
                <div>
                  <div ref={recaptchaRef} className="flex justify-center"></div>
                  {!recaptchaToken && (
                    <p className="mt-2 text-sm text-gray-400 text-center">
                      {t('auth.recaptchaNotice')}
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="h-5 w-5" />
              <span>{loading ? t('auth.processing') : (isLogin ? t('auth.login') : t('auth.register'))}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setVerificationSent(false)
                setCodeCountdown(0)
                setRecaptchaToken(null)
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  verificationCode: '',
                })
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

