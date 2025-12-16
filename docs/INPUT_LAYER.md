# Input & Language Handling Layer

## Overview

The Input Layer is the entry point to the ONE01 system. It handles voice and keyboard input, detects language, and creates RawInput objects that feed into the Distillation layer.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              USER INPUT (Voice or Keyboard)               │
└────────────────────┬──────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Voice Input    │    │  Keyboard Input │
│  (Web Speech /  │    │  (Direct Text)  │
│   Whisper)      │    │                 │
└────────┬────────┘    └────────┬────────┘
         │                       │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Language Detection   │
         │   (From Text)          │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Create RawInput       │
         │   (One Input = One      │
         │    RawInput Object)     │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Distillation Layer   │
         │   (Next Step)          │
         └───────────────────────┘
```

## Key Principles

### 1. Voice → Text is Separate from AI

**Why:** Voice recognition and AI understanding are different problems.

- **Voice Input Layer**: Converts speech to text (Web Speech API, Whisper)
- **Distillation Layer**: Understands meaning (AI, classification)
- **Separation**: Can swap voice implementations without touching AI logic

**Benefits:**
- Replace Web Speech with Whisper without changing business logic
- Test AI with keyboard input (no voice needed)
- Use different voice providers per region/cost

### 2. Language Context Propagation

**Flow:**
1. User inputs text (voice or keyboard)
2. System detects language from text
3. Language stored in `RawInput.language`
4. Language propagates to:
   - `DistilledIntent` (uses same language)
   - `LedgerCard` (uses same language)
   - `Process` (uses same language)
   - UI (responds in same language)

**Rules:**
- Language detected automatically (no user selection)
- Language persists for session (until new input changes it)
- No auto-translation (system responds in detected language)
- User can explicitly request translation (future feature)

### 3. One Input = One RawInput

**Contract:**
- Each user input creates exactly ONE `RawInput` object
- No batching, no chat history, no conversation threads
- Each input is independent and self-contained

**Why:**
- Simpler mental model: "I say one thing, system responds"
- No state management for conversation history
- Each input can be processed independently
- Easier to debug and trace

**UX Principle:**
- System behaves like a "one-sentence call"
- User says one thing → system responds
- No back-and-forth unless user initiates again
- No chat history UI (not needed)

### 4. Input Validation

**Rules:**
- Text must not be empty
- Text must not exceed 1000 characters
- Must have valid sessionId
- Must have valid timestamp
- Invalid inputs are rejected before Distillation

## Implementation Details

### Voice Input

**Primary: Web Speech API**
- Browser-native, free, no API keys
- Works offline (browser-dependent)
- Good for most use cases
- Language hint supported

**Fallback: Whisper**
- Better quality, more languages
- Requires API key
- Use when Web Speech unavailable or quality needed

**Abstraction:**
- `VoiceInput` interface hides implementation
- Easy to swap Web Speech ↔ Whisper
- No business logic depends on voice source

### Language Detection

**Current: Simple Heuristic**
- Character range detection (Hebrew, Arabic)
- Common character detection (Spanish, French)
- Fast, deterministic, no API calls
- Good enough for major languages

**Future: Better Implementation**
- Can swap to library (franc, langdetect)
- Can swap to API (Google Cloud Translation)
- Interface stays same: `detectLanguage(text) → LanguageContext`

### RawInput Creation

**From Keyboard:**
```typescript
const rawInput = createRawInputFromText(
  "I want to lose weight",
  sessionId,
  "private"
);
```

**From Voice:**
```typescript
const voiceInput = await captureVoice(); // Web Speech or Whisper
const rawInput = createRawInputFromVoice(voiceInput, sessionId, "private");
```

**Both create same RawInput structure:**
- Same fields
- Same validation
- Same language detection
- Same downstream flow

## Why This Layer is Cheap, Replaceable, and Safe

### Cheap

1. **Web Speech API**: Free, browser-native, no API costs
2. **Simple Language Detection**: Heuristic-based, no API calls
3. **Minimal Dependencies**: No heavy libraries
4. **Fast**: All operations are synchronous or near-synchronous

### Replaceable

1. **Voice Input**: Swap Web Speech ↔ Whisper without changing business logic
2. **Language Detection**: Swap heuristic ↔ library ↔ API without breaking system
3. **Input Source**: Add new sources (import, API) without refactoring
4. **Interface-Based**: All implementations use same interfaces

### Safe

1. **No Business Logic**: Input layer only captures and formats, doesn't interpret
2. **Validation**: Invalid inputs rejected before reaching Distillation
3. **Language Isolation**: Each input's language is independent
4. **No State**: Input layer is stateless (each input is independent)
5. **Privacy**: RawInput stays in private scope until explicitly shared

## How This Enables Natural Human Interaction

### 1. Language Follows User

- User types in Hebrew → System responds in Hebrew
- User speaks in Arabic → System understands and responds in Arabic
- No language selector needed
- Natural, automatic, invisible

### 2. Voice is First-Class

- User can speak or type
- Both create same RawInput
- System doesn't care which one
- Enables hands-free interaction

### 3. One-Sentence Calls

- User says one thing → System responds
- No conversation history needed
- Each interaction is fresh
- Reduces cognitive load

### 4. Context Preservation

- Language detected once, used everywhere
- No need to re-detect in each layer
- Consistent experience across system
- User feels understood

## Type Definitions

All types are in `lib/input-types.ts`:

- `LanguageContext` - Language information
- `DetectedLanguage` - Supported languages
- `VoiceInput` - Voice capture abstraction
- `VoiceInputConfig` - Voice configuration
- `InputSource` - How input was captured
- `RawInput` - One user input object
- `LanguageDetector` - Language detection interface

## Next Steps (Not Implemented Yet)

- Web Speech API integration
- Whisper API integration
- Better language detection (library/API)
- Voice input UI components
- Input validation UI feedback

These will be implemented in future steps, using the type definitions as the foundation.

