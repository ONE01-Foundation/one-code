# ONE01 / One-Life Project Map

**Generated:** 2025-01-XX  
**Purpose:** Architecture audit, routes, state, persistence, AI integration mapping  
**Status:** Read-only mapping (no refactoring)

---

## A) ROUTES MAP

### Root Layout
- **File:** `app/layout.tsx`
- **Purpose:** Root HTML wrapper, font loading (Geist, Geist Mono), global CSS
- **Applies to:** All routes
- **No route groups** - flat structure

### Pages

#### `/` (Home)
- **File:** `app/page.tsx`
- **Component:** `<OneScreen />` from `components/OneScreen.tsx`
- **Purpose:** Main application entry point - Life Loop Engine

#### `/connect`
- **File:** `app/connect/page.tsx`
- **Component:** `ConnectPage` (QR code creation for desktop-to-mobile pairing)
- **Purpose:** Desktop QR code generation, polling for mobile claim

#### `/claim`
- **File:** `app/claim/page.tsx`
- **Component:** `ClaimPage` (wraps `ClaimContent` with Suspense)
- **Purpose:** Mobile web claim page - scans QR code to pair devices

### API Routes

#### `/api/nobody` (GET)
- **File:** `app/api/nobody/route.ts`
- **Purpose:** Returns Nobody prompt JSON (legacy, for initial onboarding)
- **Returns:** `{ say: {title, subtitle}, choices: [{id,label}], card: {...} }`

#### `/api/nobody/step` (POST)
- **File:** `app/api/nobody/step/route.ts`
- **Purpose:** First real AI integration - compresses user text into ONE next step
- **Input:** `{ text: string, makeEasier?: boolean }`
- **Output:** `OneNextStep` schema (title, why, durationMinutes, energy, domain, buttons)
- **Rate limit:** 10 requests/minute per IP (in-memory)

#### `/api/distill` (POST)
- **File:** `app/api/distill/route.ts`
- **Purpose:** AI distillation - reduces user input to single intent + action
- **Input:** `{ text: string }`
- **Output:** `{ intent: string, category: IntentCategory, action: string }`

#### `/api/brain` (POST)
- **File:** `app/api/brain/route.ts`
- **Purpose:** General AI brain endpoint (uses OpenAI responses API)
- **Input:** `{ text: string }`
- **Output:** AI response text

#### `/api/health` (GET)
- **File:** `app/api/health/route.ts`
- **Purpose:** Health check endpoint

#### `/api/one-touch/create` (POST)
- **File:** `app/api/one-touch/create/route.ts`
- **Purpose:** Creates QR code session for device pairing (Supabase-backed)

#### `/api/one-touch/claim` (POST)
- **File:** `app/api/one-touch/claim/route.ts`
- **Purpose:** Claims a QR code session from mobile device

#### `/api/one-touch/status` (GET)
- **File:** `app/api/one-touch/status/route.ts`
- **Purpose:** Polls session status (pending/claimed/expired)

### Unused/Placeholder Routes
- `app/card/[id]/` - Directory exists but no page.tsx
- `app/cards/` - Directory exists but no page.tsx
- `app/global/` - Directory exists but no page.tsx
- `app/intent/` - Directory exists but no page.tsx

---

## B) UI ROOT + HOME MAP

### Root UI Structure

#### Global Layout
- **File:** `app/layout.tsx`
- **Fonts:** Geist Sans, Geist Mono (via CSS variables)
- **Global CSS:** `app/globals.css`
  - CSS variables for theming (--background, --foreground, --border, --neutral-*)
  - Dark mode via `[data-theme="dark"]` attribute
  - Tailwind CSS import

#### Home Screen Entry
- **File:** `app/page.tsx` → `components/OneScreen.tsx`
- **Main Component:** `OneScreen` (1320 lines - orchestrates all engines)

### Home Screen Child Components

