// components/ui/PlanCard.tsx
'use client'
import GlowButton from './GlowButton'

interface PlanFeature { text: string; included: boolean }

interface PlanCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: PlanFeature[]
  ctaText: string
  ctaHref: string
  ctaOnClick?: () => void
  highlighted?: boolean
}

export default function PlanCard({
  name, price, period, description, features, ctaText, ctaHref, ctaOnClick, highlighted
}: PlanCardProps) {
  return (
    <div className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
      highlighted
        ? 'bg-gradient-to-b from-violet/20 to-rose/10 border border-violet/40 shadow-xl shadow-violet/20'
        : 'bg-cosmos border border-white/10'
    }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet to-rose text-white text-xs font-semibold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div>
        <h3 className="font-display text-xl text-star">{name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-star">{price}</span>
          {period && <span className="text-muted text-sm">{period}</span>}
        </div>
        <p className="mt-2 text-muted text-sm">{description}</p>
      </div>
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f, i) => (
          <li key={f.text} className="flex items-center gap-2 text-sm">
            <span className={f.included ? 'text-violet-light' : 'text-muted'}>
              {f.included ? '✓' : '○'}
            </span>
            <span className={f.included ? 'text-star' : 'text-muted'}>{f.text}</span>
          </li>
        ))}
      </ul>
      <GlowButton
        href={ctaOnClick ? undefined : ctaHref}
        onClick={ctaOnClick}
        variant={highlighted ? 'primary' : 'secondary'}
      >
        {ctaText}
      </GlowButton>
    </div>
  )
}
