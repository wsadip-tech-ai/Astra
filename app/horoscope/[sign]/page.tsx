// app/horoscope/[sign]/page.tsx
import { notFound } from 'next/navigation'
import { ZODIAC_SIGNS, ZODIAC_SLUGS, getSignBySlug } from '@/constants/zodiac'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlowButton from '@/components/ui/GlowButton'
import type { Metadata } from 'next'

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
    description: `Today's ${s.name} horoscope. ${s.placeholderHoroscope.slice(0, 120)}...`,
  }
}

export default async function HoroscopePage({ params }: Props) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)
  if (!zodiacSign) notFound()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

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
              "{zodiacSign.placeholderHoroscope}"
            </p>
          </div>

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
