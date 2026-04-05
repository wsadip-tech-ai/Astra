import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChartTabs from '@/components/chart/ChartTabs'
import { MOCK_WESTERN_CHART, MOCK_SUMMARY_TEXT } from '@/constants/mock-chart'

describe('ChartTabs', () => {
  const defaultProps = {
    chart: MOCK_WESTERN_CHART,
    vedicChart: null,
    summaryText: MOCK_SUMMARY_TEXT,
    tier: 'free' as const,
  }

  it('renders Overview tab by default with Big 3 and summary', () => {
    render(<ChartTabs {...defaultProps} />)
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Moon')).toBeInTheDocument()
    // Rising sign appears in both the PlanetCard and summary text
    expect(screen.getAllByText(/Libra/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Your Cosmic Blueprint')).toBeInTheDocument()
  })

  it('switches to Planets tab and shows all 10 planets', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /planets/i }))
    expect(screen.getByText('Mercury')).toBeInTheDocument()
    expect(screen.getByText('Pluto')).toBeInTheDocument()
  })

  it('switches to Aspects tab and shows all aspect rows', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /aspects/i }))
    // Multiple oppositions exist in mock data
    expect(screen.getAllByText('Opposition').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Trine')).toBeInTheDocument()
    // All 8 mock aspects should render
    expect(screen.getAllByText(/°/).length).toBe(8)
  })

  it('switches to Vedic tab and shows premium gate for free users', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /vedic/i }))
    expect(screen.getByText('Unlock Vedic Astrology')).toBeInTheDocument()
  })

  it('shows coming soon on Vedic tab for premium users', () => {
    render(<ChartTabs {...defaultProps} tier="premium" />)
    fireEvent.click(screen.getByRole('tab', { name: /vedic/i }))
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})
