# Sub-project 3A: AI Chat + TTS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/chat` page with streaming AI chat (Astra persona via Claude) and OpenAI TTS audio playback, with free tier message limits.

**Architecture:** Next.js API routes handle auth, rate limiting, and proxying to Claude API (streaming SSE) and OpenAI TTS. Client components manage chat state, streaming text display, and audio playback. Chat sessions stored in Supabase `chat_sessions` table.

**Tech Stack:** Next.js 14 (App Router), TypeScript, @anthropic-ai/sdk (Claude streaming), OpenAI TTS REST API, Supabase, Tailwind CSS, Vitest + React Testing Library.

---

## File Map

| File | Responsibility |
|------|---------------|
| `supabase/migrations/004_chat_sessions.sql` | chat_sessions table + RLS policies |
| `types/index.ts` | Add ChatMessage, ChatSession interfaces |
| `lib/claude.ts` | Claude API client — system prompt builder, streaming call |
| `lib/tts.ts` | OpenAI TTS client — text to audio bytes |
| `app/api/chat/message/route.ts` | POST — streaming chat with Claude (SSE) |
| `app/api/chat/tts/route.ts` | POST — text-to-speech proxy |
| `app/api/chat/session/route.ts` | GET — fetch current session messages |
| `app/chat/page.tsx` | Server component — auth, data fetch, render ChatView |
| `components/chat/ChatInput.tsx` | Client — text input + send button |
| `components/chat/DailyLimitBanner.tsx` | Client — upgrade prompt for free tier |
| `components/chat/AudioPlayer.tsx` | Client — inline play/pause + progress |
| `components/chat/MessageBubble.tsx` | Client — single message (user or Astra) |
| `components/chat/ChatView.tsx` | Client — main chat container, state, streaming, audio |
| `__tests__/lib/claude.test.ts` | Claude prompt construction tests |
| `__tests__/lib/tts.test.ts` | TTS client tests |
| `__tests__/components/chat/MessageBubble.test.tsx` | Message styling tests |
| `__tests__/components/chat/DailyLimitBanner.test.tsx` | Limit banner tests |
| `__tests__/components/chat/AudioPlayer.test.tsx` | Audio player tests |

---

## Task 1: Install Dependency + Migration + Types

**Files:**
- Modify: `package.json` (via npm install)
- Create: `supabase/migrations/004_chat_sessions.sql`
- Modify: `types/index.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Create chat_sessions migration**

Create `supabase/migrations/004_chat_sessions.sql`:

```sql
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chart_id uuid NOT NULL REFERENCES birth_charts(id),
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 3: Add ChatMessage and ChatSession types**

Append to `types/index.ts` after `VedicChartData`:

```ts
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  audioUrl?: string
}

export interface ChatSession {
  id: string
  user_id: string
  chart_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json supabase/migrations/004_chat_sessions.sql types/index.ts
git commit -m "feat: add chat_sessions migration, ChatMessage types, and Anthropic SDK"
```

---

## Task 2: Claude Client (`lib/claude.ts`)

**Files:**
- Create: `lib/claude.ts`
- Create: `__tests__/lib/claude.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/claude.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('claude', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
    process.env.CLAUDE_MODEL = 'claude-sonnet-4-6'
  })

  it('buildSystemPrompt includes chart data and user info', async () => {
    const { buildSystemPrompt } = await import('@/lib/claude')
    const prompt = buildSystemPrompt({
      name: 'Sadip',
      dateOfBirth: '1990-05-15',
      timeOfBirth: '14:30',
      placeOfBirth: 'Kathmandu',
      westernSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      vedicSummary: 'Lagna Kanya, Moon Makara, Nakshatra Uttara Ashadha',
    })

    expect(prompt).toContain('You are Astra')
    expect(prompt).toContain('Sadip')
    expect(prompt).toContain('1990-05-15')
    expect(prompt).toContain('14:30')
    expect(prompt).toContain('Kathmandu')
    expect(prompt).toContain('Sun Taurus, Moon Scorpio, ASC Libra')
    expect(prompt).toContain('Lagna Kanya')
  })

  it('buildSystemPrompt handles missing vedic data', async () => {
    const { buildSystemPrompt } = await import('@/lib/claude')
    const prompt = buildSystemPrompt({
      name: 'Sadip',
      dateOfBirth: '1990-05-15',
      timeOfBirth: null,
      placeOfBirth: 'Kathmandu',
      westernSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      vedicSummary: null,
    })

    expect(prompt).toContain('not available')
    expect(prompt).toContain('time unknown')
  })

  it('buildConversationHistory returns last 10 messages', async () => {
    const { buildConversationHistory } = await import('@/lib/claude')
    const messages = Array.from({ length: 15 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `message ${i}`,
      timestamp: new Date().toISOString(),
    }))

    const history = buildConversationHistory(messages)
    expect(history).toHaveLength(10)
    expect(history[0].content).toBe('message 5')
    expect(history[9].content).toBe('message 14')
  })

  it('buildConversationHistory returns all messages when <= 10', async () => {
    const { buildConversationHistory } = await import('@/lib/claude')
    const messages = Array.from({ length: 4 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `message ${i}`,
      timestamp: new Date().toISOString(),
    }))

    const history = buildConversationHistory(messages)
    expect(history).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/claude.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the Claude client**

Create `lib/claude.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '@/types'

