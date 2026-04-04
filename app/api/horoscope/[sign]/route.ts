import { createClient } from '@/lib/supabase/server'
import { generateHoroscope } from '@/lib/horoscope'
import { getSignBySlug } from '@/constants/zodiac'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sign: string }> }
) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)

  if (!zodiacSign) {
    return NextResponse.json({ error: 'Invalid sign' }, { status: 404 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Check cache
  const { data: cached } = await supabase
    .from('astra_horoscopes')
    .select('sign, date, reading, lucky_number, lucky_color, compatibility_sign')
    .eq('sign', sign)
    .eq('date', today)
    .maybeSingle()

  if (cached) {
    return NextResponse.json(cached)
  }

  // Generate
  try {
    const result = await generateHoroscope(zodiacSign)
    if (!result) {
      return NextResponse.json(
        { error: 'Horoscope generation temporarily unavailable' },
        { status: 503 }
      )
    }

    // Save to cache
    const row = {
      sign,
      date: today,
      reading: result.reading,
      lucky_number: result.lucky_number,
      lucky_color: result.lucky_color,
      compatibility_sign: result.compatibility_sign,
    }

    await supabase.from('astra_horoscopes').upsert(row, { onConflict: 'sign,date' })

    return NextResponse.json(row)
  } catch {
    return NextResponse.json(
      { error: 'Horoscope generation temporarily unavailable' },
      { status: 503 }
    )
  }
}