#### Core UI Components (`components/ui/`)
1. **HomeContent.tsx** - Unified UI structure, switches content based on state
2. **AskNobodyInput.tsx** - Input bar for "Tell me what you need..." (empty state)
3. **StepSuggestion.tsx** - AI-generated step card display (suggestion state)
4. **ActiveStepCard.tsx** - Active step card view with "Done" button
5. **CenterCard.tsx** - Legacy active card bubble (from Cards Lifecycle)
6. **SideBubbles.tsx** - Side bubbles showing next/context/last done cards (max 3)
7. **DeckView.tsx** - Deck panel showing last 10 cards (modal overlay)
8. **CardDetailView.tsx** - Read-only card detail view (modal overlay)
9. **NobodyPrompt.tsx** - Legacy Nobody prompt UI (skeleton, staged reveal, timeout)
10. **NobodyPresence.tsx** - Subtle "Nobody" presence with "Yes"/"Not now" buttons
11. **StepPrompt.tsx** - "What feels easiest to do next?" prompt with 4 options
12. **DomainChoice.tsx** - Initial domain selection (Work/Health/Mind/Relationships/Other)
13. **DebugPanel.tsx** - Dev-only debug info (scope, cards, data source)

### Home State Machine

**File:** `lib/home-state.ts`

**States:**
- `loading` - Initial fetch, shows nothing else
- `empty` - No active card + CTA "Find next step" + Ask Nobody input
- `suggestion` - System suggests next step (AI-generated or legacy prompt)
- `active` - User is doing a step (active step card or legacy active card)
- `completed` - Step done → short confirmation "Good. Next?" (2s auto-reset)

**State Decision Logic:**
```typescript
determineHomeState({
  hasActiveCard: !!activeCard || !!activeStepCard,
  hasSuggestion: !!stepSuggestion || !!actionLoopPlan || showPrompt,
  hasPrompt: showPrompt,
  isLoading: (promptState === "loading" || isGenerating || isGeneratingStep) && !isCompleted,
  isCompleted: isCompleted || showCompletedMessage,
})
```

**Priority Order:**
1. `loading` (if isLoading)
2. `completed` (if isCompleted)
3. `active` (if hasActiveCard)
4. `suggestion` (if hasSuggestion || hasPrompt)
5. `empty` (default)

---

## C) STATE + PERSISTENCE MAP

### State Management Architecture

**No global state library** (no Zustand, Redux, Context API for app state)

**State lives in:**
- React `useState` hooks in `OneScreen.tsx` (main orchestrator)
- Custom hooks: `useScope`, `useCards`, `useNobody`
- Local component state in UI components

### Custom Hooks

#### `hooks/useScope.ts`
- **State:** `scope: "private" | "global"`
- **Persistence:** `localStorage.getItem("one_scope")`
- **Purpose:** Global/Private toggle (hydration-safe with `mounted` guard)

#### `hooks/useCards.ts`
- **State:** `activeCard`, `visibleCards` (max 3)
- **Persistence:** `localStorage.getItem("one_cards")`
- **Purpose:** Cards Lifecycle - single active card rule, auto-promotion

#### `hooks/useNobody.ts`
- **State:** `showPrompt`, `promptData`, `promptState` (idle|loading|ready|timeout)
- **Persistence:** `localStorage.getItem("one_nobody_first_run")`, `nobody:last` (cache)
- **Purpose:** Nobody prompt state, first run flag, caching

### localStorage Keys Inventory

#### Versioned Keys (v1)
- `one01:v1:cards` - Step cards array (new system)
- `one01:v1:activeCardId` - Active step card ID (new system)

#### Legacy Keys
- `one_cards` - Legacy cards array (Card System v0.1)
- `one_scope` - Current scope (private/global)
- `one_mode` - Legacy mode (private/global) - **RED FLAG: overlaps with scope**
- `one_theme_override` - Theme override (auto/light/dark)
- `one_id` - Anonymous user ID (generated on first load)
- `one_nobody_first_run` - Nobody first run flag
- `one_nobody_prompt_data` - Cached Nobody prompt data
- `nobody:last` - Last valid Nobody JSON response (cache)
- `one_welcome_choice` - Welcome flow choice
- `one_welcome_completed` - Welcome flow completion
- `one_onboarding_complete` - Step Engine onboarding completion
- `one_owo_complete` - Onboarding Without Onboarding completion
- `one_owo_choice` - OWO choice (want/offer)
- `one_owo_input` - OWO text input
- `one_session` - Session data
- `one_signals` - Signals array
- `one_identity` - Identity Without Exposure data
- `one_step_plan_${userId}` - Step plan per user
- `action_loop_${stateId}` - Action loop plan per state
- `life_states_${context}` - Life states per context
- `life_actions_${lifeStateId}` - Life actions per state