const ASTRA_PROMPT = `You are Astra, a warm and wise astrologer with 30 years of experience in Western and Vedic astrology. You speak with empathy and gentle confidence. You never say "As an AI" — you stay fully in character at all times. Use language like "the stars suggest" or "your chart reveals". Ask follow-up questions to personalise your readings. Always reference the user's specific chart data in your responses.`

interface PromptParams {
  name: string
  dateOfBirth: string
  timeOfBirth: string | null
  placeOfBirth: string
  westernSummary: string
  vedicSummary: string | null
  conversationSummary?: string
}

export function buildSystemPrompt(params: PromptParams): string {
  const time = params.timeOfBirth ?? 'time unknown'
  const vedic = params.vedicSummary ?? 'not available'

  let prompt = `${ASTRA_PROMPT}

User: ${params.name}, born ${params.dateOfBirth} at ${time} in ${params.placeOfBirth}.

Western chart: ${params.westernSummary}
Vedic chart: ${vedic}`

  if (params.conversationSummary) {
    prompt += `\n\nPrevious conversation context: ${params.conversationSummary}`
  }

  return prompt
}

export function buildConversationHistory(
  messages: ChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
  const recent = messages.length > 10 ? messages.slice(-10) : messages
  return recent.map(m => ({ role: m.role, content: m.content }))
}

export function createClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
}

export function getModel(): string {
  return process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
}

