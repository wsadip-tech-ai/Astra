import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AspectRow from '@/components/chart/AspectRow'
import { MOCK_WESTERN_CHART } from '@/constants/mock-chart'

describe('AspectRow', () => {
  const planets = MOCK_WESTERN_CHART.planets

  it('renders planet names and aspect type', () => {
    const aspect = { planet1: 'Sun', planet2: 'Moon', type: 'opposition' as const, orb: 1.2 }
    render(<AspectRow aspect={aspect} planets={planets} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('☽')).toBeInTheDocument()
    expect(screen.getByText('Opposition')).toBeInTheDocument()
    expect(screen.getByText('1.2°')).toBeInTheDocument()
  })

  it('uses violet styling for harmonious aspects (trine)', () => {
    const aspect = { planet1: 'Sun', planet2: 'Saturn', type: 'trine' as const, orb: 1.0 }
    const { container } = render(<AspectRow aspect={aspect} planets={planets} />)
    expect(container.firstChild).toHaveClass('border-violet/20')
  })

  it('uses rose styling for challenging aspects (square)', () => {
    const aspect = { planet1: 'Venus', planet2: 'Mars', type: 'square' as const, orb: 2.1 }
    const { container } = render(<AspectRow aspect={aspect} planets={planets} />)
    expect(container.firstChild).toHaveClass('border-rose/20')
  })
})
