import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('glowlisting_token')
    if (token) {
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const userInfo = await authService.getUserInfo()
      setUser(userInfo.user)
      setTokens(userInfo.tokens || 0)
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      localStorage.removeItem('glowlisting_token')
      setUser(null)
      setTokens(0)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = () => {
    return user?.isAdmin === true
  }

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      localStorage.setItem('glowlisting_token', response.token)
      setUser(response.user)
      setTokens(response.tokens || 0)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      return { success: false, error: errorMessage }
    }
  }

  const register = async (name, email, password, verificationCode, recaptchaToken) => {
    try {
      const response = await authService.register(name, email, password, verificationCode, recaptchaToken)
      localStorage.setItem('glowlisting_token', response.token)
      setUser(response.user)
      setTokens(response.tokens || 0)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('glowlisting_token')
    setUser(null)
    setTokens(0)
  }

  const updateTokens = (newTokens) => {
    setTokens(newTokens)
  }

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      loading,
      login,
      register,
      logout,
      updateTokens,
      fetchUserInfo,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}