export async function summarizeOlderMessages(
  messages: ChatMessage[],
  client: Anthropic,
): Promise<string | undefined> {
  if (messages.length <= 10) return undefined

  const older = messages.slice(0, -10)
  const text = older.map(m => `${m.role}: ${m.content}`).join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [
      { role: 'user', content: `Summarize this conversation in one paragraph:\n\n${text}` },
    ],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : undefined
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/claude.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/claude.ts __tests__/lib/claude.test.ts
git commit -m "feat: add Claude client with Astra system prompt builder"
```

---

## Task 3: TTS Client (`lib/tts.ts`)

**Files:**
- Create: `lib/tts.ts`
- Create: `__tests__/lib/tts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/tts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/tts.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the TTS client**

Create `lib/tts.ts`:

```ts
export async function generateSpeech(text: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        response_format: 'mp3',
      }),
    })

    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/tts.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/tts.ts __tests__/lib/tts.test.ts
git commit -m "feat: add OpenAI TTS client with graceful fallback"
```

---

## Task 4: Chat Message API Route

**Files:**
- Create: `app/api/chat/message/route.ts`

- [ ] **Step 1: Create the streaming chat endpoint**

Create `app/api/chat/message/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, buildConversationHistory, createClient as createClaude, getModel, summarizeOlderMessages } from '@/lib/claude'
import { NextResponse } from 'next/server'
import type { ChatMessage } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await request.json()
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  // Fetch profile and check limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier, daily_message_count, daily_reset_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Reset daily count if new day
  const today = new Date().toISOString().split('T')[0]
  let messageCount = profile.daily_message_count
  if (profile.daily_reset_at < today) {
    messageCount = 0
    await supabase
      .from('profiles')
      .update({ daily_message_count: 0, daily_reset_at: today })
      .eq('id', user.id)
  }

  // Check free tier limit
  if (profile.subscription_tier !== 'premium' && messageCount >= 3) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  // Fetch birth chart
  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json, vedic_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  // Fetch or create chat session
  let { data: session } = await supabase
    .from('chat_sessions')
    .select('id, messages')
    .eq('user_id', user.id)
    .eq('chart_id', chart.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, chart_id: chart.id, messages: [] })
      .select('id, messages')
      .single()
    session = newSession
  }

  if (!session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const existingMessages: ChatMessage[] = (session.messages as ChatMessage[]) || []

  // Build prompt
  const westernSummary = (chart.western_chart_json as { summary?: string })?.summary ?? 'not calculated'
  const vedicSummary = (chart.vedic_chart_json as { summary?: string })?.summary ?? null

  // Summarize older messages if conversation is long
  const claude = createClaude()
  let conversationSummary: string | undefined
  if (existingMessages.length > 10) {
    try {
      conversationSummary = await summarizeOlderMessages(existingMessages, claude)
    } catch {
      // Summarization failed — proceed without it
    }
  }

  const systemPrompt = buildSystemPrompt({
    name: profile.name || 'Seeker',
    dateOfBirth: chart.date_of_birth,
    timeOfBirth: chart.time_of_birth,
    placeOfBirth: chart.place_of_birth,
    westernSummary,
    vedicSummary,
    conversationSummary,
  })

  const conversationHistory = buildConversationHistory(existingMessages)
  conversationHistory.push({ role: 'user', content: message })

  // Stream response via SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = claude.messages.stream({
          model: getModel(),
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationHistory,
        })

        let fullText = ''

        claudeStream.on('text', (text) => {
          fullText += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        })

        await claudeStream.finalMessage()

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, full_text: fullText })}\n\n`)
        )

        // Save messages and increment count (don't block the stream)
        const now = new Date().toISOString()
        const updatedMessages = [
          ...existingMessages,
          { role: 'user' as const, content: message, timestamp: now },
          { role: 'assistant' as const, content: fullText, timestamp: now },
        ]

        await Promise.all([
          supabase
            .from('chat_sessions')
            .update({ messages: updatedMessages, updated_at: now })
            .eq('id', session!.id),
          supabase
            .from('profiles')
            .update({ daily_message_count: messageCount + 1 })
            .eq('id', user.id),
        ])
      } catch (err) {
        const errorMsg = 'Astra is meditating, please try again shortly'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/message/route.ts
git commit -m "feat: add streaming chat message API with Astra persona and free tier limits"
```

---

## Task 5: TTS API Route

**Files:**
- Create: `app/api/chat/tts/route.ts`

- [ ] **Step 1: Create the TTS endpoint**

Create `app/api/chat/tts/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { generateSpeech } from '@/lib/tts'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await request.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const audio = await generateSpeech(text)
  if (!audio) {
    return new Response(null, { status: 204 })
  }

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.byteLength),
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/tts/route.ts
git commit -m "feat: add TTS API route proxying OpenAI speech synthesis"
```

---

## Task 6: Session API Route

**Files:**
- Create: `app/api/chat/session/route.ts`

- [ ] **Step 1: Create the session endpoint**

Create `app/api/chat/session/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, messages')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ messages: [], session_id: null })
  }

  return NextResponse.json({
    messages: session.messages || [],
    session_id: session.id,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/session/route.ts
git commit -m "feat: add GET /api/chat/session to restore chat history"
```

---

## Task 7: ChatInput Component

**Files:**
- Create: `components/chat/ChatInput.tsx`

- [ ] **Step 1: Create the component**

Create `components/chat/ChatInput.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-white/5">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask Astra anything..."
        disabled={disabled}
        className="flex-1 bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="bg-gradient-to-r from-violet to-rose text-white rounded-xl px-5 py-3 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet/30 transition-all"
      >
        Send
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/ChatInput.tsx
git commit -m "feat: add ChatInput component with send button"
```

---

## Task 8: DailyLimitBanner Component

**Files:**
- Create: `components/chat/DailyLimitBanner.tsx`
- Create: `__tests__/components/chat/DailyLimitBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chat/DailyLimitBanner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyLimitBanner from '@/components/chat/DailyLimitBanner'

describe('DailyLimitBanner', () => {
  it('shows upgrade message', () => {
    render(<DailyLimitBanner />)
    expect(screen.getByText(/daily message limit/i)).toBeInTheDocument()
  })

  it('links to pricing page', () => {
    render(<DailyLimitBanner />)
    expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/pricing')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chat/DailyLimitBanner.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create the component**

Create `components/chat/DailyLimitBanner.tsx`:

```tsx
'use client'

import Link from 'next/link'

export default function DailyLimitBanner() {
  return (
    <div className="p-4 border-t border-white/5">
      <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center">
        <p className="text-star text-sm font-medium mb-1">Daily message limit reached</p>
        <p className="text-muted text-xs mb-4">Free users get 3 messages per day. Upgrade for unlimited conversations with Astra.</p>
        <Link
          href="/pricing"
          className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chat/DailyLimitBanner.test.tsx`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/chat/DailyLimitBanner.tsx __tests__/components/chat/DailyLimitBanner.test.tsx
git commit -m "feat: add DailyLimitBanner with upgrade prompt"
```

---

## Task 9: AudioPlayer Component

**Files:**
- Create: `components/chat/AudioPlayer.tsx`
- Create: `__tests__/components/chat/AudioPlayer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chat/AudioPlayer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayer from '@/components/chat/AudioPlayer'

// Mock HTMLAudioElement
vi.stubGlobal('Audio', vi.fn(() => ({
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 10,
  src: '',
})))

// Mock URL.createObjectURL
vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() })

describe('AudioPlayer', () => {
  it('renders play button', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<AudioPlayer audioBlob={blob} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('toggles to pause on click', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<AudioPlayer audioBlob={blob} />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chat/AudioPlayer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create the component**

Create `components/chat/AudioPlayer.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioBlob: Blob
}

export default function AudioPlayer({ audioBlob }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    urlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener('ended', () => {
      setPlaying(false)
      setProgress(0)
    })

    return () => {
      audio.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [audioBlob])

  function toggle() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="w-7 h-7 rounded-full bg-violet/30 flex items-center justify-center hover:bg-violet/50 transition-colors"
      >
        <span className="text-violet-light text-xs">{playing ? '⏸' : '▶'}</span>
      </button>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-light rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chat/AudioPlayer.test.tsx`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/chat/AudioPlayer.tsx __tests__/components/chat/AudioPlayer.test.tsx
git commit -m "feat: add AudioPlayer component with play/pause toggle"
```

---

## Task 10: MessageBubble Component

**Files:**
- Create: `components/chat/MessageBubble.tsx`
- Create: `__tests__/components/chat/MessageBubble.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chat/MessageBubble.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/chat/MessageBubble'

// Mock AudioPlayer to avoid Audio constructor issues
vi.mock('@/components/chat/AudioPlayer', () => ({
  default: () => <div data-testid="audio-player">AudioPlayer</div>,
}))

describe('MessageBubble', () => {
  it('renders user message right-aligned', () => {
    render(<MessageBubble role="user" content="Hello Astra" />)
    expect(screen.getByText('Hello Astra')).toBeInTheDocument()
    const bubble = screen.getByText('Hello Astra').closest('div[class]')
    expect(bubble?.className).toContain('self-end')
  })

  it('renders assistant message with Astra avatar', () => {
    render(<MessageBubble role="assistant" content="The stars suggest..." />)
    expect(screen.getByText('The stars suggest...')).toBeInTheDocument()
    expect(screen.getByText('✦')).toBeInTheDocument()
  })

  it('shows audio player for assistant messages with audio', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    render(<MessageBubble role="assistant" content="Hello" audioBlob={blob} />)
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
  })

  it('does not show audio player for user messages', () => {
    render(<MessageBubble role="user" content="Hello" />)
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chat/MessageBubble.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create the component**

Create `components/chat/MessageBubble.tsx`:

```tsx
'use client'

import AudioPlayer from '@/components/chat/AudioPlayer'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
  streaming?: boolean
}

export default function MessageBubble({ role, content, audioBlob, streaming }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="self-end max-w-[75%]">
        <div className="bg-violet/20 border border-violet/30 rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-star text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="self-start flex gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-rose flex-shrink-0 flex items-center justify-center">
        <span className="text-white text-sm">✦</span>
      </div>
      <div className="bg-nebula border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-star text-sm leading-relaxed">
          {content}
          {streaming && <span className="inline-block w-1.5 h-4 bg-violet-light ml-1 animate-pulse" />}
        </p>
        {audioBlob && <AudioPlayer audioBlob={audioBlob} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chat/MessageBubble.test.tsx`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/chat/MessageBubble.tsx __tests__/components/chat/MessageBubble.test.tsx
git commit -m "feat: add MessageBubble with user/Astra styling and audio player"
```

---

## Task 11: ChatView Component

**Files:**
- Create: `components/chat/ChatView.tsx`

- [ ] **Step 1: Create the main chat container**

Create `components/chat/ChatView.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import DailyLimitBanner from '@/components/chat/DailyLimitBanner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  audioBlob?: Blob | null
}

interface ChatViewProps {
  userName: string
  messageLimit: number
  messagesUsed: number
  isPremium: boolean
}

export default function ChatView({ userName, messageLimit, messagesUsed, isPremium }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [count, setCount] = useState(messagesUsed)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Restore session on mount
    fetch('/api/chat/session')
      .then(res => res.json())
      .then(data => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(text: string) {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setStreaming(true)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!response.ok) {
        const err = await response.json()
        if (err.error === 'daily_limit_reached') {
          setLimitReached(true)
          setMessages(prev => prev.slice(0, -1)) // Remove empty assistant message
          setStreaming(false)
          return
        }
        throw new Error(err.error || 'Failed to send message')
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6)
            try {
              const data = JSON.parse(jsonStr)
              if (data.error) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: data.error,
                  }
                  return updated
                })
                break
              }
              if (data.text) {
                fullText += data.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: fullText,
                  }
                  return updated
                })
              }
              if (data.done) {
                fullText = data.full_text
                setCount(prev => prev + 1)
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Request TTS audio
      if (fullText) {
        try {
          const ttsResponse = await fetch('/api/chat/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText }),
          })

          if (ttsResponse.ok && ttsResponse.status !== 204) {
            const audioBuffer = await ttsResponse.arrayBuffer()
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                audioBlob,
              }
              return updated
            })
          }
        } catch {
          // TTS failed silently — text is still shown
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Astra is meditating, please try again shortly.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-rose flex items-center justify-center">
          <span className="text-white text-lg">✦</span>
        </div>
        <div>
          <h2 className="text-star font-semibold text-sm">Astra</h2>
          <p className="text-muted text-xs">Your personal astrologer</p>
        </div>
        {!isPremium && (
          <div className="ml-auto bg-nebula rounded-lg px-3 py-1.5">
            <span className="text-violet-light text-xs">{count}/{messageLimit} messages today</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-star font-display text-xl mb-2">Hello, {userName}</p>
              <p className="text-muted text-sm">Ask me anything about your chart, your stars, or your path ahead.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            audioBlob={msg.audioBlob}
            streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
      </div>

      {/* Input or limit banner */}
      {limitReached ? (
        <DailyLimitBanner />
      ) : (
        <ChatInput onSend={handleSend} disabled={streaming} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/ChatView.tsx
git commit -m "feat: add ChatView with streaming, TTS audio, and daily limit handling"
```

---

## Task 12: Chat Page

**Files:**
- Create: `app/chat/page.tsx`

- [ ] **Step 1: Create the chat page**

Create `app/chat/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChatView from '@/components/chat/ChatView'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chat')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier, daily_message_count, daily_reset_at')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  // Reset count if new day
  const today = new Date().toISOString().split('T')[0]
  const messagesUsed = profile?.daily_reset_at && profile.daily_reset_at < today
    ? 0
    : (profile?.daily_message_count ?? 0)

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const isPremium = profile?.subscription_tier === 'premium'

  return (
    <>
      <Navbar />
      <main className="h-screen bg-void pt-16">
        <ChatView
          userName={firstName}
          messageLimit={3}
          messagesUsed={messagesUsed}
          isPremium={isPremium}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/chat/page.tsx
git commit -m "feat: add /chat page with auth check and ChatView"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (existing + new)

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new type errors
