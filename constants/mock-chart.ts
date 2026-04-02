import type { WesternChartData, CosmicWeatherEntry } from '@/types'

export const MOCK_WESTERN_CHART: WesternChartData = {
  summary: 'Sun Taurus, Moon Scorpio, ASC Libra',
  planets: [
    { name: 'Sun', symbol: '☉', sign: 'Taurus', degree: 24, house: 10, retrograde: false },
    { name: 'Moon', symbol: '☽', sign: 'Scorpio', degree: 8, house: 4, retrograde: false },
    { name: 'Mercury', symbol: '☿', sign: 'Taurus', degree: 12, house: 10, retrograde: false },
    { name: 'Venus', symbol: '♀', sign: 'Gemini', degree: 2, house: 9, retrograde: false },
    { name: 'Mars', symbol: '♂', sign: 'Pisces', degree: 18, house: 6, retrograde: false },
    { name: 'Jupiter', symbol: '♃', sign: 'Cancer', degree: 6, house: 10, retrograde: false },
    { name: 'Saturn', symbol: '♄', sign: 'Capricorn', degree: 25, house: 4, retrograde: true },
    { name: 'Uranus', symbol: '♅', sign: 'Capricorn', degree: 9, house: 4, retrograde: true },
    { name: 'Neptune', symbol: '♆', sign: 'Capricorn', degree: 14, house: 4, retrograde: true },
    { name: 'Pluto', symbol: '♇', sign: 'Scorpio', degree: 16, house: 2, retrograde: true },
  ],
  houses: [
    { number: 1, sign: 'Libra', degree: 15 },
    { number: 2, sign: 'Scorpio', degree: 12 },
    { number: 3, sign: 'Sagittarius', degree: 14 },
    { number: 4, sign: 'Capricorn', degree: 18 },
    { number: 5, sign: 'Aquarius', degree: 20 },
    { number: 6, sign: 'Pisces', degree: 18 },
    { number: 7, sign: 'Aries', degree: 15 },
    { number: 8, sign: 'Taurus', degree: 12 },
    { number: 9, sign: 'Gemini', degree: 14 },
    { number: 10, sign: 'Cancer', degree: 18 },
    { number: 11, sign: 'Leo', degree: 20 },
    { number: 12, sign: 'Virgo', degree: 18 },
  ],
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'opposition', orb: 1.2 },
    { planet1: 'Sun', planet2: 'Jupiter', type: 'sextile', orb: 0.8 },
    { planet1: 'Sun', planet2: 'Saturn', type: 'trine', orb: 1.0 },
    { planet1: 'Moon', planet2: 'Pluto', type: 'conjunction', orb: 0.5 },
    { planet1: 'Venus', planet2: 'Mars', type: 'square', orb: 2.1 },
    { planet1: 'Jupiter', planet2: 'Saturn', type: 'opposition', orb: 1.5 },
    { planet1: 'Mercury', planet2: 'Jupiter', type: 'sextile', orb: 1.8 },
    { planet1: 'Mars', planet2: 'Neptune', type: 'conjunction', orb: 0.9 },
  ],
}

export const MOCK_COSMIC_WEATHER: CosmicWeatherEntry[] = [
  { planet: 'Mercury', symbol: '☿', sign: 'Aries', description: 'Communication gets direct and assertive — speak your mind today' },
  { planet: 'Venus', symbol: '♀', sign: 'Taurus', description: 'Love slows down and deepens — enjoy the simple pleasures' },
  { planet: 'Mars', symbol: '♂', sign: 'Gemini', description: 'Energy scatters across many interests — focus on one thing at a time' },
  { planet: 'Jupiter', symbol: '♃', sign: 'Cancer', description: 'Expansion through home and family — nurture your roots' },
]

export const MOCK_SUMMARY_TEXT = `Your Taurus Sun gives you grounded determination and an appreciation for life's finer things. With your Moon in Scorpio, you feel emotions deeply and possess powerful intuition. Libra rising means you present a harmonious, diplomatic exterior to the world — balancing your earthy core with social grace.`

/** Map sign names to one-word traits for the dashboard cosmic profile cards */
export const SIGN_TRAITS: Record<string, string> = {
  Aries: 'Bold',
  Taurus: 'Grounded',
  Gemini: 'Curious',
  Cancer: 'Nurturing',
  Leo: 'Radiant',
  Virgo: 'Analytical',
  Libra: 'Diplomatic',
  Scorpio: 'Intense',
  Sagittarius: 'Adventurous',
  Capricorn: 'Ambitious',
  Aquarius: 'Visionary',
  Pisces: 'Intuitive',
}
