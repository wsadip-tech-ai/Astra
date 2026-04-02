import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import { MOCK_WESTERN_CHART } from '@/constants/mock-chart'

describe('CosmicProfile', () => {
  it('renders Big 3 with sign names and traits', () => {
    render(<CosmicProfile chart={MOCK_WESTERN_CHART} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('Taurus')).toBeInTheDocument()
    expect(screen.getByText('Grounded')).toBeInTheDocument()
    expect(screen.getByText('☽')).toBeInTheDocument()
    expect(screen.getByText('Scorpio')).toBeInTheDocument()
    expect(screen.getByText('Intense')).toBeInTheDocument()
    expect(screen.getByText('Libra')).toBeInTheDocument()
    expect(screen.getByText('Diplomatic')).toBeInTheDocument()
  })

  it('links to /chart', () => {
    render(<CosmicProfile chart={MOCK_WESTERN_CHART} />)
    expect(screen.getByRole('link', { name: /view full chart/i })).toHaveAttribute('href', '/chart')
  })
})
