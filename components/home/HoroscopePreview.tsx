// components/home/HoroscopePreview.tsx
import Link from 'next/link'
import { ZODIAC_SIGNS } from '@/constants/zodiac'

export default function HoroscopePreview() {
  return (
    <section className="py-24 px-6 bg-cosmos">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-rose text-xs font-semibold tracking-widest uppercase mb-3">Daily Horoscopes</p>
          <h2 className="font-display text-4xl md:text-5xl text-star mb-4">
            What do the stars say today?
          </h2>
          <p className="text-muted">Select your sign for today's cosmic forecast.</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {ZODIAC_SIGNS.map(sign => (
            <Link
              key={sign.slug}
              href={`/horoscope/${sign.slug}`}
              className="group bg-nebula/50 hover:bg-violet/10 border border-white/5 hover:border-violet/30 rounded-xl p-4 text-center transition-all duration-200"
            >
              <div className="text-3xl mb-2">{sign.symbol}</div>
              <div className="text-star text-xs font-semibold group-hover:text-violet-light transition-colors">
                {sign.name}
              </div>
              <div className="text-muted text-xs mt-1 hidden sm:block">{sign.dates.split('–')[0].trim()}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
