import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlanetCard from '@/components/chart/PlanetCard'

describe('PlanetCard', () => {
  const planet = {
    name: 'Sun',
    symbol: '☉',
    sign: 'Taurus',
    degree: 24,
    house: 10,
    retrograde: false,
  }

  it('renders planet name, symbol, sign, degree, and house', () => {
    render(<PlanetCard planet={planet} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Taurus 24°')).toBeInTheDocument()
    expect(screen.getByText('10th House')).toBeInTheDocument()
  })

  it('shows retrograde badge when retrograde is true', () => {
    render(<PlanetCard planet={{ ...planet, retrograde: true }} />)
    expect(screen.getByText('℞')).toBeInTheDocument()
  })

  it('does not show retrograde badge when retrograde is false', () => {
    render(<PlanetCard planet={planet} />)
    expect(screen.queryByText('℞')).not.toBeInTheDocument()
  })

  it('renders with variant="hero" for Big 3 styling', () => {
    const { container } = render(<PlanetCard planet={planet} variant="hero" />)
    expect(container.firstChild).toHaveClass('border-violet/30')
  })
})
