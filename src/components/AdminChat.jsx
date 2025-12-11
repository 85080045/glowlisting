import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { MessageCircle, X, Send, Minimize2, Users } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function AdminChat() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ws, setWs] = useState(null)
  const messagesEndRef = useRef(null)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized && selectedUserId) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized, selectedUserId])

  // 获取对话列表
  const fetchConversations = async () => {
    if (!user || !user.isAdmin) return
    try {
      setLoading(true)
      const token = localStorage.getItem('glowlisting_token')
      const res = await axios.get(`${API_URL}/admin/support/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(res.data.conversations || [])
    } catch (err) {
      console.error('Fetch conversations failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取指定用户的消息
  const fetchMessages = async (userId) => {
    if (!userId) return
    try {
      setLoading(true)
      const token = localStorage.getItem('glowlisting_token')
      const res = await axios.get(`${API_URL}/admin/support/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data.messages || [])
    } catch (err) {
      console.error('Fetch messages failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // WebSocket 连接
  useEffect(() => {
    if (!user || !user.isAdmin) return

    const token = localStorage.getItem('glowlisting_token')
    if (!token) return

    try {
      const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/^http/, 'ws')
      const socket = new WebSocket(`${wsUrl.replace(/\/$/, '')}/ws?token=${token}`)
      
      socket.onopen = () => {
        console.log('AdminChat WS connected')
        if (isOpen) fetchConversations()
      }
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message_new' || data.type === 'message_reply') {
            fetchConversations()
            if (selectedUserId && (data.userId === selectedUserId || data.type === 'message_reply')) {
              fetchMessages(selectedUserId)
            }
          }
        } catch (e) {
          console.warn('WS parse error:', e)
        }
      }
      
      socket.onerror = (e) => console.warn('WS error:', e)
      socket.onclose = () => console.log('WS closed (AdminChat)')
      
      setWs(socket)
      
      return () => {
        socket.close()
      }
    } catch (e) {
      console.warn('WS init failed:', e)
    }
  }, [user, isOpen, selectedUserId])

  // 打开聊天窗口时获取对话列表
  useEffect(() => {
    if (isOpen && user && user.isAdmin) {
      fetchConversations()
    }
  }, [isOpen, user])

  // 选择用户时获取消息
  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId)
    }
  }, [selectedUserId])

  // 发送消息
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedUserId) return

    try {
      setSending(true)
      const token = localStorage.getItem('glowlisting_token')
      await axios.post(
        `${API_URL}/admin/support/messages/${selectedUserId}`,
        { message: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewMessage('')
      fetchMessages(selectedUserId)
      fetchConversations()
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

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId)

  if (!user || !user.isAdmin) return null

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label={t('chat.adminSupport') || 'Admin Support'}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          className={`fixed bottom-6 left-6 z-50 w-[800px] max-w-[calc(100vw-3rem)] ${
            isMinimized ? 'h-16' : 'h-[700px]'
          } bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex transition-all duration-300`}
        >
          {/* 左侧：对话列表 */}
          {!isMinimized && (
            <div className="w-64 border-r border-gray-700 flex flex-col bg-gray-800">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('chat.conversations') || 'Conversations'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    {t('chat.loading') || 'Loading...'}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    {t('chat.noConversations') || 'No conversations yet'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {conversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelectedUserId(conv.user_id)}
                        className={`w-full p-3 text-left hover:bg-gray-700 transition-colors ${
                          selectedUserId === conv.user_id ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-white truncate">
                          {conv.user_name || conv.user_email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {conv.last_message || '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(conv.last_message_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 右侧：消息区域 */}
          <div className="flex-1 flex flex-col">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">
                  {selectedConversation
                    ? selectedConversation.user_name || selectedConversation.user_email || 'User'
                    : t('chat.adminSupport') || 'Admin Support'}
                </h3>
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
                  onClick={() => {
                    setIsOpen(false)
                    setSelectedUserId(null)
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label={t('chat.close') || 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {selectedUserId ? (
                  <>
                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
                      {loading && messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          {t('chat.loading') || 'Loading...'}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>{t('chat.noMessages') || 'No messages yet. Start a conversation!'}</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                msg.is_admin
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-800 text-gray-100'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
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
                          className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          disabled={sending}
                        />
                        <button
                          onClick={handleSend}
                          disabled={!newMessage.trim() || sending}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
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
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-gray-400">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>{t('chat.selectConversation') || 'Select a conversation to start chatting'}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

