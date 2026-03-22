// app/(auth)/signup/onboarding/page.tsx
import BirthDetailsForm from '@/components/signup/BirthDetailsForm'
import StarField from '@/components/ui/StarField'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-6 relative">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-full bg-cosmos border border-white/10 flex items-center justify-center text-muted text-sm" aria-label="Step 1 of 2, complete">1</div>
          <div className="w-12 h-px bg-violet/40" />
          <div className="w-8 h-8 rounded-full bg-violet flex items-center justify-center text-star text-sm font-semibold" aria-label="Step 2 of 2, current" aria-current="step">2</div>
        </div>
        <div className="bg-cosmos border border-white/5 rounded-2xl p-8">
          <h1 className="font-display text-2xl text-star mb-2">Your birth details</h1>
          <p className="text-muted text-sm mb-6">
            Step 2 of 2 — This is how Astra reads your unique chart.
          </p>
          <BirthDetailsForm />
        </div>
      </div>
    </main>
  )
}