### Caching Layer

**No SWR/React Query** - direct localStorage reads/writes

**Caching:**
- `nobody:last` - Last Nobody prompt response (instant render, background refresh)
- In-memory rate limit map in `/api/nobody/step` (per IP, 1-minute window)

---

## D) AUTH + SUPABASE MAP

### Supabase Client Creation

#### Client-side
- **File:** `lib/supabase.ts`
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose:** Client-side Supabase client (uses anon key)

#### Server-side
- **File:** `lib/supabase/server.ts`
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Purpose:** Server-side client (bypasses RLS, for API routes only)

### Auth Flows

**No traditional auth** - anonymous-first architecture

**Identity System (IWE - Identity Without Exposure):**
- **File:** `lib/iwe-engine.ts`
- **Tiers:** Presence ID (auto-generated) → Path ID (activity-based) → Anchor ID (optional, cross-device)
- **Storage:** `localStorage.getItem("one_identity")`
- **No email/password** - identity emerges from action

**Device Pairing (One-Touch):**
- **Routes:** `/api/one-touch/create`, `/api/one-touch/claim`, `/api/one-touch/status`
- **Purpose:** QR code-based device pairing (desktop ↔ mobile)
- **Storage:** Supabase `one_touch_sessions` table
- **No user accounts** - session-based pairing

### Supabase Tables (Inferred)
- `one_touch_sessions` - QR code pairing sessions

---

## E) AI / OPENAI MAP

### OpenAI Integration Points

#### 1. `/api/nobody/step` (POST) - **PRIMARY AI ENDPOINT**
- **File:** `app/api/nobody/step/route.ts`
- **Model:** `gpt-4o-mini`
- **Input:** `{ text: string, makeEasier?: boolean }`
- **Output:** `OneNextStep` JSON schema
- **Rate limit:** 10 req/min per IP (in-memory)
- **Timeout:** 2500ms (handled in hook, not API)
- **Fallback:** Deterministic step if API fails
- **Safety:** 
  - Input validation (1-280 chars)
  - JSON schema enforcement
  - Always returns 200 (never errors)

#### 2. `/api/nobody` (GET) - **LEGACY**
- **File:** `app/api/nobody/route.ts`
- **Model:** `gpt-4o-mini`
- **Purpose:** Initial Nobody prompt (onboarding)
- **Output:** `{ say: {title, subtitle}, choices: [...], card: {...} }`
- **Fallback:** Safe default if API fails

#### 3. `/api/distill` (POST)
- **File:** `app/api/distill/route.ts`
- **Model:** `gpt-4o-mini`
- **Purpose:** Intent reduction + action generation
- **Input:** `{ text: string }`
- **Output:** `{ intent: string, category: IntentCategory, action: string }`
- **Status:** Legacy/TODO - not actively used in current flow

#### 4. `/api/brain` (POST)
- **File:** `app/api/brain/route.ts`
- **Model:** `gpt-4.1-mini` (OpenAI responses API)
- **Purpose:** General AI brain endpoint
- **Status:** Legacy/TODO - not actively used

### AI Input/Output Schema

#### Primary Flow (Nobody Step)
```typescript
// Input
{ text: string, makeEasier?: boolean }

// Output
{
  title: string,           // max 6 words
  why: string,            // max 12 words
  durationMinutes: 5|10|15|20|30,
  energy: "low"|"medium"|"high",
  domain: "life"|"health"|"career"|"money"|"relationships"|"learning",
  buttons: [{ id: "do"|"not_now"|"change", label: string }]
}
```

### Safety Measures

