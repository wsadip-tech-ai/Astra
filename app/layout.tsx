import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Astra — Your Personal AI Astrologer',
  description: 'Talk to Astra, an AI astrologer with deep knowledge of Western and Vedic astrology. Get your birth chart, daily horoscope, and personalised readings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-void text-star font-body antialiased">
        {children}
      </body>
    </html>
  )
}
