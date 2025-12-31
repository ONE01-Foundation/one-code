# ONE01 Project Understanding & Mapping

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive mapping before making changes  
**Status:** Read-only analysis

---

## EXECUTIVE SUMMARY

**Current State:** The project has two parallel systems:
1. **Active UI System** (Bubbles Interface) - Recent, UI-focused, no persistence
2. **Legacy Core System** (Cards/Worlds) - Exists in code but not connected to current UI

**Critical Finding:** The current bubbles UI is a **frontend-only prototype** with no database persistence. Nothing is saved.

---

## 1️⃣ PROJECT STRUCTURE MAP

### Frontend (Active - Bubbles System)

#### Main Entry Point
- **File:** `app/page.tsx`
- **Purpose:** Main application entry - Bubbles UI
- **State Management:** React `useState` hooks (no global store)
- **Key Components:**
  - `BubbleField` - Vertical bubble layout, TikTok-like scrolling
  - `InputBar` - Central input with voice-to-text
  - `TopBar` - AI text display
  - `BottomBar` - Navigation bar
  - `CenterClock` - Origin bubble clock/profile
  - `AIChat` - Chat overlay from topbar

#### Active Components (`components/bubbles/`)
- `BubbleField.tsx` - Bubble layout engine (1400+ lines)
- `Bubble.tsx` - Individual bubble rendering
- `InputBar.tsx` - Input with microphone, send button
- `TopBar.tsx` - AI text display area
- `BottomBar.tsx` - Navigation with "ONE-01" footer
- `CenterClock.tsx` - Origin bubble content (clock, profile, AI text)
- `AIChat.tsx` - Chat history overlay

### Backend API Routes (Active)

#### `/api/brain` (POST) - **ACTIVELY USED**
- **File:** `app/api/brain/route.ts`
- **Purpose:** OpenAI chat completion for bubbles
- **Model:** `gpt-4o-mini`
- **Input:** `{ message: string, bubbleId: string, bubbleTitle: string, chatHistory: Array }`
- **Output:** `{ reply: string }`
- **System Prompts:** Domain-specific expert prompts per bubble (health, money, work, etc.)
- **Status:** ✅ Working, actively used by current UI

#### Other API Routes (Mostly Legacy/Unused)
- `/api/nobody` - Legacy onboarding
- `/api/nobody/step` - Legacy step generation
- `/api/distill` - Legacy intent reduction
- `/api/one-touch/*` - Device pairing (only uses Supabase)
- `/api/health` - Health check

### Legacy System (Exists but Not Connected)

#### Legacy Components (`components/ui/`)
- `ActiveStepCard.tsx` - Legacy card display
- `CardDetailView.tsx` - Legacy card detail
- `DeckView.tsx` - Legacy card deck
- **Status:** ⚠️ NOT used by current bubbles UI

#### Legacy Libraries (`lib/`)
- `card-engine.ts` - Card CRUD (localStorage-based)
- `step-card.ts` - Step card system (v1)
- `step-card-storage.ts` - Step card storage
- `types.ts` - Legacy type definitions
- Multiple engine files (life-engine, step-engine, signal-engine, etc.)
- **Status:** ⚠️ Code exists but NOT imported/used by current bubbles UI

---

## 2️⃣ CORE CONCEPTS IDENTIFICATION

### ✅ **Bubble** (Exists - UI Only)
- **Definition:** `export type Bubble` in `app/page.tsx`
- **Storage:** ❌ **HARDCODED** in `MOCK_BUBBLES_DATA`
- **Fields:** `id, title, titleRTL, icon, value, actionType, aiText, aiTextRTL, subBubbles[]`
- **Status:** UI representation only, no persistence

### ✅ **Profile** (Exists - UI Only)
- **Definition:** `export type Profile` in `app/page.tsx`
- **Storage:** ❌ **HARDCODED** array with 2 profiles (default, create)
- **Fields:** `id, name, nameRTL, avatar, aiText, aiTextRTL`
- **Status:** UI concept only, no persistence, no user accounts

