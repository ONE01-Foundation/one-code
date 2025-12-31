# Minimal Persistence Loop Implementation Plan

## Step 0: Read-Only Analysis ✅

### Current Flow Confirmed

```
User Input (InputBar)
    ↓
onSendMessage prop called
    ↓
handleSendMessage (app/page.tsx:453)
    ↓
1. Create userMessage + aiMessage (React state)
2. Update chatMessages state immediately
3. Fetch /api/brain with message + bubbleId + chatHistory
    ↓
/api/brain (app/api/brain/route.ts:100)
    ↓
OpenAI API call → returns text reply
    ↓
handleSendMessage receives { reply: string }
    ↓
Word-by-word animation updates chatMessages state
    ↓
❌ NO PERSISTENCE - All data lost on refresh
```

### Safe Insertion Points Identified

#### **Primary Insertion Point: After AI Response (Line 506-507)**
```typescript
const data = await response.json();
const aiResponse = data.reply || "...";
// ✅ INSERT HERE: Call /api/cards/ingest after this line
```

**Why Safe:**
- After successful API response (error handling already in place)
- Before word-by-word animation (doesn't block UI)
- Has all necessary context: message, bubbleId, aiResponse

#### **Secondary Insertion Point: After Animation Completes (Line 544-550)**
```typescript
}, index * 50); // End of word-by-word animation
// ✅ OPTIONAL: Also call here for final persistence (backup)
```

**Why Safe:**
- Non-blocking (async call)
- After UI updates complete
- Good for ensuring final state is persisted

### Files to Touch

#### 1. **NEW: `app/api/cards/ingest/route.ts`**
   - **Why:** New API route for card persistence
   - **Risk:** None (new file, doesn't affect existing code)

#### 2. **MODIFY: `app/api/brain/route.ts`**
   - **Why:** Add structured JSON response (backward compatible)
   - **Risk:** Low (additive change, falls back to text-only if parsing fails)
   - **Line:** ~143-145 (after OpenAI response, before return)

#### 3. **NEW: `lib/card-persistence.ts`**
   - **Why:** Server-side helper for card creation/persistence
   - **Risk:** None (new file, utility function)

#### 4. **MODIFY: `app/page.tsx`**
   - **Why:** Call /api/cards/ingest after AI response
   - **Risk:** Low (additive async call, doesn't block existing flow)
   - **Lines:** ~506-507 (after response.json())

#### 5. **NEW: `supabase/migrations/001_initial_schema.sql`** (or similar)
   - **Why:** Database schema for persistence
   - **Risk:** None (new migration, doesn't touch existing tables)

### Session/User ID Strategy

**Current State:** No session/user system exists
**Solution:** Create guest session on first load, store in localStorage
- Generate session ID: `session_${Date.now()}_${random}`
- Store in localStorage: `one_session_id`
- Include in API calls as `sessionId`

**Why Safe:**
- No existing session code to conflict with
- localStorage is already used (theme, etc.)
- Can upgrade to proper auth later

---

## Step 1: Supabase Schema Plan

### Tables to Create

#### 1. `sessions` (Guest Sessions)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL, -- Client-generated session ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

**Purpose:** Track anonymous guest sessions
**Essential Columns Only:** id, session_id, timestamps

#### 2. `cards`
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  bubble_id TEXT NOT NULL, -- e.g., "bubble-1", "bubble-2-health"
  title TEXT NOT NULL,
  intent TEXT NOT NULL, -- Extracted from AI or user input
  world TEXT, -- "health", "money", "work", etc. (nullable for now)
  state TEXT NOT NULL DEFAULT 'draft', -- draft, active, done, archived
  source TEXT DEFAULT 'ai', -- ai, user, system
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_session_id ON cards(session_id);
CREATE INDEX idx_cards_bubble_id ON cards(bubble_id);
CREATE INDEX idx_cards_state ON cards(state);
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);
```

**Purpose:** Store cards created from AI interactions
**Essential Columns Only:** Core card data + session/bubble linkage

#### 3. `card_events` (Audit Log)
```sql
CREATE TABLE card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- created, updated, state_changed, etc.
  metadata JSONB, -- Flexible event data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_events_card_id ON card_events(card_id);
CREATE INDEX idx_card_events_session_id ON card_events(session_id);
CREATE INDEX idx_card_events_created_at ON card_events(created_at DESC);
```

**Purpose:** Audit trail for card lifecycle
**Essential Columns Only:** Event tracking + metadata JSONB for flexibility

#### 4. `chat_messages` (Optional for MVP)
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  bubble_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session_bubble ON chat_messages(session_id, bubble_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

**Purpose:** Persist chat history
**Status:** Optional for MVP, can be Phase 2

### Migration Strategy

- Single migration file: `supabase/migrations/001_initial_schema.sql`
- Run via Supabase CLI or dashboard
- No existing tables modified

---

## Step 2: API Response Extension Plan

### Modify `/api/brain/route.ts`

**Current Response:**
```typescript
return NextResponse.json({ reply });
```

**New Response (Backward Compatible):**
```typescript
// Try to parse structured response from OpenAI
let suggestedCard = null;
let actions = null;

// If OpenAI response contains structured data, extract it
// Otherwise, return text-only (backward compatible)
if (reply.includes('{"suggestedCard"') || reply.includes('"suggestedCard"')) {
  // Try to extract JSON from response
  // Fallback to text-only if parsing fails
}

return NextResponse.json({
  reply,
  ...(suggestedCard && { suggestedCard }),
  ...(actions && { actions })
});
```

**Better Approach:** Add system prompt instruction to return JSON, parse it:
```typescript
// In system prompt, instruct AI to optionally include structured data
// Parse response, extract JSON if present
// Always return { reply } at minimum (backward compatible)
```

**Backward Compatibility:**
- If parsing fails → return `{ reply: string }` (current behavior)
- If parsing succeeds → return `{ reply, suggestedCard?, actions? }`
- Existing code continues to work (only reads `reply`)

**Risk:** Low - Additive change, fallback to current behavior

---

## Step 3: Adapter Function Plan

### Create `lib/card-persistence.ts`

**Function Signature:**
```typescript
export async function ingestCardFromAI({
  sessionId,
  bubbleId,
  userMessage,
  aiResponse,
  suggestedCard,
}: {
  sessionId: string;
  bubbleId: string;
  userMessage: string;
  aiResponse: string;
  suggestedCard?: { title: string; intent: string; world?: string };
}): Promise<{ cardId?: string; error?: string }>
```

**Logic:**
1. Get or create session in `sessions` table
2. If `suggestedCard` exists:
   - Insert card into `cards` table
   - Insert `card_events` entry (event_type: 'created')
   - Return cardId
3. Always insert chat messages (if chat_messages table exists)
4. Return success/error

**Why Server-Side:**
- Uses service role key (bypasses RLS)
- Secure (no client-side Supabase keys exposed)
- Consistent with existing `/api/one-touch/*` pattern

---

## Step 4: Wiring Plan

### Modify `app/page.tsx` - `handleSendMessage`

**Insertion Point:** After line 507 (`const aiResponse = data.reply`)

**Code Addition:**
```typescript
// After successful AI response
const aiResponse = data.reply || "...";

// ✅ NEW: Persist card if suggested (non-blocking)
if (data.suggestedCard) {
  // Get or create session ID
  const sessionId = getOrCreateSessionId();
  
  // Call ingestion API (fire and forget - don't block UI)
  fetch("/api/cards/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      bubbleId,
      userMessage: message,
      aiResponse,
      suggestedCard: data.suggestedCard,
    }),
  }).catch(err => console.error("Card ingestion failed:", err));
  // Ignore errors - persistence should not block UI
}

// Continue with existing word-by-word animation...
```

**Helper Function (in same file):**
```typescript
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "one_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}
```

**Why Safe:**
- Non-blocking (async, errors ignored)
- Doesn't modify existing flow
- Only adds persistence call
- Existing UI continues to work even if persistence fails

---

## Files Changed Summary

### New Files (5)
1. `app/api/cards/ingest/route.ts` - New API route
2. `lib/card-persistence.ts` - Server-side helper
3. `supabase/migrations/001_initial_schema.sql` - Database schema
4. `IMPLEMENTATION_PLAN.md` - This file
5. `ROLLBACK_PLAN.md` - Rollback instructions (to be created)

### Modified Files (2)
1. `app/api/brain/route.ts` - Add structured JSON response (backward compatible)
2. `app/page.tsx` - Add persistence call after AI response

### Total Impact
- **7 files** touched
- **2 existing files** modified (additive changes only)
- **5 new files** created
- **Zero breaking changes** to existing UI

---

## Rollback Plan

### If Issues Occur

#### Quick Rollback (Disable Persistence)
1. Comment out persistence call in `app/page.tsx` (line ~507)
2. Keep API routes intact (they'll just not be called)
3. **Time:** 1 minute

#### Full Rollback (Remove All Changes)
1. Revert `app/api/brain/route.ts` to original (remove structured JSON)
2. Remove persistence call from `app/page.tsx`
3. Delete new files:
   - `app/api/cards/ingest/route.ts`
   - `lib/card-persistence.ts`
4. Drop Supabase tables (if created):
   ```sql
   DROP TABLE IF EXISTS chat_messages CASCADE;
   DROP TABLE IF EXISTS card_events CASCADE;
   DROP TABLE IF EXISTS cards CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   ```
5. **Time:** 5 minutes

### Data Safety
- All changes are **additive**
- Existing functionality **unchanged**
- Can rollback without data loss (no existing data to lose)
- Supabase tables can be dropped/recreated safely

---

## Success Criteria

### MVP Loop Achieved When:
1. ✅ User types message → AI responds
2. ✅ If AI suggests card → Card created in Supabase
3. ✅ Card persists across page refreshes
4. ✅ Existing UI continues to work (no regressions)
5. ✅ Can query cards via Supabase dashboard

### Not Required for MVP:
- ❌ Chat message persistence (Phase 2)
- ❌ Card display in UI (Phase 2)
- ❌ Card editing/deletion (Phase 2)
- ❌ User authentication (Phase 2)

---

**Next Steps:**
1. Review and approve plan
2. Create Supabase schema (Step 1)
3. Modify API response (Step 2)
4. Create adapter (Step 3)
5. Wire up persistence (Step 4)
6. Test end-to-end

