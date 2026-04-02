'use client'

import GlowButton from '@/components/ui/GlowButton'

interface VedicGateProps {
  tier: 'free' | 'premium'
}

export default function VedicGate({ tier }: VedicGateProps) {
  if (tier === 'premium') {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🕉️</div>
        <h3 className="font-display text-2xl text-star mb-2">Vedic Astrology</h3>
        <p className="text-muted text-sm">Coming soon — your Vedic chart will appear here once calculations are ready.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="text-4xl mb-4">🕉️</div>
      <h3 className="font-display text-2xl text-star mb-3">Unlock Vedic Astrology</h3>
      <ul className="text-muted text-sm space-y-2 mb-6 text-left max-w-xs mx-auto">
        <li><span aria-hidden="true">✦ </span>Nakshatra analysis</li>
        <li><span aria-hidden="true">✦ </span>Dasha periods</li>
        <li><span aria-hidden="true">✦ </span>Kundali chart</li>
        <li><span aria-hidden="true">✦ </span>Vedic remedies and insights</li>
      </ul>
      <GlowButton href="/pricing" variant="primary">Upgrade to Premium</GlowButton>
    </div>
  )
}