### ❌ **Card** (Missing in Active System)
- **Legacy Definition:** Exists in `lib/types.ts` and `lib/card-engine.ts`
- **Storage:** localStorage (`one_cards` key) in legacy system
- **Status:** ⚠️ Legacy system exists but **NOT connected** to current bubbles UI
- **Critical:** Current bubbles UI does NOT create or manage cards

### ❌ **World** (Missing in Active System)
- **Legacy Definition:** Exists in `lib/mvp/types.ts` (`WorldId: "health" | "money" | "career"`)
- **Storage:** ❌ Not implemented
- **Status:** Concept exists in types only, never implemented

### ❌ **User** (Missing)
- **Auth:** ❌ No authentication system
- **Identity:** Anonymous-first (legacy `iwe-engine.ts` exists but unused)
- **Storage:** ❌ No user table in Supabase

### ⚠️ **AI Response Lifecycle** (Partial)
- **Current:** Chat messages stored in React state (`chatMessages` state)
- **Persistence:** ❌ **LOST ON REFRESH** - no database storage
- **Storage Location:** `app/page.tsx` line 227: `const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({})`
- **Status:** Working but ephemeral

---

## 3️⃣ CURRENT USER FLOW (AS-IS)

### Input → AI → Display Flow

```
1. User types in InputBar component
   ↓
2. User clicks send (or presses Enter)
   ↓
3. `handleSendMessage` called in app/page.tsx (line 453)
   ↓
4. Message added to React state: `chatMessages[bubbleId].push(userMessage)`
   ↓
5. API call to `/api/brain` with:
   - message: user input
   - bubbleId: current centered bubble ID
   - bubbleTitle: current bubble title
   - chatHistory: previous messages from state
   ↓
6. OpenAI responds with text
   ↓
7. AI response stored in React state: `chatMessages[bubbleId].push(aiMessage)`
   ↓
8. TopBar displays preview (first 200 chars)
   ↓
9. AIChat overlay shows full conversation
   ↓
10. ❌ **NOTHING IS SAVED** - All data lost on page refresh
```

### What Is Saved vs Lost

#### ✅ Saved (Persists Across Sessions)
- **Theme preference:** `localStorage` (implicit via browser)
- **RTL preference:** Browser language detection (no save)
- **UI size:** `localStorage` (implicit via browser)

#### ❌ Lost on Refresh
- **All chat messages** - Stored only in React state
- **Bubble state** - Bubbles are hardcoded, no user modifications
- **Profile images** - Stored in React state (`profileImage` in CenterClock)
- **Active bubble selection** - Resets to origin on refresh

### What Happens When User Types Something

1. **Text entered** → Stored in `InputBar` component state
2. **Send clicked** → `onSendMessage` prop called
3. **Message sent** → Added to `chatMessages` state (in-memory only)
4. **AI responds** → Response added to `chatMessages` state
5. **UI updates** → TopBar shows preview, AIChat shows full history
6. **Page refresh** → **Everything is lost**

---

## 4️⃣ SUPABASE USAGE MAP

### Supabase Client Setup

#### Client-Side
- **File:** `lib/supabase.ts`
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Status:** ✅ Configured, but **NOT USED** by current bubbles UI

#### Server-Side
- **File:** `lib/supabase/server.ts`
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Status:** ✅ Configured, used ONLY for `/api/one-touch/*` routes

### Supabase Tables

#### ✅ Exists and Used
- **`one_touch_sessions`** - QR code device pairing
  - Used by: `/api/one-touch/create`, `/api/one-touch/claim`, `/api/one-touch/status`
  - Fields: `code, status, expires_at, claimed_at, desktop_client_id, mobile_client_id`

#### ❌ Missing (Not Created)
- **`users`** - No user table
- **`profiles`** - No profile table
- **`bubbles`** - No bubble table
- **`cards`** - No card table
- **`worlds`** - No world table
- **`chat_messages`** - No chat message table
- **`bubble_chat_history`** - No chat history table

### Supabase Usage Summary

**Current State:** Supabase is configured but **barely used**:
- Only 1 table exists (`one_touch_sessions`)
- Used only for device pairing feature
- **NO data persistence** for core app features (bubbles, chat, cards)

---

## 5️⃣ AI INTEGRATION MAP

### Active AI Endpoint

