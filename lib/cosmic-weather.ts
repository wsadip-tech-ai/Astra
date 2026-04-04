import OpenAI from 'openai'

interface CosmicWeatherParams {
  userName: string
  moonSign: string
  currentDasha: string
  transitSummary: string
  personalAspects: string
  murthi: string
}

export async function generateCosmicWeatherReading(params: CosmicWeatherParams): Promise<string | null> {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `You are Astra, a warm Vedic astrologer. Write a concise ~150 word personalized daily cosmic weather reading for ${params.userName}.

Their Moon sign: ${params.moonSign}
Active Dasha: ${params.currentDasha}
Today's Murthi Nirnaya: ${params.murthi}

Today's transits: ${params.transitSummary}

Personal transit aspects: ${params.personalAspects}

Write a warm, actionable reading that:
1. Opens with the day's overall energy (based on Murthi Nirnaya quality)
2. Highlights the most significant personal transit aspect
3. Connects it to their current Dasha period
4. Ends with one specific, actionable suggestion

Be concise and warm. Use "you/your" language.`

    const response = await client.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}
