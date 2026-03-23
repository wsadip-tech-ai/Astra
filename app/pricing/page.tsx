// app/pricing/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PricingSection from '@/components/home/PricingSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Astra',
  description: 'Start free. Upgrade for unlimited readings with Astra.',
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-16">
        <div className="pt-16">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </>
  )
}
