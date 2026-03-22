import StarField from '@/components/ui/StarField'
import AccountForm from '@/components/signup/AccountForm'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-6 relative">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-full bg-violet flex items-center justify-center text-star text-sm font-semibold">1</div>
          <div className="w-12 h-px bg-white/10" />
          <div className="w-8 h-8 rounded-full bg-cosmos border border-white/10 flex items-center justify-center text-muted text-sm">2</div>
        </div>
        <div className="bg-cosmos border border-white/5 rounded-2xl p-8">
          <h1 className="font-display text-2xl text-star mb-2">Create your account</h1>
          <p className="text-muted text-sm mb-6">Step 1 of 2 — We'll set up your birth chart next</p>
          <AccountForm />
        </div>
      </div>
    </main>
  )
}
