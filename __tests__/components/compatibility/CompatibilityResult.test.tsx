import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CompatibilityResult from '@/components/compatibility/CompatibilityResult'

const mockResult = {
  score: 72,
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'trine', orb: 1.3 },
    { planet1: 'Venus', planet2: 'Mars', type: 'conjunction', orb: 0.8 },
    { planet1: 'Moon', planet2: 'Saturn', type: 'square', orb: 2.1 },
    { planet1: 'Mercury', planet2: 'Jupiter', type: 'sextile', orb: 3.0 },
    { planet1: 'Mars', planet2: 'Pluto', type: 'opposition', orb: 4.2 },
    { planet1: 'Jupiter', planet2: 'Neptune', type: 'trine', orb: 5.1 },
  ],
  summary: 'Key connections: Sun-Moon trine',
  report: null,
  partnerName: 'Sarah',
}

describe('CompatibilityResult', () => {
  it('renders the score', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('shows top 5 aspects for free users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText('Trine')).toBeInTheDocument()
    expect(screen.getByText('Conjunction')).toBeInTheDocument()
  })

  it('shows premium gate for free users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText(/unlock full report/i)).toBeInTheDocument()
  })

  it('shows report for premium users', () => {
    render(
      <CompatibilityResult
        {...mockResult}
        report="Your connection is written in the stars..."
        isPremium={true}
      />
    )
    expect(screen.getByText(/written in the stars/i)).toBeInTheDocument()
  })

  it('shows all aspects for premium users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={true} />)
    // 6th aspect should be visible — two trines in mock data
    expect(screen.getAllByText('Trine').length).toBe(2)
  })
})
