import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayer from '@/components/chat/AudioPlayer'

// Mock HTMLAudioElement
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 10,
  src: '',
}
vi.stubGlobal('Audio', vi.fn().mockImplementation(function () {
  return mockAudio
}))

// Mock URL.createObjectURL
vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() })

describe('AudioPlayer', () => {
  it('renders play button', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<AudioPlayer audioBlob={blob} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('toggles to pause on click', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<AudioPlayer audioBlob={blob} />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })
})
