import OpenAI from 'openai'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  results.api_key_set = !!process.env.OPENAI_API_KEY
  results.model = process.env.CHAT_MODEL || 'gpt-4o-mini'

  // Test 1: non-streaming
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 30,
      messages: [
        { role: 'system', content: 'You are Astra, a wise astrologer. Reply in one sentence.' },
        { role: 'user', content: 'What does my Capricorn sun mean?' },
      ],
    })
    results.non_stream = resp.choices[0]?.message?.content
  } catch (e: unknown) {
    results.non_stream_error = e instanceof Error ? e.message : String(e)
  }

  // Test 2: streaming (same as chat route does)
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const stream = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 30,
      stream: true,
      messages: [
        { role: 'system', content: 'You are Astra. Reply in one sentence.' },
        { role: 'user', content: 'Hello' },
      ],
    })
    let text = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) text += delta
    }
    results.stream = text
  } catch (e: unknown) {
    results.stream_error = e instanceof Error ? e.message : String(e)
  }

  // Test 3: simulate the exact SSE response the chat route creates
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const s = await openai.chat.completions.create({
          model: process.env.CHAT_MODEL || 'gpt-4o-mini',
          max_tokens: 50,
          stream: true,
          messages: [
            { role: 'system', content: 'You are Astra. Reply briefly.' },
            { role: 'user', content: 'Hi' },
          ],
        })
        let full = ''
        for await (const chunk of s) {
          const t = chunk.choices[0]?.delta?.content
          if (t) {
            full += t
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: t })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, full_text: full })}\n\n`))
        controller.close()
      },
    })

    // Read back the stream to verify
    const reader = readable.getReader()
    const decoder = new TextDecoder()
    let sseOutput = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      sseOutput += decoder.decode(value, { stream: true })
    }
    results.sse_output_preview = sseOutput.slice(0, 300)
    results.sse_ok = sseOutput.includes('"done":true')
  } catch (e: unknown) {
    results.sse_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
