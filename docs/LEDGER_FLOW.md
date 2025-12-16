# Human Action Ledger - Data Flow

## Overview

The ONE01 system transforms raw human input into structured, actionable data while preserving privacy and enabling global insights.

## Flow Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAW INPUT (User Speaks/Types)                 │
│  "I want to lose weight" / "I spent 30₪ on falafel"            │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DISTILLATION (System Analysis)                │
│  Extract: domain, subDomain, actionType, timeContext             │
│  Example: domain="health", actionType="desire", timeContext="ongoing" │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
    ┌───────────────────────┐  ┌───────────────────────┐
    │   PRIVATE LEDGER      │  │   GLOBAL SIGNALS      │
    │   (User's Data)       │  │   (Anonymous Patterns)│
    └───────────────────────┘  └───────────────────────┘
            │                              │
            ▼                              ▼
    ┌──────────────┐              ┌──────────────────┐
    │   CARDS      │              │  Aggregated      │
    │  - Log       │              │  Counts          │
    │  - Desire    │              │  Trends          │
    │  - Blocker   │              │  Patterns         │
    │  - Step      │              │  (No personal ID) │
    └──────┬───────┘              └──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  PROCESSES   │
    │  (Sequences  │
    │   of Cards)  │
    └──────────────┘
```

## Detailed Flow

### Step 1: Raw Input
**User says/types:** "I want to lose weight"

**Stored as RawInput:**
- `text`: "I want to lose weight"
- `source`: "voice" or "text"
- `timestamp`: 1234567890
- `sessionId`: "anon_abc123"
- `scope`: "private"

### Step 2: Distillation
**System analyzes and extracts:**

**DistilledIntent:**
- `domain`: "health"
- `subDomain`: "fitness"
- `actionType`: "desire"
- `timeContext`: "ongoing"
- `summary`: "Want to lose weight"
- `isProcessStart`: true

### Step 3A: Private Ledger (Cards)
**Creates LedgerCard:**
- `title`: "Lose weight"
- `actionType`: "desire"
- `status`: "active"
- `domain`: "health"

**If process detected, also creates Process:**
- `title`: "Lose weight"
- `cardIds`: [card1.id, card2.id, ...]
- `activeCardIndex`: 0

### Step 3B: Global Signals (Anonymous)
**Aggregates across all users:**

**GlobalSignal:**
- `domain`: "health"
- `subDomain`: "fitness"
- `actionType`: "desire"
- `count`: 1000 (how many people, not who)
- `trend`: "rising"
- `intensity`: 0.75

**NO personal data, NO raw text, NO process structure**

## Key Rules

### Card Creation Rules

1. **LOG** → Past event/fact
   - "I spent 30₪" → Log card, standalone

2. **DESIRE** → Want/wish/goal
   - "I want to lose weight" → Desire card, may start process

3. **BLOCKER** → Obstacle/problem
   - "I'm too tired" → Blocker card, may link to process

4. **STEP** → One action
   - "Take a walk" → Step card, may be in process

5. **PROCESS** → Multi-step journey
   - "Start weight loss" → Process + first step card

### Process Rules

- Cards can belong to a process OR stand alone
- Skipping a card is NOT failure
- Process continues with next card
- Skipped cards remain for context

### Global View Rules

✅ **Allowed:**
- Domain/sub-domain classifications
- Action type counts
- Time context patterns
- Aggregated counts (how many, not who)
- Trends (rising/falling)

❌ **Forbidden:**
- Raw text
- Personal identifiers
- Process structure
- Individual card details
- User timelines

## Why This Is Safe and Powerful

### Safety
1. **Privacy by Design**: Raw input never leaves private scope
2. **Anonymization**: Only structured, classified data goes to global
3. **No Personal ID**: Global signals are pure aggregates
4. **User Control**: All private data stays in user's control

### Power
1. **Pattern Recognition**: See trends across thousands without knowing who
2. **Collective Intelligence**: "Many people want X" without exposing individuals
3. **Time Context**: Understand when things matter (now vs ongoing)
4. **Domain Insights**: Know what domains are trending globally
5. **Actionable**: Private ledger gives user clear next steps

### Future-Proof
1. **Extensible**: Easy to add new domains, action types
2. **Scalable**: Aggregation works at any scale
3. **Flexible**: Cards can evolve without breaking processes
4. **Clear Boundaries**: Private vs Global is explicit in types

