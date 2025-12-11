import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SupportChat() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ws, setWs] = useState(null)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const messagesFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized])

  // 获取消息列表
  const fetchMessages = async (silent = false) => {
    if (!user) return
    // 防止重复请求
    if (fetchingRef.current && !silent) return
    try {
      if (!silent) {
        fetchingRef.current = true
        setLoading(true)
      }
      const token = localStorage.getItem('glowlisting_token')
      const res = await axios.get(`${API_URL}/support/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data.messages || [])
      messagesFetchedRef.current = true
    } catch (err) {
      console.error('Fetch messages failed:', err)
    } finally {
      if (!silent) {
        setLoading(false)
        fetchingRef.current = false
      }
    }
  }

  // WebSocket 连接（只在打开聊天窗口时连接）
  useEffect(() => {
    if (!user || !isOpen) {
      if (ws) {
        ws.close()
        setWs(null)
      }
      return
    }

    const token = localStorage.getItem('glowlisting_token')
    if (!token) return

    // 如果已经有连接，不重复创建
    if (ws && ws.readyState === WebSocket.OPEN) return

    try {
      const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/^http/, 'ws')
      const socket = new WebSocket(`${wsUrl.replace(/\/$/, '')}/ws?token=${token}`)
      
      socket.onopen = () => {
        console.log('SupportChat WS connected')
      }
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message_new' || data.type === 'message_reply') {
            // 静默刷新消息（不显示 loading）
            fetchMessages(true)
          }
        } catch (e) {
          console.warn('WS parse error:', e)
        }
      }
      
      socket.onerror = (e) => console.warn('WS error:', e)
      socket.onclose = () => console.log('WS closed (SupportChat)')
      
      setWs(socket)
      
      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close()
        }
      }
    } catch (e) {
      console.warn('WS init failed:', e)
    }
  }, [user, isOpen])

  // 打开聊天窗口时获取消息（只获取一次）
  useEffect(() => {
    if (isOpen && user && !messagesFetchedRef.current) {
      fetchMessages()
    }
  }, [isOpen, user])
  
  // 关闭窗口时重置标志
  useEffect(() => {
    if (!isOpen) {
      messagesFetchedRef.current = false
      setMessages([])
    }
  }, [isOpen])

  // 发送消息
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !user) return

    try {
      setSending(true)
      const token = localStorage.getItem('glowlisting_token')
      await axios.post(
        `${API_URL}/support/messages`,
        { message: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewMessage('')
      // 静默刷新（不显示 loading）
      fetchMessages(true)
    } catch (err) {
      console.error('Send message failed:', err)
      alert(err.response?.data?.error || '发送失败，请重试')
    } finally {
      setSending(false)
    }
  }

  // 格式化时间
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return t('chat.justNow') || '刚刚'
    if (minutes < 60) return `${minutes}${t('chat.minutesAgo') || '分钟前'}`
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!user) return null

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label={t('chat.support') || 'Support'}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] ${
            isMinimized ? 'h-16' : 'h-[600px]'
          } bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col transition-all duration-300`}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">{t('chat.support') || 'Support'}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label={isMinimized ? (t('chat.expand') || 'Expand') : (t('chat.minimize') || 'Minimize')}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label={t('chat.close') || 'Close'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
                {loading ? (
                  <div className="text-center text-gray-400 py-8">
                    {t('chat.loading') || 'Loading...'}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('chat.noMessages') || 'No messages yet. Start a conversation!'}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          msg.is_admin
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 输入框 */}
              <div className="border-t border-gray-700 p-4 bg-gray-900">
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={t('chat.typeMessage') || 'Type your message...'}
                    rows={2}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
                    aria-label={t('chat.send') || 'Send'}
                  >
                    {sending ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

