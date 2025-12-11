import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Activity,
  LogOut,
  RefreshCw,
  Calendar,
  User,
  Coins,
  Eye,
  Download,
  Trash2,
  Shield,
  Plus,
  X,
  Globe,
  MapPin,
  KeyRound
} from 'lucide-react'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Header from './Header'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today')
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddTokensModal, setShowAddTokensModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [tokenAmount, setTokenAmount] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [orders, setOrders] = useState([])
  const [usage, setUsage] = useState([])
  const [usageAction, setUsageAction] = useState('') // generate/download/all
  const [auditLogs, setAuditLogs] = useState([])
  const [advancedStats, setAdvancedStats] = useState(null)
  const [billingSubs, setBillingSubs] = useState([])
  const [billingSummary, setBillingSummary] = useState({ revenueByPlan: [], revenueDaily: [], topCustomers: [] })
  const [billingRange, setBillingRange] = useState('30d')
  const [billingLoading, setBillingLoading] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userHasTokens, setUserHasTokens] = useState('all')
  const [userDateStart, setUserDateStart] = useState(null)
  const [userDateEnd, setUserDateEnd] = useState(null)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(20)

  useEffect(() => {
    console.log('AdminDashboard useEffect - user:', user)
    if (!user) {
      console.log('No user, redirecting to login')
      navigate('/login')
      return
    }
    
    console.log('User isAdmin:', user.isAdmin)
    if (!user.isAdmin) {
      console.log('User is not admin, redirecting to dashboard')
      navigate('/dashboard')
      return
    }

    console.log('User is admin, fetching data...')
    fetchData()
    const interval = setInterval(fetchData, 30000) // 每30秒刷新一次
    return () => clearInterval(interval)
  }, [user, navigate])

  const fetchData = async (customStartDate = null, customEndDate = null) => {
    try {
      const token = localStorage.getItem('glowlisting_token')
      if (!token) {
        navigate('/login')
        return
      }

      console.log('Fetching admin data...')
      const params = {}
      if (customStartDate && customEndDate) {
        params.startDate = customStartDate.toISOString()
        params.endDate = customEndDate.toISOString()
      } else {
        params.range = timeRange
      }
      
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        }),
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      console.log('Admin stats:', statsRes.data)
      console.log('Admin users:', usersRes.data)
      
      setStats(statsRes.data.stats)
      setUsers(usersRes.data.users)
      setChartData(statsRes.data.chartData || null)
      // 同步加载订单与使用记录（短列表）
      const listParams = customStartDate && customEndDate
        ? { startDate: customStartDate.toISOString(), endDate: customEndDate.toISOString(), limit: 50 }
        : { range: timeRange, limit: 50 }
      const [ordersRes, usageRes, auditRes, advancedRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` }, params: listParams }),
        axios.get(`${API_URL}/admin/usage`, { headers: { Authorization: `Bearer ${token}` }, params: { ...listParams, action: usageAction || undefined } }),
        axios.get(`${API_URL}/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 100 } }).catch((err) => {
          console.warn('Failed to fetch audit logs:', err)
          return { data: { logs: [] } }
        }),
        axios.get(`${API_URL}/admin/advanced-stats`, { headers: { Authorization: `Bearer ${token}` } }).catch((err) => {
          console.warn('Failed to fetch advanced stats:', err)
          return { data: { stats: null } }
        })
      ])
      setOrders(ordersRes.data.orders || [])
      setUsage(usageRes.data.usage || [])
      setAuditLogs(auditRes.data.logs || [])
      setAdvancedStats(advancedRes.data.stats || null)

      // billing 数据
      setBillingLoading(true)
      try {
        const [subsRes, summaryRes] = await Promise.all([
          axios.get(`${API_URL}/admin/billing/subscriptions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/admin/billing/summary`, { headers: { Authorization: `Bearer ${token}` }, params: { range: billingRange } }),
        ])
        setBillingSubs(subsRes.data.subscriptions || [])
        setBillingSummary(summaryRes.data || { revenueByPlan: [], revenueDaily: [], topCustomers: [] })
      } catch (e) {
        console.warn('Failed to fetch billing data:', e)
        setBillingSubs([])
        setBillingSummary({ revenueByPlan: [], revenueDaily: [], topCustomers: [] })
      } finally {
        setBillingLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      // 显示错误信息给用户
      if (error.response?.status === 403) {
        alert('您没有管理员权限')
        navigate('/dashboard')
      } else if (error.response?.status === 401) {
        alert('请先登录')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateRange = () => {
    if (startDate && endDate) {
      setTimeRange('custom')
      fetchData(startDate, endDate)
      setShowDatePicker(false)
    }
  }

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
    setStartDate(null)
    setEndDate(null)
    setShowDatePicker(false)
    fetchData()
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`${t('adminDashboard.deleteConfirm')} (${userName})`)) {
      return
    }

    try {
      const token = localStorage.getItem('glowlisting_token')
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert(t('adminDashboard.userDeleted'))
      fetchData() // 刷新数据
    } catch (error) {
      console.error('Delete user error:', error)
      alert(error.response?.data?.error || t('adminDashboard.error'))
    }
  }

  const handleToggleAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('glowlisting_token')
      const res = await axios.put(`${API_URL}/admin/users/${userId}/toggle-admin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert(t('adminDashboard.userUpdated'))
      fetchData() // 刷新数据
    } catch (error) {
      console.error('Toggle admin error:', error)
      alert(error.response?.data?.error || t('adminDashboard.error'))
    }
  }

  const handleAddTokens = async () => {
    if (!tokenAmount || parseInt(tokenAmount) <= 0) {
      alert('Please enter a valid token amount')
      return
    }

    try {
      const token = localStorage.getItem('glowlisting_token')
      await axios.post(`${API_URL}/admin/users/${selectedUser.id}/tokens`, {
        amount: parseInt(tokenAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert(t('adminDashboard.tokensAdded'))
      setShowAddTokensModal(false)
      setSelectedUser(null)
      setTokenAmount('')
      fetchData() // 刷新数据
    } catch (error) {
      console.error('Add tokens error:', error)
      alert(error.response?.data?.error || t('adminDashboard.error'))
    }
  }

  if (!user || !user.isAdmin) {
    return null
  }

  const codeToFlag = (code) => {
    if (!code) return ''
    return code.split('').map((char) =>
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    ).join('')
  }

  // Client-side filtered & paginated users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
    const matchesRole =
      userRoleFilter === 'all' ||
      (userRoleFilter === 'admin' && (u.isAdmin || u.is_admin)) ||
      (userRoleFilter === 'user' && !(u.isAdmin || u.is_admin))
    const matchesTokens =
      userHasTokens === 'all' ||
      (userHasTokens === 'yes' && (u.tokens || 0) > 0) ||
      (userHasTokens === 'no' && (u.tokens || 0) === 0)
    const created = u.createdAt || u.created_at
    const matchesDate =
      !userDateStart ||
      !userDateEnd ||
      (created && new Date(created) >= userDateStart && new Date(created) <= userDateEnd)
    return matchesSearch && matchesRole && matchesTokens && matchesDate
  })
  const userCount = filteredUsers.length
  const pages = Math.ceil(userCount / userPageSize)
  const totalUserPages = Math.max(1, pages)
  const startIndex = (userPage - 1) * userPageSize
  const endIndex = userPage * userPageSize
  const pagedUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('adminDashboard.loading')}</p>
        </div>
      </div>
    )
  }

  const timeRanges = [
    { value: 'today', label: t('adminDashboard.today') },
    { value: 'yesterday', label: t('adminDashboard.yesterday') },
    { value: 'weekToDate', label: t('adminDashboard.weekToDate') },
    { value: 'lastWeek', label: t('adminDashboard.lastWeek') },
    { value: 'monthToDate', label: t('adminDashboard.monthToDate') },
    { value: 'yearToDate', label: t('adminDashboard.yearToDate') },
    { value: 'allTime', label: t('adminDashboard.allTime') },
    { value: 'custom', label: t('adminDashboard.customRange') },
  ]

  const getTokenUsage = () => {
    if (!stats) return { totalUsage: 0, totalDownload: 0, uniqueUsers: 0 }
    if (timeRange === 'custom' && stats.tokenUsage.custom) {
      return stats.tokenUsage.custom
    }
    return stats.tokenUsage[timeRange] || { totalUsage: 0, totalDownload: 0, uniqueUsers: 0 }
  }

  const getRevenue = () => {
    if (!stats) return 0
    if (timeRange === 'custom' && stats.totalRevenue.custom) {
      return stats.totalRevenue.custom
    }
    return stats.totalRevenue[timeRange] || 0
  }

  const tokenUsage = getTokenUsage()
  const revenue = getRevenue()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="glass-dark rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t('adminDashboard.dashboard')}</h1>
              <p className="text-gray-400">{t('adminDashboard.welcomeBack')}, {user.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>{t('adminDashboard.refresh')}</span>
              </button>
              <button
                onClick={logout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('adminDashboard.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'glass-dark text-gray-300 hover:bg-gray-800'
            }`}
          >
            {t('adminDashboard.overview')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'glass-dark text-gray-300 hover:bg-gray-800'
            }`}
          >
            {t('adminDashboard.users')} ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'glass-dark text-gray-300 hover:bg-gray-800'
            }`}
          >
            {t('adminDashboard.analytics')}
          </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white'
              : 'glass-dark text-gray-300 hover:bg-gray-800'
          }`}
        >
          {t('adminDashboard.orders')}
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'usage'
              ? 'bg-blue-600 text-white'
              : 'glass-dark text-gray-300 hover:bg-gray-800'
          }`}
        >
          {t('adminDashboard.usage')}
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-blue-600 text-white'
              : 'glass-dark text-gray-300 hover:bg-gray-800'
          }`}
        >
          {t('adminDashboard.billing')}
        </button>
        </div>

        {/* 时间范围选择器 */}
        {activeTab === 'overview' && (
          <div className="glass-dark rounded-xl p-4 mb-6 relative z-50">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300 font-medium">{t('adminDashboard.timeRange')}:</span>
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => {
                    if (range.value === 'custom') {
                      setShowDatePicker(!showDatePicker)
                    } else {
                      handleTimeRangeChange(range.value)
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            {/* 自定义日期范围选择器 */}
            {showDatePicker && (
              <div className="mt-4 glass-dark rounded-xl p-4 shadow-2xl border border-gray-700 relative z-50">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">{t('adminDashboard.startDate')}</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={new Date()}
                      className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      dateFormat="yyyy-MM-dd"
                      placeholderText={t('adminDashboard.selectStartDate')}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">{t('adminDashboard.endDate')}</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      maxDate={new Date()}
                      className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      dateFormat="yyyy-MM-dd"
                      placeholderText={t('adminDashboard.selectEndDate')}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomDateRange}
                      disabled={!startDate || !endDate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      {t('adminDashboard.apply')}
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false)
                        setStartDate(null)
                        setEndDate(null)
                        if (timeRange === 'custom') {
                          setTimeRange('today')
                          fetchData()
                        }
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      {t('adminDashboard.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 趋势图表 - 放在Time Range选择器下面 */}
        {activeTab === 'overview' && (
          <div className="glass-dark rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('adminDashboard.trendChart')}</h2>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    const month = date.getMonth() + 1
                    const day = date.getDate()
                    return month + '/' + day
                  }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: '1px solid rgba(55, 65, 81, 1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value, name) => {
                    if (name === 'totalRevenue') {
                      return [`$${value.toFixed(2)}`, t('adminDashboard.totalRevenue')]
                    }
                    return [value, t(`adminDashboard.${name}`)]
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#9CA3AF' }}
                  formatter={(value) => {
                    if (value === 'totalRevenue') return t('adminDashboard.totalRevenue')
                    if (value === 'totalUsers') return t('adminDashboard.totalUsers')
                    if (value === 'totalSubscriptions') return t('adminDashboard.totalSubscriptions')
                    return value
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  name="totalUsers"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalRevenue" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 3 }}
                  name="totalRevenue"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalSubscriptions" 
                  stroke="#A855F7" 
                  strokeWidth={2}
                  dot={{ fill: '#A855F7', r: 3 }}
                  name="totalSubscriptions"
                />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <p>{t('adminDashboard.noChartData')}</p>
              </div>
            )}
          </div>
        )}

        {/* 概览标签页 */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 在线人数 */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{t('adminDashboard.activeUsers')}</h3>
                <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
              </div>

              {/* 注册用户数 */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{t('adminDashboard.totalUsers')}</h3>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>

              {/* 总收入 */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-500/20 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{t('adminDashboard.totalRevenue')}</h3>
                <p className="text-3xl font-bold text-white">${revenue.toFixed(2)}</p>
              </div>

              {/* 总订阅数 */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{t('adminDashboard.totalSubscriptions')}</h3>
                <p className="text-3xl font-bold text-white">{stats.subscriptions.active}</p>
                <p className="text-sm text-gray-400 mt-1">{t('adminDashboard.total')}: {stats.subscriptions.total}</p>
              </div>
            </div>

            {/* Token消耗统计 */}
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{t('adminDashboard.tokenUsage')}</h2>
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{t('adminDashboard.totalTokenUsage')}</p>
                  <p className="text-4xl font-bold text-white">{tokenUsage.totalUsage || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('adminDashboard.totalTokenUsageDesc')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">{t('adminDashboard.totalDownload')}</p>
                  <p className="text-4xl font-bold text-white">{tokenUsage.totalDownload || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('adminDashboard.totalDownloadDesc')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">{t('adminDashboard.uniqueUsers')}</p>
                  <p className="text-4xl font-bold text-white">{tokenUsage.uniqueUsers || 0}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 用户列表标签页 */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* 过滤与导出 */}
            <div className="glass-dark rounded-xl p-4 flex flex-wrap gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">{t('adminDashboard.search')}</label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('adminDashboard.searchPlaceholder')}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">{t('adminDashboard.role')}</label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{t('adminDashboard.all')}</option>
                  <option value="admin">{t('adminDashboard.admin')}</option>
                  <option value="user">{t('adminDashboard.user')}</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">{t('adminDashboard.hasTokens')}</label>
                <select
                  value={userHasTokens}
                  onChange={(e) => setUserHasTokens(e.target.value)}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{t('adminDashboard.all')}</option>
                  <option value="yes">{t('adminDashboard.hasTokensYes')}</option>
                  <option value="no">{t('adminDashboard.hasTokensNo')}</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">{t('adminDashboard.startDate')}</label>
                <DatePicker
                  selected={userDateStart}
                  onChange={(date) => setUserDateStart(date)}
                  selectsStart
                  startDate={userDateStart}
                  endDate={userDateEnd}
                  maxDate={new Date()}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  dateFormat="yyyy-MM-dd"
                  placeholderText={t('adminDashboard.selectStartDate')}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">{t('adminDashboard.endDate')}</label>
                <DatePicker
                  selected={userDateEnd}
                  onChange={(date) => setUserDateEnd(date)}
                  selectsEnd
                  startDate={userDateStart}
                  endDate={userDateEnd}
                  minDate={userDateStart}
                  maxDate={new Date()}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  dateFormat="yyyy-MM-dd"
                  placeholderText={t('adminDashboard.selectEndDate')}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    fetchData()
                  }}
                  className="btn-primary h-fit"
                >
                  {t('adminDashboard.apply')}
                </button>
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('glowlisting_token')
                    const params = {}
                    if (userSearch) params.search = userSearch
                    if (userRoleFilter !== 'all') params.role = userRoleFilter
                    if (userHasTokens !== 'all') params.hasTokens = userHasTokens
                    if (userDateStart && userDateEnd) {
                      params.startDate = userDateStart.toISOString()
                      params.endDate = userDateEnd.toISOString()
                    }
                    const res = await axios.get(`${API_URL}/admin/export/users`, {
                      headers: { Authorization: `Bearer ${token}` },
                      params,
                    })
                    const data = res.data.users || []
                    const csv = ['name,email,isAdmin,balance,createdAt,lastLoginAt,lastLoginCountry,lastLoginCity,lastLoginIp']
                      .concat(
                        data.map(u =>
                          [
                            u.name,
                            u.email,
                            u.is_admin ?? u.isAdmin,
                            u.balance ?? u.tokens ?? 0,
                            u.created_at ?? u.createdAt,
                            u.last_login_at ?? u.lastLoginAt,
                            u.last_login_country ?? u.lastLoginCountry,
                            u.last_login_city ?? u.lastLoginCity,
                            u.last_login_ip ?? u.lastLoginIp,
                          ].map(v => {
                            const str = (v ?? '').toString()
                            const quoteChar = String.fromCharCode(34)
                            const doubleQuote = quoteChar + quoteChar
                            const escaped = str.split(quoteChar).join(doubleQuote)
                            const result = quoteChar + escaped + quoteChar
                            return result
                          }).join(',')
                        )
                      )
                      .join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', 'users.csv')
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="btn-secondary h-fit"
                >
                  {t('adminDashboard.export')}
                </button>
              </div>
            </div>

            <div className="glass-dark rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.name')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.email')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.location')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.lastLogin')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.tokens')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.totalProcessed')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.tokensUsed')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.memberSince')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.role')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pagedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {u.lastLoginCountryCode ? (
                          <span className="inline-flex items-center space-x-2">
                            <span className="text-lg">{codeToFlag(u.lastLoginCountryCode)}</span>
                            <span>{u.lastLoginCountry || u.lastLoginCountryCode}</span>
                            {u.lastLoginCity ? <span className="text-gray-500 text-xs">({u.lastLoginCity})</span> : null}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        <span className="inline-flex items-center space-x-1">
                          <Coins className="h-4 w-4 text-yellow-400" />
                          <span>{u.tokens || 0}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{u.totalProcessed || 0}</td>
                      <td className="px-6 py-4 text-sm text-white">{u.tokensUsed || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {u.isAdmin ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                            {t('adminDashboard.admin')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs font-medium">
                            {t('adminDashboard.user')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setShowAddTokensModal(true)
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title={t('adminDashboard.addTokens')}
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={() => {
                              setResetPasswordUser(u)
                              setResetPasswordValue('')
                            }}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                            title={t('adminDashboard.resetPassword')}
                          >
                            <KeyRound className="h-4 w-4 text-white" />
                          </button>
                          {u.id !== user.id && (
                            <>
                              <button
                                onClick={() => handleToggleAdmin(u.id)}
                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                title={u.isAdmin ? t('adminDashboard.removeAdmin') : t('adminDashboard.makeAdmin')}
                              >
                                <Shield className="h-4 w-4 text-white" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title={t('adminDashboard.delete')}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-gray-400">
                {t('adminDashboard.total')}: {filteredUsers.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={userPageSize}
                  onChange={(e) => {
                    setUserPageSize(parseInt(e.target.value))
                    setUserPage(1)
                  }}
                  className="bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[10, 20, 50, 100].map((s) => (
                    <option key={s} value={s}>{s}/page</option>
                  ))}
                </select>
                <button
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50"
                  disabled={userPage <= 1}
                >
                  Prev
                </button>
                <span className="text-gray-300 text-sm">{userPage} {'/'} {totalUserPages}</span>
                <button
                  onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
                  className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50"
                  disabled={userPage >= totalUserPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 充值Token模态框 */}
        {showAddTokensModal && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-dark rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('adminDashboard.addTokensToUser')}</h3>
                <button
                  onClick={() => {
                    setShowAddTokensModal(false)
                    setSelectedUser(null)
                    setTokenAmount('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">{t('adminDashboard.name')}: {selectedUser.name}</p>
                  <p className="text-gray-300 mb-4">{t('adminDashboard.email')}: {selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminDashboard.tokenAmount')}
                  </label>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter token amount"
                    min="1"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddTokens}
                    className="flex-1 btn-primary"
                  >
                    {t('adminDashboard.add')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTokensModal(false)
                      setSelectedUser(null)
                      setTokenAmount('')
                    }}
                    className="flex-1 btn-secondary"
                  >
                    {t('adminDashboard.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分析标签页 */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-6">
            <div className="glass-dark rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">{t('adminDashboard.tokenUsageByPeriod')}</h2>
              <div className="space-y-4">
                {timeRanges.map(range => {
                  const usage = stats.tokenUsage[range.value] || { totalUsage: 0, uniqueUsers: 0 }
                  return (
                    <div key={range.value} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{range.label}</p>
                        <p className="text-sm text-gray-400">{t('adminDashboard.uniqueUsers')}: {usage.uniqueUsers}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">{usage.totalUsage}</p>
                        <p className="text-xs text-gray-400">{t('adminDashboard.tokens')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="glass-dark rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">{t('adminDashboard.revenueByPeriod')}</h2>
              <div className="space-y-4">
                {timeRanges.map(range => {
                  const revenue = stats.totalRevenue[range.value] || 0
                  return (
                    <div key={range.value} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                      <p className="text-white font-medium">{range.label}</p>
                      <p className="text-2xl font-bold text-yellow-400">${revenue.toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 订单列表 */}
        {activeTab === 'orders' && (
          <div className="glass-dark rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('adminDashboard.recentOrders')}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('glowlisting_token')
                    const params = {}
                    if (startDate && endDate) {
                      params.startDate = startDate.toISOString()
                      params.endDate = endDate.toISOString()
                    }
                    const res = await axios.get(`${API_URL}/admin/export/orders`, {
                      headers: { Authorization: `Bearer ${token}` },
                      params,
                    })
                    const data = res.data.orders || []
                    const csv = ['date,user,email,amount,currency,plan,source']
                      .concat(
                        data.map(o =>
                          [
                            o.created_at,
                            o.name || '-',
                            o.email || '-',
                            o.amount || 0,
                            o.currency || 'usd',
                            o.source || '-',
                            o.source || '-',
                          ].map(v => {
                            const str = (v ?? '').toString()
                            const quoteChar = String.fromCharCode(34)
                            const doubleQuote = quoteChar + quoteChar
                            const escaped = str.split(quoteChar).join(doubleQuote)
                            const result = quoteChar + escaped + quoteChar
                            return result
                          }).join(',')
                        )
                      )
                      .join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', 'orders.csv')
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="btn-secondary h-fit flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('adminDashboard.export')}
                </button>
                <span className="text-sm text-gray-400">{t('adminDashboard.lastNRecords', { count: 50 })}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.user')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.amount')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.plan')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">
                        <div className="flex flex-col">
                          <span>{o.name || o.email || '-'}</span>
                          <span className="text-xs text-gray-400">{o.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        ${Number(o.amount || 0).toFixed(2)} {o.currency || 'usd'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{o.source || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-400 text-sm" colSpan={4}>
                        {t('adminDashboard.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 使用记录 */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{t('adminDashboard.recentUsage')}</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={usageAction}
                    onChange={(e) => {
                      setUsageAction(e.target.value)
                      fetchData(startDate, endDate)
                    }}
                    className="bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('adminDashboard.allActions')}</option>
                    <option value="generate">{t('adminDashboard.generate')}</option>
                    <option value="process">{t('adminDashboard.process')}</option>
                    <option value="download">{t('adminDashboard.download')}</option>
                  </select>
                  <span className="text-sm text-gray-400">{t('adminDashboard.lastNRecords', { count: 50 })}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.user')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.action')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.imageId')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.time')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {usage.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex flex-col">
                            <span>{u.name || u.email || '-'}</span>
                            <span className="text-xs text-gray-400">{u.email || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{u.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{u.image_id || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                    {usage.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-400 text-sm" colSpan={4}>
                          {t('adminDashboard.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 重置密码模态框 */}
        {resetPasswordUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-dark rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('adminDashboard.resetPassword')}</h3>
                <button
                  onClick={() => {
                    setResetPasswordUser(null)
                    setResetPasswordValue('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    {t('adminDashboard.name')}: {resetPasswordUser.name}
                  </p>
                  <p className="text-gray-300 mb-4">
                    {t('adminDashboard.email')}: {resetPasswordUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminDashboard.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('adminDashboard.newPassword')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('auth.passwordRequirements')}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!resetPasswordValue) {
                        alert(t('adminDashboard.error'))
                        return
                      }
                      try {
                        const token = localStorage.getItem('glowlisting_token')
                        const resetUrl = [API_URL, 'admin', 'users', resetPasswordUser.id, 'reset-password'].join('/')
                        await axios.post(
                          resetUrl,
                          { newPassword: resetPasswordValue },
                          { headers: { Authorization: 'Bearer ' + token } }
                        )
                        alert(t('adminDashboard.passwordResetSuccess'))
                        setResetPasswordUser(null)
                        setResetPasswordValue('')
                      } catch (error) {
                        console.error('Reset password error:', error)
                        alert(error.response?.data?.error || t('adminDashboard.error'))
                      }
                    }}
                    className="flex-1 btn-primary"
                  >
                    {t('adminDashboard.resetPassword')}
                  </button>
                  <button
                    onClick={() => {
                      setResetPasswordUser(null)
                      setResetPasswordValue('')
                    }}
                    className="flex-1 btn-secondary"
                  >
                    {t('adminDashboard.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{t('adminDashboard.billing')}</h2>
              <select
                value={billingRange}
                onChange={(e) => {
                  setBillingRange(e.target.value)
                  // 触发重新获取
                  fetchData(startDate, endDate)
                }}
                className="bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="all">All</option>
              </select>
            </div>

            {/* Revenue summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-dark rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-2">{t('adminDashboard.revenueByPlan')}</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(billingSummary.revenueByPlan || []).map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm text-white">
                      <span className="text-gray-300">{r.plan || 'N/A'}</span>
                      <span className="font-semibold">${Number(r.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {(billingSummary.revenueByPlan || []).length === 0 && (
                    <div className="text-sm text-gray-400">{t('adminDashboard.noData')}</div>
                  )}
                </div>
              </div>

              <div className="glass-dark rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-2">{t('adminDashboard.revenueDaily')}</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto text-sm text-white">
                  {(billingSummary.revenueDaily || []).map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-gray-300">{d.date}</span>
                      <span className="font-semibold">${Number(d.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {(billingSummary.revenueDaily || []).length === 0 && (
                    <div className="text-sm text-gray-400">{t('adminDashboard.noData')}</div>
                  )}
                </div>
              </div>

              <div className="glass-dark rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-2">{t('adminDashboard.topCustomers')}</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto text-sm text-white">
                  {(billingSummary.topCustomers || []).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>{c.name || c.email || '-'}</span>
                        <span className="text-xs text-gray-400">{c.email || '-'}</span>
                      </div>
                      <span className="font-semibold">${Number(c.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {(billingSummary.topCustomers || []).length === 0 && (
                    <div className="text-sm text-gray-400">{t('adminDashboard.noData')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscriptions table */}
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('adminDashboard.subscriptions')}</h3>
                {billingLoading && <span className="text-xs text-gray-400">{t('adminDashboard.loading')}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.user')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.plan')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Stripe Sub</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.status')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.periodEnd')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.cancelAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {billingSubs.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex flex-col">
                            <span>{s.name || s.email || '-'}</span>
                            <span className="text-xs text-gray-400">{s.email || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.plan_name || s.plan_type || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.stripe_subscription_id || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.status || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {s.current_period_end ? new Date(s.current_period_end).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {s.cancel_at_period_end ? t('adminDashboard.yes') : t('adminDashboard.no')}
                        </td>
                      </tr>
                    ))}
                    {billingSubs.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-400 text-sm" colSpan={6}>
                          {t('adminDashboard.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 审计日志 */}
        {activeTab === 'audit' && (
          <div className="glass-dark rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">{t('adminDashboard.auditLogs') || 'Audit Logs'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.time')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.admin')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.action')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">{t('adminDashboard.target') || 'Target'}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {log.admin_name || log.admin_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{log.action || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {log.target_name || log.target_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 text-xs">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-400 text-sm" colSpan={5}>
                        {t('adminDashboard.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

