'use client'

import AudioPlayer from '@/components/chat/AudioPlayer'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
  streaming?: boolean
}

export default function MessageBubble({ role, content, audioBlob, streaming }: MessageBubbleProps) {
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
        <p className="text-star text-sm leading-relaxed">
          {content}
          {streaming && <span className="inline-block w-1.5 h-4 bg-violet-light ml-1 animate-pulse" />}
        </p>
        {audioBlob && <AudioPlayer audioBlob={audioBlob} />}
      </div>
    </div>
  )
}
