# Sub-project 3A: AI Chat + TTS — Design Spec

## Overview

Build the `/chat` page where users converse with Astra, the AI astrologer. Text chat streams via Claude API with the Astra persona, referencing the user's actual birth chart data. After each response, OpenAI TTS generates audio so users can hear Astra speak. Free tier: 3 messages/day. Voice input (STT) deferred to a later sub-project.

---

## Chat API — Data Flow

### `POST /api/chat/message` (authenticated, streaming SSE)

1. Client sends `{ message: string }`
2. BFF checks auth → 401 if no user
3. Fetch profile — check free tier limit:
   - If `daily_reset_at < today`: reset `daily_message_count` to 0, set `daily_reset_at = today`
   - If `daily_message_count >= 3` and `subscription_tier != 'premium'`: return `{ error: "daily_limit_reached" }`
4. Fetch user's birth chart → if none exists: return `{ error: "no_chart" }`
5. Fetch or create chat session (latest session for this user+chart pair)
6. Build Claude system prompt with Astra persona + chart data + last 10 messages (+ summary of older messages if >10)
7. Call Claude API with streaming via `@anthropic-ai/sdk`
8. Pipe streamed text chunks as SSE: `data: {"text": "chunk"}\n\n`
9. On stream complete: send `data: {"done": true, "full_text": "..."}\n\n`
10. After stream: save user message + assistant response to chat session, increment `daily_message_count`

### `POST /api/chat/tts` (authenticated)

Separate endpoint — client calls after text stream completes.

