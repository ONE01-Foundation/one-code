# OneView V1 MVP - Repository Audit

**Date:** 2025-01-27  
**Purpose:** Understand existing codebase before implementing clean MVP

---

## (A) REPO MAP

### Framework/Runtime
- **Next.js:** 16.0.7 (App Router)
- **TypeScript:** 5.x (strict mode)
- **React:** 19.2.0
- **Tailwind:** 4.x (PostCSS)
- **State Management:** Zustand 5.0.9 (present but minimal usage)
- **Build:** React Compiler enabled

### Key Folders
```
/app                    # App Router (Next.js 16)
  /api                  # API routes
    /oneStep            # ✅ KEEP - OpenAI integration for intent parsing
    /nobody             # Legacy AI dialog system
    /brain              # OpenAI wrapper
    /distill            # Intent distillation
    /one-touch          # Supabase table: one_touch_sessions
  /page.tsx             # ✅ CURRENT ENTRY: renders OneView
  /layout.tsx           # Root layout

/components
  /one/OneView/         # ✅ CURRENT OneView (V1 sphere UI)
  /ui/                  # Legacy UI components (HomeContent, Nobody, etc.)

/lib
  /one/                 # ✅ CURRENT OneView types & store (in-memory)
  /supabase.ts          # ✅ KEEP - Client-side Supabase client
  /supabase/server.ts   # ✅ KEEP - Server-side Supabase client
  /types.ts             # Legacy Card/Step types
  /card-engine.ts       # Legacy card system (localStorage)
  /step-card.ts         # Legacy step cards (localStorage)
  /nobody.ts            # Legacy AI dialog
  [20+ other legacy engines]
```

### AI Integration (OpenAI)
**Location:** Multiple API routes
- **Model:** `gpt-4o-mini` (primary)
- **Env Var:** `OPENAI_API_KEY`
- **Routes using OpenAI:**
  - `/api/oneStep` ✅ **KEEP** - Intent classification (already aligned with MVP needs)
  - `/api/nobody` - Legacy dialog system
  - `/api/brain` - Generic wrapper
  - `/api/distill` - Intent distillation

**Current OneStep API:**
- Accepts: `{ userText: string, currentPath?: string[] }`
- Returns: `{ success: boolean, step?: { intent, domain, bubblePath, card } }`
- Uses Zod validation
- Has fallback logic if OpenAI unavailable

### Supabase Integration
**Client Setup:**
- `lib/supabase.ts` - Client-side (anon key)
- `lib/supabase/server.ts` - Server-side (service role key)
- **Env Vars:** 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Current Usage:**
- `/api/one-touch/*` routes use table: `one_touch_sessions`
- **No auth system** currently implemented
- **No other tables** referenced in codebase

**Tables Referenced:**
- `one_touch_sessions` (status, expires_at, claimed_at)

### Current OneView Entry Points
**Primary Route:**
- `app/page.tsx` → renders `<OneView />` from `components/one/OneView/OneView.tsx`

**Current OneView State:**
- In-memory store (`lib/one/store.ts`)
- Sphere/Card/Unit types (`lib/one/types.ts`)
- UI: Sphere orbit navigation (Apple Watch style)
- Features: Private/Global mode toggle, voice input, card completion
- **NOT using Supabase** (TODO comment in store.ts)

### Existing Data Models

**Current OneView Types (`lib/one/types.ts`):**
```typescript
Sphere {
  id, parentId, name, mode, stats: {cards, completed, lastActivity}
}
Card {
  id, sphereId, text, status: "active"|"done"|"paused", createdAt, updatedAt
}
Unit {
  id, cardId, sphereId, event, timestamp, value
}
```

**Legacy Types (`lib/types.ts`):**
```typescript
Card {
  id, title, intent, state, scope, createdAt, nextAt, source
}
StepCard {
  id, title, why, durationMinutes, energy, domain, status, createdAt, updatedAt
}
```

**Storage:**
- OneView: In-memory only (no persistence)
- Legacy: localStorage (`one_cards`, `one01:v1:cards`)

---

## (B) EXISTING DATA MODEL

### What Exists
1. **OneView Types** (`lib/one/types.ts`)
   - Sphere, Card, Unit, Summary
   - In-memory only, no DB

2. **Legacy Card System** (`lib/types.ts`, `lib/card-engine.ts`)
   - Card with title, intent, state, scope
   - Stored in localStorage
   - Not used by current OneView

3. **Legacy Step Cards** (`lib/step-card.ts`)
   - StepCard with domain, energy, duration
   - Stored in localStorage
   - Not used by current OneView

4. **Supabase Table**
   - `one_touch_sessions` (unrelated to OneView)

