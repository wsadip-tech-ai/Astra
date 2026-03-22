// app/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import HowItWorks from '@/components/home/HowItWorks'
import MeetAstra from '@/components/home/MeetAstra'
import HoroscopePreview from '@/components/home/HoroscopePreview'
import Testimonials from '@/components/home/Testimonials'
import PricingSection from '@/components/home/PricingSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <MeetAstra />
        <HoroscopePreview />
        <Testimonials />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