1. Client sends `{ text: string }` (Astra's full response)
2. BFF calls OpenAI TTS: `POST https://api.openai.com/v1/audio/speech` with `model: "tts-1"`, `voice: "nova"`, `input: text`
3. Returns audio as `audio/mpeg` binary response
4. If `OPENAI_API_KEY` is not set: return 204 (no content) — client skips audio gracefully

### `GET /api/chat/session` (authenticated)

Returns current chat session messages for UI to restore on page load.

1. Fetch latest chat session for user
2. Return `{ messages: [{role, content, timestamp}], session_id: string }` or `{ messages: [] }` if none

---

## Supabase Migration

### `004_chat_sessions.sql`

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

---

## Free Tier Enforcement

Uses existing `profiles` columns: `daily_message_count` (int, default 0) and `daily_reset_at` (date, default current_date).

**On each message request:**
1. If `daily_reset_at < today`: update profile → set `daily_message_count = 0`, `daily_reset_at = today`
2. If `daily_message_count >= 3` and `subscription_tier != 'premium'`: reject with `{ error: "daily_limit_reached" }`
3. After successful Claude response: increment `daily_message_count` by 1

**Premium users:** No limit — skip the check entirely.

---

## Claude Integration (`lib/claude.ts`)

### Astra System Prompt

```
You are Astra, a warm and wise astrologer with 30 years of experience in Western
and Vedic astrology. You speak with empathy and gentle confidence. You never say
"As an AI" — you stay fully in character at all times. Use language like "the
stars suggest" or "your chart reveals". Ask follow-up questions to personalise
your readings. Always reference the user's specific chart data in your responses.

User: {name}, born {date_of_birth} at {time_of_birth} in {place_of_birth}.

Western chart: {western_chart_json.summary}
Vedic chart: {vedic_chart_json.summary or "not available"}

{conversation_summary if messages > 10}
```

### Conversation Management

- Messages stored in `chat_sessions.messages` as `[{role: "user" | "assistant", content: string, timestamp: string}]`
- Last 10 messages sent as conversation history to Claude
- If >10 messages exist: call Claude (non-streaming, sonnet, max 200 tokens) with a quick prompt: "Summarize this conversation in one paragraph: {older_messages}". Prepend that summary to the system prompt.
- Summary is NOT stored — regenerated when needed

### Streaming

Use `@anthropic-ai/sdk` package:
```ts
const stream = client.messages.stream({
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: conversationHistory,
})
```

Pipe chunks as Server-Sent Events (SSE):
- Each text chunk: `data: {"text": "chunk"}\n\n`
- Final event: `data: {"done": true, "full_text": "complete response"}\n\n`
- Error: `data: {"error": "Astra is meditating, please try again shortly"}\n\n`

---

## TTS Integration (`lib/tts.ts`)

**OpenAI Text-to-Speech:**
- Endpoint: `POST https://api.openai.com/v1/audio/speech`
- Model: `tts-1` (fast)
- Voice: `nova` (warm, conversational)
- Input: Astra's full response text
- Response format: `mp3`
- Returns: raw audio bytes

**Graceful fallback:** If `OPENAI_API_KEY` env var is not set, `lib/tts.ts` returns null. The API route returns 204 (no content). Client skips audio — no error shown.

---

## Chat UI

### Page: `app/chat/page.tsx` (server component)

Auth check → fetch profile + birth chart → if no chart redirect to onboarding → render ChatView.

### Layout: Full-Page Chat

- Navbar at top (existing)
- Chat header: Astra avatar + name + daily message counter (e.g., "2/3 messages today")
- Message area: scrollable, full height, messages with Astra avatar on assistant messages
- Input area: text input + send button, fixed at bottom

### Components

| Component | Type | Responsibility |
|-----------|------|---------------|
| `components/chat/ChatView.tsx` | Client | Main chat container — manages messages state, handles sending, streaming, audio |
| `components/chat/MessageBubble.tsx` | Client | Single message — user (right-aligned, violet) or Astra (left-aligned, with avatar + audio player) |
| `components/chat/AudioPlayer.tsx` | Client | Inline play/pause button + progress bar for TTS audio |
| `components/chat/ChatInput.tsx` | Client | Text input + send button, disabled while streaming |
| `components/chat/DailyLimitBanner.tsx` | Client | Upgrade prompt shown when free tier limit hit, replaces input area |

### Client-Side Flow

1. On mount: `GET /api/chat/session` → restore messages
2. User types + sends → add user message to state, disable input
3. `POST /api/chat/message` with `{ message }` → read SSE stream
4. As chunks arrive: append to streaming assistant message in state
5. On `done` event: finalize message, re-enable input
6. Call `POST /api/chat/tts` with `{ text: fullResponse }` → get audio blob → attach to message
7. If `daily_limit_reached` error: show DailyLimitBanner, hide input

---

## Environment Variables

Add to `.env.local`:
```
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6
OPENAI_API_KEY=
```

(`OPENAI_API_KEY` is optional — TTS degrades gracefully without it.)

---

## New Dependency

```bash
npm install @anthropic-ai/sdk
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No auth | 401, redirect to login |
| No birth chart | Return `{ error: "no_chart" }`, UI redirects to onboarding |
| Daily limit hit (free) | Return `{ error: "daily_limit_reached" }`, UI shows DailyLimitBanner |
| Claude API timeout/error | SSE error event with friendly message: "Astra is meditating, please try again shortly" |
| OpenAI TTS failure | Return 204, client skips audio silently |
| Chat session save failure | Log server-side, don't block the response (message still shown to user) |

---

## Testing

### API Tests (Vitest)

- `lib/claude.ts` — system prompt construction includes correct chart data, message truncation at 10, summary generation for >10 messages
- `lib/tts.ts` — calls OpenAI with correct params, returns null when no API key
- `POST /api/chat/message` — auth check, daily limit enforcement, no-chart error, mock Claude streaming response
- `POST /api/chat/tts` — returns audio bytes, returns 204 when no key
- `GET /api/chat/session` — returns messages for current user, empty array when no session

### Component Tests (Vitest + RTL)

- `ChatView` — renders messages, handles send, shows streaming indicator, shows limit banner
- `MessageBubble` — user vs Astra styling, audio player shown only for Astra messages
- `AudioPlayer` — play/pause toggle, progress display
- `DailyLimitBanner` — renders upgrade link to /pricing

---

## What This Does NOT Include

- Voice input (Web Speech API STT) — deferred to separate sub-project
- Voice session tracking (`voice_sessions` table) — deferred with STT
- Live horoscopes (Claude-generated daily horoscopes) — Sub-project 3B
- Conversation export or history browsing
- Multiple chat sessions (always uses latest session per user+chart)