### What Does NOT Exist
- ❌ No `moments` table
- ❌ No `user_id` auth system
- ❌ No Supabase persistence for OneView
- ❌ No database schema for MVP

---

## (C) RISK LIST (Top 5)

### 1. **Breaking Production Route** 🔴 HIGH
- `/` currently renders OneView with sphere UI
- MVP needs simple list UI (no spheres)
- **Risk:** Users see broken/confusing UI
- **Mitigation:** Feature flag OR new route (`/moments`) initially

### 2. **OneStep API Dependency** 🟡 MEDIUM
- Current OneView calls `/api/oneStep`
- API expects `bubblePath` (sphere hierarchy)
- MVP needs `intent` + `domain` only
- **Risk:** API mismatch
- **Mitigation:** Extend API to support both formats OR create `/api/moment` route

### 3. **No Auth System** 🟡 MEDIUM
- MVP requires `user_id` for Moments
- No auth currently implemented
- **Risk:** Cannot store user-specific data
- **Mitigation:** Use anonymous user ID OR implement simple auth

### 4. **Supabase Schema Missing** 🟡 MEDIUM
- No `moments` table exists
- Need to create migration
- **Risk:** Production DB changes
- **Mitigation:** Test migration locally first, use Supabase migrations

### 5. **Legacy Code Confusion** 🟢 LOW
- 20+ legacy engine files in `/lib`
- May have conflicting types/patterns
- **Risk:** Developer confusion, accidental usage
- **Mitigation:** Clear separation, new `/lib/moment` folder

---

## (D) RECOMMENDED APPROACH

### ✅ **"New Minimal Slice"**

**Rationale:**
- Current OneView is complex (spheres, orbits, navigation)
- MVP is simple (list of moments, one insight button)
- Clean separation prevents breaking existing code
- Easier to test independently

### Implementation Plan (8-12 bullets)

1. **Create new route:** `/moments` (MVP lives here initially)
   - Keep `/` rendering current OneView (no breaking change)
   - Test MVP on `/moments` route

2. **Create Supabase migration:**
   - Table: `moments` (id, user_id, created_at, raw_text, intent, domain, state, privacy_level)
   - RLS: Users can only see their own moments

3. **Create new lib structure:**
   - `/lib/moment/` - Moment CRUD operations
   - `/lib/ai/` - AI classification (reuse OneStep logic)
   - Keep existing `/lib/one/` untouched

4. **Extend OneStep API OR create new route:**
   - Option A: Extend `/api/oneStep` to return `{ intent, domain }` format
   - Option B: Create `/api/moment/classify` (cleaner separation)

5. **Create MVP components:**
   - `/components/moments/OneView.tsx` - Simple list UI
   - `/components/moments/MomentList.tsx` - Chronological list
   - `/components/moments/InsightButton.tsx` - Generate insight
   - Keep `/components/one/` untouched

6. **Implement simple auth:**
   - Use Supabase anonymous auth OR
   - Generate stable user_id from localStorage (temporary)
   - Store in `user_sessions` table if needed

7. **AI Integration:**
   - Reuse OpenAI client pattern from `/api/oneStep`
   - Create `/api/moment/classify` that returns `{ intent, domain }`
   - Create `/api/moment/insight` that generates insight from last N moments

8. **Daily Summary:**
   - Button-triggered OR computed in UI
   - Call `/api/moment/insight` with `period: "day"` filter
   - Display above moment list

9. **Testing Strategy:**
   - Test on `/moments` route first
   - Verify Supabase writes/reads work
   - Test AI classification
   - Test insight generation

10. **Migration Path:**
    - Once MVP validated, replace `/` with MVP
    - Archive current OneView to `/legacy` or remove
    - Update routes

11. **What NOT to touch:**
    - `/lib/one/` (current OneView)
    - `/components/one/` (current OneView)
    - `/app/api/one-touch/*` (working Supabase routes)
    - `/lib/supabase*.ts` (working clients)
    - Legacy engines in `/lib` (ignore, don't delete yet)

12. **Environment Variables:**
    - Keep all existing: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.
    - No new env vars needed

---

## SUMMARY

**Current State:**
- Next.js 16 App Router ✅
- OpenAI integration working ✅
- Supabase clients configured ✅
- OneView exists but complex (spheres UI)
- No auth system
- No moments table

**MVP Needs:**
- Simple list UI (no spheres)
- Moments table in Supabase
- User ID (auth or anonymous)
- AI classification (reuse OneStep pattern)
- Insight generation

**Safe Path:**
- Build MVP on `/moments` route
- Create new `/lib/moment/` structure
- Keep existing code untouched
- Test thoroughly before replacing `/`

**Risk Level:** 🟡 MEDIUM (manageable with careful separation)

