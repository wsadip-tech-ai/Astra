import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CosmicWeather from '@/components/dashboard/CosmicWeather'
import { MOCK_COSMIC_WEATHER } from '@/constants/mock-chart'

describe('CosmicWeather', () => {
  it('renders all weather entries', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText(/Mercury/)).toBeInTheDocument()
    expect(screen.getByText(/Venus/)).toBeInTheDocument()
    expect(screen.getByText(/Mars/)).toBeInTheDocument()
    expect(screen.getByText(/Jupiter/)).toBeInTheDocument()
  })

  it('shows planet symbols', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText('☿')).toBeInTheDocument()
    expect(screen.getByText('♀')).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText(/cosmic weather/i)).toBeInTheDocument()
  })
})
