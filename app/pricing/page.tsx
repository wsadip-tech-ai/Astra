import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PricingSection from '@/components/home/PricingSection'
import type { Metadata } from 'next'
import { mapProfile } from '@/lib/profile'

export const metadata: Metadata = {
  title: 'Pricing — Astra',
  description: 'Start free. Upgrade for unlimited readings with Astra.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  if (user) {
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null
    isPremium = profile?.subscription_tier === 'premium'
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-16">
        <div className="pt-16">
          <PricingSection isLoggedIn={!!user} isPremium={isPremium} />
        </div>
      </main>
      <Footer />
    </>
  )
}
