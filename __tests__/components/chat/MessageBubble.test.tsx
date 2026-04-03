import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/chat/MessageBubble'

// Mock AudioPlayer to avoid Audio constructor issues
vi.mock('@/components/chat/AudioPlayer', () => ({
  default: () => <div data-testid="audio-player">AudioPlayer</div>,
}))

describe('MessageBubble', () => {
  it('renders user message right-aligned', () => {
    render(<MessageBubble role="user" content="Hello Astra" />)
    expect(screen.getByText('Hello Astra')).toBeInTheDocument()
    const innerDiv = screen.getByText('Hello Astra').closest('div[class]')
    const bubble = innerDiv?.parentElement
    expect(bubble?.className).toContain('self-end')
  })

  it('renders assistant message with Astra avatar', () => {
    render(<MessageBubble role="assistant" content="The stars suggest..." />)
    expect(screen.getByText('The stars suggest...')).toBeInTheDocument()
    expect(screen.getByText('✦')).toBeInTheDocument()
  })

  it('shows audio player for assistant messages with audio', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<MessageBubble role="assistant" content="Hello" audioBlob={blob} />)
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
  })

  it('does not show audio player for user messages', () => {
    render(<MessageBubble role="user" content="Hello" />)
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
  })
})
