'use client'

import { useState } from 'react'
import AudioPlayer from '@/components/chat/AudioPlayer'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
  streaming?: boolean
}

export default function MessageBubble({ role, content, audioBlob: initialAudioBlob, streaming }: MessageBubbleProps) {
  const [ttsBlob, setTtsBlob] = useState<Blob | null>(initialAudioBlob ?? null)
  const [ttsLoading, setTtsLoading] = useState(false)

  async function handleSpeak() {
    if (ttsBlob || ttsLoading || !content) return
    setTtsLoading(true)
    try {
      const resp = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      if (resp.ok && resp.status !== 204) {
        const buffer = await resp.arrayBuffer()
        setTtsBlob(new Blob([buffer], { type: 'audio/mpeg' }))
      }
    } catch {
      // TTS failed silently — text still visible
    } finally {
      setTtsLoading(false)
    }
  }

  if (role === 'user') {
    return (
      <div className="self-end max-w-[75%]">
        <div className="bg-violet/20 border border-violet/30 rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-star text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="self-start flex gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-rose flex-shrink-0 flex items-center justify-center">
        <span className="text-white text-sm">✦</span>
      </div>
      <div className="bg-nebula border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-start gap-2">
          <p className="text-star text-sm leading-relaxed flex-1">
            {content}
            {streaming && <span className="inline-block w-1.5 h-4 bg-violet-light ml-1 animate-pulse" />}
          </p>
          {!streaming && !ttsBlob && (
            <button
              onClick={handleSpeak}
              disabled={ttsLoading}
              aria-label="Listen to this message"
              className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-violet-light hover:bg-violet/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ttsLoading ? (
                <span className="block w-3 h-3 border border-violet-light border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs">🔊</span>
              )}
            </button>
          )}
        </div>
        {ttsBlob && <AudioPlayer audioBlob={ttsBlob} />}
      </div>
    </div>
  )
}
