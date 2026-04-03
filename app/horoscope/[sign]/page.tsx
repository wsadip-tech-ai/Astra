import { notFound } from 'next/navigation'
import { ZODIAC_SIGNS, ZODIAC_SLUGS, getSignBySlug } from '@/constants/zodiac'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlowButton from '@/components/ui/GlowButton'
import type { Metadata } from 'next'
import type { HoroscopeData } from '@/types'

export const revalidate = 86400

interface Props { params: Promise<{ sign: string }> }

export async function generateStaticParams() {
  return ZODIAC_SLUGS.map(sign => ({ sign }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign } = await params
  const s = getSignBySlug(sign)
  if (!s) return {}
  return {
    title: `${s.name} Horoscope Today ${s.symbol} — Astra`,
    description: `Today's ${s.name} horoscope. Daily reading, lucky number, and compatibility.`,
  }
}

async function fetchHoroscope(sign: string): Promise<HoroscopeData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/horoscope/${sign}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function HoroscopePage({ params }: Props) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)
  if (!zodiacSign) notFound()

  const horoscope = await fetchHoroscope(sign)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const reading = horoscope?.reading ?? 'The stars are aligning your reading — please refresh in a moment. If this persists, the horoscope service may be temporarily unavailable.'
  const compatSign = horoscope?.compatibility_sign
    ? getSignBySlug(horoscope.compatibility_sign)
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cosmic-gradient pt-24">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">{zodiacSign.symbol}</div>
            <h1 className="font-display text-5xl text-star mb-2">{zodiacSign.name}</h1>
            <p className="text-muted text-sm mb-1">{zodiacSign.dates}</p>
            <p className="text-muted text-xs">{zodiacSign.element} · Ruled by {zodiacSign.rulingPlanet}</p>
          </div>

          <div className="bg-cosmos border border-violet/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-violet-light text-xs font-semibold tracking-widest uppercase">Today's Reading</span>
              <span className="text-muted text-xs">· {today}</span>
            </div>
            <p className="text-star text-lg leading-relaxed font-display italic">
              "{reading}"
            </p>
          </div>

          {/* Lucky details */}
          {horoscope && (
            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Lucky Number</p>
                <p className="text-star text-2xl font-display">{horoscope.lucky_number}</p>
              </div>
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Lucky Color</p>
                <p className="text-star text-sm font-semibold capitalize">{horoscope.lucky_color}</p>
              </div>
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Best Match</p>
                <p className="text-star text-lg">{compatSign?.symbol ?? '✦'}</p>
                <p className="text-muted text-xs">{compatSign?.name ?? ''}</p>
              </div>
            </div>
          )}

          <div className="mb-10">
            <h2 className="font-display text-xl text-star mb-4">Other signs</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ZODIAC_SIGNS.filter(s => s.slug !== sign).map(s => (
                <a
                  key={s.slug}
                  href={`/horoscope/${s.slug}`}
                  className="bg-nebula/50 hover:bg-violet/10 border border-white/5 hover:border-violet/30 rounded-xl p-3 text-center transition-all"
                >
                  <div className="text-2xl">{s.symbol}</div>
                  <div className="text-xs text-muted mt-1">{s.name}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet/10 to-rose/10 border border-violet/20 rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl text-star mb-3">
              Want a personal reading?
            </h3>
            <p className="text-muted text-sm mb-6">
              Astra can give you a detailed reading based on your exact birth chart — not just your sun sign.
            </p>
            <GlowButton href="/signup" variant="primary">
              Get Your Free Birth Chart ✨
            </GlowButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
