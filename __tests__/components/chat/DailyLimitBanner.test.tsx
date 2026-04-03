import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyLimitBanner from '@/components/chat/DailyLimitBanner'

describe('DailyLimitBanner', () => {
  it('shows upgrade message', () => {
    render(<DailyLimitBanner />)
    expect(screen.getByText(/daily message limit/i)).toBeInTheDocument()
  })

  it('links to pricing page', () => {
    render(<DailyLimitBanner />)
    expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/pricing')
  })
})