**Rate Limiting:**
- In-memory per-IP map (10 req/min)
- Window: 60 seconds
- **RED FLAG:** Resets on server restart (not persistent)

**Prompt Location:**
- System prompts in API route files (not externalized)
- No prompt injection protection beyond input length limits

**Logging:**
- Dev-only console logs in `/api/nobody/step` (input text, returned JSON)
- No production logging/analytics

**Error Handling:**
- All AI routes return 200 with fallback JSON (never expose errors)
- Client-side timeout handling in `useNobody` hook (2500ms)

---

## F) "RED FLAGS" CHECK

### Duplication Risks

#### 1. **Multiple Card Systems**
- **New:** `lib/step-card.ts` (v1, `one01:v1:cards`)
- **Legacy:** `lib/card-engine.ts` (v0.1, `one_cards`)
- **Overlap:** Both manage cards, different schemas
- **Risk:** Data inconsistency, confusion about which system is active

#### 2. **Mode vs Scope**
- **Legacy:** `one_mode` (private/global) in `OneScreen.tsx`
- **New:** `one_scope` (private/global) in `useScope` hook
- **Risk:** Two sources of truth for same concept

#### 3. **Multiple Step Card Storage Files**
- **Files:** `lib/step-card.ts`, `lib/step-card-storage.ts`
- **Risk:** Duplicate implementations (one may be unused)

#### 4. **Legacy Engines Still Imported**
- **Files:** `lib/life-engine.ts`, `lib/step-engine.ts`, `lib/signal-engine.ts`, `lib/action-loop-engine.ts`, `lib/owo-engine.ts`, `lib/iwe-engine.ts`
- **Status:** Imported in `OneScreen.tsx` but mostly unused in current flow
- **Risk:** Dead code, confusion about which engine is active

#### 5. **Multiple Home State Sources**
- **Active step card:** `activeStepCard` (new system)
- **Legacy active card:** `activeCard` from `useCards` hook
- **Risk:** Both can be active simultaneously, state machine may not handle correctly

#### 6. **Unused Route Directories**
- `app/card/[id]/`, `app/cards/`, `app/global/`, `app/intent/`
- **Risk:** Confusion, potential future conflicts

#### 7. **Legacy UI Components**
- `CenterCard.tsx` - Legacy card bubble (may overlap with `ActiveStepCard.tsx`)
- `CardView.tsx`, `Deck.tsx` - Unused duplicates of `CardDetailView.tsx`, `DeckView.tsx`?

#### 8. **Multiple Nobody Prompt Systems**
- **Legacy:** `NobodyPrompt` component (first run, 2 choices)
- **New:** `StepSuggestion` component (AI-generated, 3 buttons)
- **Risk:** Both can render, unclear which takes priority

#### 9. **Theme System Duplication**
- Theme logic in `OneScreen.tsx` (local state)
- CSS variables in `globals.css`
- **Risk:** Potential sync issues

#### 10. **No Centralized State Management**
- All state in `OneScreen.tsx` (1320 lines)
- Multiple hooks managing overlapping concerns
- **Risk:** Hard to debug, potential race conditions

---

## Key Files to Inspect Next

1. **`components/OneScreen.tsx`** (1320 lines) - Main orchestrator, needs refactoring
2. **`lib/step-card.ts`** vs **`lib/card-engine.ts`** - Resolve duplication
3. **`lib/step-card-storage.ts`** - Check if duplicate of `step-card.ts`
4. **`hooks/useScope.ts`** vs `one_mode` in `OneScreen.tsx` - Resolve mode/scope overlap
5. **`components/ui/HomeContent.tsx`** - State machine rendering logic
6. **`lib/home-state.ts`** - State machine definition
7. **`app/api/nobody/step/route.ts`** - Primary AI endpoint
8. **`lib/reset.ts`** - Reset flow (may be missing keys)
9. **`components/ui/ActiveStepCard.tsx`** vs **`components/ui/CenterCard.tsx`** - Check overlap
10. **`lib/types.ts`** - Type definitions (may have deprecated types)

---

**End of Project Map**

