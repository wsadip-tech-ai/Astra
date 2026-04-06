'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import DailyLimitBanner from '@/components/chat/DailyLimitBanner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
  timestamp?: string
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
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Read prompt from URL on mount
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt) {
      setPendingPrompt(prompt)
    }
  }, [searchParams])

  async function loadPreviousConversations() {
    if (historyLoaded) {
      setShowHistory(!showHistory)
      return
    }
    try {
      const resp = await fetch('/api/chat/session')
      if (resp.ok) {
        const data = await resp.json()
        if (data.messages?.length > 0) {
          setHistory(data.messages.map((m: { role: string; content: string; created_at: string }) => ({
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
          })))
        }
      }
    } catch {
      // Failed — no history
    }
    setHistoryLoaded(true)
    setShowHistory(true)
  }

  // Process pending prompt (from URL ?prompt=...)
  useEffect(() => {
    if (pendingPrompt && !streaming) {
      const text = pendingPrompt
      setPendingPrompt(null)
      // Directly execute the send logic
      setMessages(prev => [...prev, { role: 'user', content: text }])
      setStreaming(true)
      // Fire the API call
      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [] }),
      }).then(async (resp) => {
        if (!resp.ok || !resp.body) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request. Please try again.' }])
          setStreaming(false)
          return
        }
        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.text) {
                fullText += json.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              }
              if (json.done) {
                setStreaming(false)
              }
              if (json.error) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: json.error }
                  return updated
                })
                setStreaming(false)
              }
            } catch { /* skip malformed lines */ }
          }
        }
        setStreaming(false)
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

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
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
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: data.error,
                  }
                  return updated
                })
                break
              }
              if (data.text) {
                fullText += data.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: fullText,
                  }
                  return updated
                })
              }
              if (data.done) {
                fullText = data.full_text
                setCount(prev => prev + 1)
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

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
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
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
        {/* Previous conversations toggle */}
        {showHistory && history.length > 0 && (
          <div className="mb-4">
            <div className="bg-nebula/50 border border-white/5 rounded-xl p-4 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase">Previous Conversations</p>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-muted text-xs hover:text-star transition-colors cursor-pointer"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-2">
                {history.map((msg, i) => (
                  <div key={`hist-${i}`} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'text-star/70' : 'text-muted'}`}>
                    <span className="font-semibold text-[10px] uppercase tracking-wide mr-1.5">{msg.role === 'user' ? 'You' : 'Astra'}:</span>
                    {msg.content.length > 150 ? msg.content.slice(0, 147) + '...' : msg.content}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !showHistory && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-star font-display text-xl mb-2">Hello, {userName}</p>
              <p className="text-muted text-sm mb-4">Ask me anything about your chart, your stars, or your path ahead.</p>
            </div>
            <button
              onClick={loadPreviousConversations}
              className="text-violet-light/60 text-xs hover:text-violet-light transition-colors cursor-pointer"
            >
              View previous conversations →
            </button>
          </div>
        )}

        {messages.length === 0 && showHistory && history.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-star font-display text-xl mb-2">Hello, {userName}</p>
              <p className="text-muted text-sm">This is your first conversation. Ask me anything!</p>
            </div>
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
