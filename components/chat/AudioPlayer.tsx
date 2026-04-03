'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioBlob: Blob
}

export default function AudioPlayer({ audioBlob }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    urlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener('ended', () => {
      setPlaying(false)
      setProgress(0)
    })

    return () => {
      audio.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [audioBlob])

  function toggle() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="w-7 h-7 rounded-full bg-violet/30 flex items-center justify-center hover:bg-violet/50 transition-colors"
      >
        <span className="text-violet-light text-xs">{playing ? '⏸' : '▶'}</span>
      </button>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-light rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
