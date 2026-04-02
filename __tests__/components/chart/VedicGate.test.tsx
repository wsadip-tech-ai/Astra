import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VedicGate from '@/components/chart/VedicGate'

describe('VedicGate', () => {
  it('shows upgrade prompt for free users', () => {
    render(<VedicGate tier="free" />)
    expect(screen.getByText('Unlock Vedic Astrology')).toBeInTheDocument()
    expect(screen.getByText('Nakshatra analysis')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade to premium/i })).toHaveAttribute('href', '/pricing')
  })

  it('shows coming soon for premium users', () => {
    render(<VedicGate tier="premium" />)
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.queryByText('Unlock Vedic Astrology')).not.toBeInTheDocument()
  })
})