#### `/api/brain` (POST) - **ACTIVELY USED**
- **Model:** `gpt-4o-mini`
- **System Prompts:** Domain-specific expert prompts
  - `home` - Personal assistant
  - `health` - Health and wellness coach
  - `money` - Financial advisor
  - `work` - Productivity coach
  - `learning` - Learning coach
  - `creative` - Creative coach
  - `life` - Life coach
  - `settings` - Settings assistant
- **Input:** User message + chat history
- **Output:** Free-form text response
- **Rate Limiting:** ❌ None
- **Persistence:** ❌ Responses not saved

### AI Response Flow

```
User Input → /api/brain → OpenAI API → Text Response → React State → UI Display
                                                          ↓
                                                   ❌ NOT SAVED
```

### AI Rules Violation Check

**Rule:** "AI must never own state, only propose structure, output structured JSON"

**Current Violation:** ⚠️
- AI outputs **free-form text**, not structured JSON
- AI responses stored in **React state** (ephemeral)
- No structured card creation from AI responses
- AI acts as **chatbot**, not **interpreter**

---

## 6️⃣ DATA MODELS (ACTUAL vs INTENDED)

### Current Data Models (In-Memory Only)

#### Bubble (Type Definition)
```typescript
type Bubble = {
  id: string;              // e.g., "bubble-0"
  title: string;           // e.g., "Health"
  titleRTL?: string;       // Hebrew translation
  icon: string;            // Emoji, e.g., "❤️"
  value: number;           // Index number
  actionType: "open" | "view" | "edit" | "play" | "share";
  aiText: string;          // Static placeholder text
  aiTextRTL?: string;      // Hebrew AI text
  subBubbles?: Bubble[];   // Horizontal sub-bubbles
}
```
**Storage:** ❌ Hardcoded in `MOCK_BUBBLES_DATA`, not in database

#### Profile (Type Definition)
```typescript
type Profile = {
  id: string;              // "default" | "create"
  name: string;            // "Personal" | "Create Profile"
  nameRTL?: string;        // Hebrew name
  avatar: string;          // Emoji or icon path
  aiText: string;          // Static text
  aiTextRTL?: string;      // Hebrew AI text
}
```
**Storage:** ❌ Hardcoded array, not in database

#### ChatMessage (Type Definition)
```typescript
type ChatMessage = {
  id: string;              // Generated ID
  role: "user" | "assistant";
  content: string;         // Message text
  isTyping?: boolean;      // Typing indicator
}
```
**Storage:** ❌ React state only, lost on refresh

### Legacy Data Models (Not Used by Current UI)

#### Card (Legacy)
```typescript
type Card = {
  id: string;
  title: string;
  intent: string;
  state: "draft" | "active" | "done";
  scope: "private" | "global" | "bridge";
  createdAt: string;
  source?: string;
}
```
**Storage:** localStorage (`one_cards` key) - **NOT used by bubbles UI**

---

## 7️⃣ PERSISTENCE GAP ANALYSIS

### What Should Be Persisted (According to Project Intent)

1. **Cards** - Core data unit
   - ❌ **NOT persisted** - Legacy system exists but not connected
   
2. **Chat History** - Per bubble, per profile
   - ❌ **NOT persisted** - Stored only in React state
   
3. **Bubbles** - User's bubble configuration
   - ❌ **NOT persisted** - Hardcoded mock data
   
4. **Profiles** - User profiles with avatars
   - ❌ **NOT persisted** - Hardcoded array
   
5. **User Context** - Personalization data
   - ❌ **NOT persisted** - No user system

### What Actually Persists

1. ✅ **Theme preference** - Browser localStorage (implicit)
2. ✅ **Device pairing sessions** - Supabase `one_touch_sessions` table
3. ❌ **Everything else** - Ephemeral React state

---

## 8️⃣ MINIMAL WORKING LOOP ANALYSIS

### Intended Loop (From Prompt)

```
Input → AI → Card → Bubble → Persist → Next Input
```

### Actual Current Loop

```
Input → AI → Display → ❌ LOST
```

### Gap Analysis

