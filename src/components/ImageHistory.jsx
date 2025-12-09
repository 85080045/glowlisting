import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Download, Trash2, ArrowLeft, Calendar, Search, Filter } from 'lucide-react'
import Header from './Header'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function ImageHistory() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else {
      fetchImageHistory()
    }
  }, [user, navigate])

  const fetchImageHistory = async () => {
    try {
      const token = localStorage.getItem('glowlisting_token')
      const response = await axios.get(`${API_URL}/images/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setImages(response.data.images || [])
    } catch (err) {
      console.error('Failed to fetch image history:', err)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageId, filename) => {
    try {
      const token = localStorage.getItem('glowlisting_token')
      const response = await axios.get(`${API_URL}/download/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename || `glowlisting-enhanced-${imageId}.jpg`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleDelete = async (imageId) => {
    if (!confirm(t('history.confirmDelete'))) return

    try {
      const token = localStorage.getItem('glowlisting_token')
      await axios.delete(`${API_URL}/images/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      fetchImageHistory()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filteredImages = images.filter((img) => {
    const matchesSearch = !searchTerm || 
      (img.filename && img.filename.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDate = !filterDate || 
      (img.createdAt && img.createdAt.startsWith(filterDate))
    return matchesSearch && matchesDate
  })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('history.backToDashboard')}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">{t('history.title')}</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            {t('history.uploadNew')}
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="glass-dark rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('history.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 图片列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">{t('history.loading')}</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="glass-dark rounded-xl p-12 text-center">
            <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('history.noImages')}</h3>
            <p className="text-gray-400 mb-6">{t('history.noImagesDesc')}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              {t('history.uploadFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((img) => (
              <div key={img.id} className="glass-dark rounded-xl overflow-hidden hover:scale-105 transition-transform">
                <div className="aspect-square bg-gray-800 relative group">
                  {img.thumbnail ? (
                    <img
                      src={img.thumbnail}
                      alt={img.filename || 'Enhanced image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDownload(img.id, img.filename)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                      title={t('history.download')}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                      title={t('history.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 truncate mb-1">
                    {img.filename || `Image ${img.id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(img.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

