import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('tts', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  it('generateSpeech calls OpenAI TTS with correct params', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const audioBuffer = new ArrayBuffer(8)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => audioBuffer,
    })

    const { generateSpeech } = await import('@/lib/tts')
    const result = await generateSpeech('Hello from Astra')

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/speech',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
        body: expect.stringContaining('"voice":"nova"'),
      }),
    )
  })

  it('generateSpeech returns null when no API key', async () => {
    delete process.env.OPENAI_API_KEY
    const { generateSpeech } = await import('@/lib/tts')
    const result = await generateSpeech('Hello')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('generateSpeech returns null on API error', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const { generateSpeech } = await import('@/lib/tts')
    const result = await generateSpeech('Hello')
    expect(result).toBeNull()
  })
})
