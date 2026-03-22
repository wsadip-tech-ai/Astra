// components/home/Testimonials.tsx
const testimonials = [
  {
    quote: "Astra's reading of my Vedic chart was more insightful than anything I've received from a human astrologer. She knew exactly which Nakshatra questions to ask.",
    name: "Priya S.",
    sign: "Scorpio ♏",
    avatar: "🌙",
  },
  {
    quote: "I was sceptical about AI astrology, but talking to Astra by voice felt genuinely warm. She remembered my chart details and gave me real comfort during a hard time.",
    name: "Marcus T.",
    sign: "Aquarius ♒",
    avatar: "⭐",
  },
  {
    quote: "The combination of Western and Vedic analysis in one place is something I've never found before. Astra explained my Dasha period in a way that finally made sense.",
    name: "Anita R.",
    sign: "Taurus ♉",
    avatar: "✦",
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-void">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl text-star">
            What seekers are saying
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-cosmos border border-white/5 rounded-2xl p-8">
              <div className="text-3xl mb-4">{t.avatar}</div>
              <p className="text-muted text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div>
                <div className="text-star text-sm font-semibold">{t.name}</div>
                <div className="text-violet-light text-xs">{t.sign}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
