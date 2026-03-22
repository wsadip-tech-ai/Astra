// components/layout/Footer.tsx
import Link from 'next/link'
import { ZODIAC_SIGNS } from '@/constants/zodiac'

export default function Footer() {
  return (
    <footer className="bg-cosmos border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-display text-xl text-star mb-2">✦ Astra</div>
          <p className="text-muted text-sm leading-relaxed">
            Your personal AI astrologer, available 24/7. Powered by Claude AI.
          </p>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Explore</h4>
          <ul className="flex flex-col gap-2">
            {[
              ['Daily Horoscope', '/horoscope/aries'],
              ['Meet Astra', '/astrologer'],
              ['Birth Chart', '/chart'],
              ['Compatibility', '/compatibility'],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-muted hover:text-star text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Zodiac Signs</h4>
          <ul className="grid grid-cols-2 gap-1">
            {ZODIAC_SIGNS.slice(0, 6).map(sign => (
              <li key={sign.slug}>
                <Link href={`/horoscope/${sign.slug}`} className="text-muted hover:text-star text-xs transition-colors">
                  {sign.symbol} {sign.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Account</h4>
          <ul className="flex flex-col gap-2">
            {[['Sign up free', '/signup'], ['Sign in', '/login'], ['Pricing', '/pricing']].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-muted hover:text-star text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3">
        <p className="text-muted text-xs">© 2026 Astra. All rights reserved.</p>
        <p className="text-muted text-xs">Powered by Claude AI · Built with ✦</p>
      </div>
    </footer>
  )
}