| Step | Intended | Actual | Status |
|------|----------|--------|--------|
| Input | User types | ✅ Working | OK |
| AI | Process input | ✅ `/api/brain` works | OK |
| Card | Create structured card | ❌ **NOT IMPLEMENTED** | MISSING |
| Bubble | Update bubble with card | ❌ **NOT IMPLEMENTED** | MISSING |
| Persist | Save to Supabase | ❌ **NOT IMPLEMENTED** | MISSING |
| Next Input | Ready for next | ✅ UI ready | OK |

**Critical Missing:** Card creation, Bubble updates, Persistence

---

## 9️⃣ WHAT SHOULD BE DONE FIRST (MVP Loop)

### Minimal Working Loop Requirements

To achieve: `Input → AI → Card → Bubble → Persist → Next Input`

#### Step 1: Create Supabase Schema
- **Table:** `cards`
  - `id, title, intent, world_id, bubble_id, user_id, state, created_at, updated_at`
- **Table:** `chat_messages` (optional for MVP)
  - `id, bubble_id, user_id, role, content, created_at`
- **Table:** `profiles` (if profiles should persist)
  - `id, user_id, name, avatar, created_at`

#### Step 2: Wrap AI Response
- Modify `/api/brain` to output **structured JSON**:
  ```json
  {
    "reply": "text response",
    "suggestedCard": {
      "title": "...",
      "intent": "...",
      "world": "health|money|work|..."
    }
  }
  ```

#### Step 3: Card Creation Adapter
- Create wrapper function that:
  - Takes AI response
  - Extracts suggested card
  - Creates card in Supabase
  - Returns card ID

#### Step 4: Connect to Existing UI
- Add card creation after AI response
- Update bubble display to show card count/metric
- Store card ID in React state (temporary, until persistence is complete)

#### Step 5: Persistence Layer
- Create Supabase client wrapper for cards
- Replace React state with Supabase queries
- Add loading states

### What Should NOT Be Touched

1. ❌ **BubbleField.tsx** - Complex layout logic, working fine
2. ❌ **Bubble rendering logic** - UI is solid
3. ❌ **InputBar.tsx** - Voice input, send button - working
4. ❌ **TopBar/BottomBar** - UI components - working
5. ❌ **Theme/RTL system** - Working as intended
6. ❌ **Legacy card-engine.ts** - Keep for now, wrap if needed

---

## 🔟 IMPLEMENTATION CONSTRAINTS

### Non-Breaking Changes Only

1. **Wrap existing functions** - Don't refactor, add adapters
2. **Feature flags** - Make new features optional/gradual
3. **Backward compatibility** - Current UI must continue working
4. **No schema changes to existing tables** - Only add new tables
5. **Incremental persistence** - Start with cards, add chat later

### Safe Addition Points

1. **After AI response** - Add card creation hook
2. **Before state update** - Add Supabase save
3. **Wrapper around `/api/brain`** - Parse structured response
4. **New API route** - `/api/cards/create` (doesn't break existing)

---

## 📋 SUMMARY: EXISTS / PARTIAL / MISSING

### ✅ EXISTS and Working
- Bubble UI rendering
- AI chat interface
- OpenAI integration (`/api/brain`)
- Voice input (microphone)
- Theme/RTL support
- Profile switching (UI only)

### ⚠️ PARTIAL (Exists but Not Connected)
- Card system (legacy code exists)
- Supabase client (configured but unused)
- Type definitions (exist but not enforced)

### ❌ MISSING (Required for MVP Loop)
- **Card creation from AI responses**
- **Supabase card table**
- **Card persistence layer**
- **Bubble-card connection**
- **Chat message persistence**
- **User/profile persistence**
- **Structured AI output (JSON)**

---

## 🎯 RECOMMENDED FIRST STEPS

1. **Create Supabase schema** for cards table
2. **Modify `/api/brain`** to optionally return structured JSON
3. **Create card adapter function** that wraps AI response → card creation
4. **Add card creation hook** in `handleSendMessage` (after AI response)
5. **Add Supabase persistence** for cards
6. **Update bubble UI** to show card count/metric (minimal, non-breaking)

**Do NOT:**
- Refactor existing bubble rendering
- Change AI response format (add to it, don't replace)
- Remove legacy code (yet)
- Add user authentication (yet)
- Change chat message storage (yet - can be Phase 2)

---

**End of Project Understanding**

