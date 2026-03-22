// constants/zodiac.ts
import type { ZodiacSign } from '@/types'

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    slug: 'aries',
    name: 'Aries',
    symbol: '♈',
    dates: 'March 21 – April 19',
    element: 'Fire',
    rulingPlanet: 'Mars',
    placeholderHoroscope: "The stars align in your favour today, Aries. Your natural boldness is your greatest asset right now — trust your instincts and take the initiative you've been hesitating over. Mars energises your ambitions. A chance encounter could spark a new creative direction.",
  },
  {
    slug: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    dates: 'April 20 – May 20',
    element: 'Earth',
    rulingPlanet: 'Venus',
    placeholderHoroscope: "Venus wraps you in warmth today, Taurus. Your patience is about to pay off in ways you haven't anticipated. Financial matters look favourable — a practical decision made now will yield comfort later. Take time to nourish yourself this evening.",
  },
  {
    slug: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    dates: 'May 21 – June 20',
    element: 'Air',
    rulingPlanet: 'Mercury',
    placeholderHoroscope: "Mercury sharpens your already quick mind today, Gemini. Ideas are flowing — write them down before they scatter like starlight. A conversation with someone unexpected will give you a fresh perspective. Your adaptability is your superpower right now.",
  },
  {
    slug: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    dates: 'June 21 – July 22',
    element: 'Water',
    rulingPlanet: 'Moon',
    placeholderHoroscope: "The Moon calls you inward today, Cancer. Your intuition is extraordinarily sharp — pay attention to the quiet feelings beneath the surface. Home and family matters need gentle attention. An emotional conversation held with care will strengthen a bond.",
  },
  {
    slug: 'leo',
    name: 'Leo',
    symbol: '♌',
    dates: 'July 23 – August 22',
    element: 'Fire',
    rulingPlanet: 'Sun',
    placeholderHoroscope: "The Sun blazes with purpose in your sign, Leo. Your charisma is magnetic today — people are drawn to your warmth and vision. A creative project you've been nurturing is ready to share with the world. Own your spotlight with grace.",
  },
  {
    slug: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    dates: 'August 23 – September 22',
    element: 'Earth',
    rulingPlanet: 'Mercury',
    placeholderHoroscope: "Mercury guides your keen eye for detail today, Virgo. A complex situation becomes clear when you apply your methodical approach. Your acts of service don't go unnoticed. Release the need for perfection in one area — good enough truly is enough today.",
  },
  {
    slug: 'libra',
    name: 'Libra',
    symbol: '♎',
    dates: 'September 23 – October 22',
    element: 'Air',
    rulingPlanet: 'Venus',
    placeholderHoroscope: "Venus graces your relationships with beauty today, Libra. Harmony is within reach — but it requires you to voice what you truly want. A decision you've been weighing will become clearer by evening. Trust that balance is always restored.",
  },
  {
    slug: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    dates: 'October 23 – November 21',
    element: 'Water',
    rulingPlanet: 'Pluto',
    placeholderHoroscope: "Pluto stirs the depths today, Scorpio. What has been hidden is ready to be seen — in yourself and in a situation around you. Your insight cuts through illusion with precision. A transformation you've been resisting is actually the doorway to what you most desire.",
  },
  {
    slug: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    dates: 'November 22 – December 21',
    element: 'Fire',
    rulingPlanet: 'Jupiter',
    placeholderHoroscope: "Jupiter expands your horizons today, Sagittarius. An opportunity to learn or travel presents itself — say yes. Your philosophical nature is craving depth; seek out a conversation or book that challenges your worldview. Freedom found inward is the truest kind.",
  },
  {
    slug: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    dates: 'December 22 – January 19',
    element: 'Earth',
    rulingPlanet: 'Saturn',
    placeholderHoroscope: "Saturn rewards your discipline today, Capricorn. A long-term goal inches closer — the consistency you've quietly maintained is building something solid. Don't overlook a moment of unexpected joy; your serious nature deserves lightness too.",
  },
  {
    slug: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    dates: 'January 20 – February 18',
    element: 'Air',
    rulingPlanet: 'Uranus',
    placeholderHoroscope: "Uranus sparks brilliant ideas today, Aquarius. Your vision for the future is ahead of its time — share it anyway. A community or cause you care about needs your unique perspective. The unconventional path is the right one right now.",
  },
  {
    slug: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    dates: 'February 19 – March 20',
    element: 'Water',
    rulingPlanet: 'Neptune',
    placeholderHoroscope: "Neptune bathes you in intuition today, Pisces. Your compassion is a gift — offer it freely but remember to protect your own energy. A dream or creative vision deserves your attention. The boundary between imagination and reality is thinner than usual; something beautiful can emerge from that space.",
  },
]

export const ZODIAC_SLUGS = ZODIAC_SIGNS.map(s => s.slug)

export function getSignBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find(s => s.slug === slug)
}
