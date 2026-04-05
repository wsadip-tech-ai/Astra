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

Their Moon sign (Janma Rasi): ${params.moonSign}
Active Dasha: ${params.currentDasha}
Today's Murthi Nirnaya: ${params.murthi} (Gold=excellent, Silver=good, Copper=moderate, Iron=challenging)

Today's transits:
${params.transitSummary}

Personal transit aspects: ${params.personalAspects}

CRITICAL RULES:
- ONLY reference planet positions and houses listed above. Do NOT invent any positions.
- When mentioning a planet, state which house it is in from their Moon sign and what life area it affects.
- Murthi Nirnaya ${params.murthi} sets the overall tone of the day.
- Connect the most impactful transit to their ${params.currentDasha} period.

Write a warm, actionable reading that:
1. Opens with the day's quality (${params.murthi} day — explain what this means)
2. Highlights the 2 most significant transits by HOUSE POSITION and life area
3. Connects it to their current Dasha period
4. Ends with ONE specific, actionable suggestion (e.g., "take a walk after dinner", "avoid signing contracts today", "call a family member")

Be concise and warm. Use "you/your" language. No generic fluff.`

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
