'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import DailyLimitBanner from '@/components/chat/DailyLimitBanner'
import ChatSidebar from '@/components/chat/ChatSidebar'

interface Message {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
  timestamp?: string
}

interface Session {
  id: string
  title: string
  updated_at: string
  message_count?: number
}

interface ChatViewProps {
  userName: string
  messageLimit: number
  messagesUsed: number
  isPremium: boolean
}

export default function ChatView({ userName, messageLimit, messagesUsed, isPremium }: ChatViewProps) {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [count, setCount] = useState(messagesUsed)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Session state
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch sessions on mount
  const fetchSessions = useCallback(async () => {
    try {
      const resp = await fetch('/api/chat/sessions')
      if (resp.ok) {
        const data = await resp.json()
        setSessions(data.sessions || [])
      }
    } catch {
      // Failed to fetch sessions — not critical
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Read prompt from URL on mount
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt) {
      setPendingPrompt(prompt)
    }
  }, [searchParams])

  // Load a session's messages
  async function loadSession(sessionId: string) {
    try {
      const resp = await fetch(`/api/chat/sessions/${sessionId}`)
      if (resp.ok) {
        const data = await resp.json()
        const loaded: Message[] = (data.messages || []).map((m: { role: string; content: string; created_at: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.created_at,
        }))
        setMessages(loaded)
        setActiveSessionId(sessionId)
      }
    } catch {
      // Load failed
    }
  }

  // Start a new chat
  function handleNewChat() {
    setMessages([])
    setActiveSessionId(null)
  }

  // Delete a session
  async function handleDeleteSession(sessionId: string) {
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        handleNewChat()
      }
    } catch {
      // Delete failed
    }
  }

  // Process SSE stream and return the session_id from the done event
  async function processStream(
    response: Response,
    onText: (fullText: string) => void,
    onDone: (fullText: string, sessionId: string | null) => void,
    onError: (msg: string) => void,
  ) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6)
        try {
          const data = JSON.parse(jsonStr)
          if (data.error) {
            onError(data.error)
            return
          }
          if (data.text) {
            fullText += data.text
            onText(fullText)
          }
          if (data.done) {
            fullText = data.full_text || fullText
            onDone(fullText, data.session_id || null)
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  // Process pending prompt (from URL ?prompt=...)
  useEffect(() => {
    if (pendingPrompt && !streaming) {
      const text = pendingPrompt
      setPendingPrompt(null)
      setMessages(prev => [...prev, { role: 'user', content: text }])
      setStreaming(true)
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [], session_id: null }),
      }).then(async (resp) => {
        if (!resp.ok || !resp.body) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request. Please try again.' }])
          setStreaming(false)
          return
        }
        await processStream(
          resp,
          (fullText) => {
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: fullText }
              return updated
            })
          },
          (_, sessionId) => {
            if (sessionId) {
              setActiveSessionId(sessionId)
              fetchSessions()
            }
            setStreaming(false)
          },
          (errorMsg) => {
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: errorMsg }
              return updated
            })
            setStreaming(false)
          },
        )
      }).catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
        setStreaming(false)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  async function handleSend(text: string) {
    if (!text.trim()) return
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setStreaming(true)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          session_id: activeSessionId,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        if (err.error === 'daily_limit_reached') {
          setLimitReached(true)
          setMessages(prev => prev.slice(0, -1)) // Remove empty assistant message
          setStreaming(false)
          return
        }
        throw new Error(err.error || 'Failed to send message')
      }

      await processStream(
        response,
        (fullText) => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: fullText }
            return updated
          })
        },
        (_, sessionId) => {
          setCount(prev => prev + 1)
          if (sessionId) {
            setActiveSessionId(sessionId)
            fetchSessions()
          }
        },
        (errorMsg) => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: errorMsg }
            return updated
          })
        },
      )

    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Astra is meditating, please try again shortly.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={loadSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors cursor-pointer -ml-1"
          aria-label="Toggle conversations"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-rose flex items-center justify-center">
          <span className="text-white text-lg">✦</span>
        </div>
        <div>
          <h2 className="text-star font-semibold text-sm">Astra</h2>
          <p className="text-muted text-xs">Your personal astrologer</p>
        </div>
        {!isPremium && (
          <div className="ml-auto bg-nebula rounded-lg px-3 py-1.5">
            <span className="text-violet-light text-xs">{count}/{messageLimit} messages today</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-star font-display text-xl mb-2">Hello, {userName}</p>
              <p className="text-muted text-sm mb-4">Ask me anything about your chart, your stars, or your path ahead.</p>
            </div>
            {sessions.length > 0 && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-violet-light/60 text-xs hover:text-violet-light transition-colors cursor-pointer"
              >
                View previous conversations →
              </button>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            audioBlob={msg.audioBlob}
            streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
      </div>

      {/* Input or limit banner */}
      {limitReached ? (
        <DailyLimitBanner />
      ) : (
        <ChatInput onSend={handleSend} disabled={streaming} />
      )}
    </div>
  )
}
