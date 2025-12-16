/**
 * Input & Language Handling Layer
 * 
 * PRINCIPLES:
 * - Voice → Text is separate from AI
 * - Language detection is automatic and persistent
 * - One input = one RawInput object
 * - Language context propagates through entire system
 * - No auto-translation unless explicitly requested
 */

// ============================================================================
// 1. LANGUAGE CONTEXT
// ============================================================================

/**
 * DetectedLanguage - Language detected from input
 * 
 * Supports major languages, falls back to "en"
 */
export type DetectedLanguage =
  | "en" // English
  | "he" // Hebrew
  | "ar" // Arabic
  | "es" // Spanish
  | "fr" // French
  | "de" // German
  | "it" // Italian
  | "pt" // Portuguese
  | "ru" // Russian
  | "zh" // Chinese
  | "ja" // Japanese
  | "ko" // Korean
  | "unknown"; // Fallback when detection fails

/**
 * LanguageContext - Language information for a session/input
 * 
 * This propagates through the entire system:
 * - RawInput has language
 * - DistilledIntent uses same language
 * - LedgerCard uses same language
 * - Process uses same language
 * - UI responds in same language
 */
export interface LanguageContext {
  detected: DetectedLanguage; // What we detected
  confidence: number; // 0.0 - 1.0 (how sure we are)
  source: "input" | "session" | "user_preference" | "default"; // Where it came from
  timestamp: number; // When detected
}

// ============================================================================
// 2. VOICE INPUT
// ============================================================================

/**
 * VoiceInputSource - Where voice input comes from
 */
export type VoiceInputSource = "web_speech" | "whisper" | "other";

/**
 * VoiceInputState - Current state of voice capture
 */
export type VoiceInputState =
  | "idle" // Not listening
  | "listening" // Actively capturing
  | "processing" // Converting speech to text
  | "ready" // Text ready
  | "error"; // Something went wrong

/**
 * VoiceInput - Voice capture abstraction
 * 
 * This layer is CHEAP and REPLACEABLE:
 * - Web Speech API: Browser-native, free, no API keys
 * - Whisper fallback: When Web Speech unavailable or better quality needed
 * - Easy to swap implementations without touching business logic
 */
export interface VoiceInput {
  // State
  state: VoiceInputState;
  
  // Source
  source: VoiceInputSource; // Which implementation is active
  
  // Configuration
  language?: string; // Language hint (e.g., "en-US", "he-IL")
  continuous?: boolean; // Keep listening after pause
  interimResults?: boolean; // Show partial results
  
  // Results
  transcript?: string; // Final transcript
  interimTranscript?: string; // Partial transcript (if enabled)
  confidence?: number; // Speech recognition confidence (0.0 - 1.0)
  
  // Error handling
  error?: string; // Error message if state === "error"
  
  // Metadata
  startedAt?: number; // When listening started
  endedAt?: number; // When listening ended
  duration?: number; // Duration in milliseconds
}

/**
 * VoiceInputConfig - Configuration for voice input
 */
export interface VoiceInputConfig {
  // Primary: Web Speech API (browser-native, free)
  useWebSpeech: boolean;
  webSpeechLang?: string; // Language code for Web Speech API
  
  // Fallback: Whisper (better quality, requires API)
  useWhisper: boolean;
  whisperApiKey?: string; // Only if using Whisper
  
  // Behavior
  autoStart?: boolean; // Start listening immediately
  continuous?: boolean; // Keep listening
  interimResults?: boolean; // Show partial results
}

// ============================================================================
// 3. INPUT CONTRACT
// ============================================================================

/**
 * InputSource - How the input was captured
 */
export type InputSource = "voice" | "keyboard" | "import" | "api";

/**
 * RawInput - One user input = one RawInput object
 * 
 * This is the entry point to the entire system.
 * Everything downstream (Distillation, Cards, Processes) starts here.
 * 
 * Key properties:
 * - ONE input = ONE RawInput (no batching, no chat history)
 * - Language is detected and stored immediately
 * - Source is tracked (voice vs keyboard)
 * - Timestamp is precise
 * - No business logic, just raw data
 */
export interface RawInput {
  id: string; // Unique identifier (UUID)
  
  // The actual input
  text: string; // Raw text (speech-to-text or typed)
  
  // Language context (detected from text)
  language: LanguageContext;
  
  // Source tracking
  source: InputSource; // voice | keyboard | import | api
  
  // Voice-specific (if source === "voice")
  voiceInput?: VoiceInput; // Full voice input data
  
  // Timestamps
  timestamp: number; // Unix timestamp (when captured)
  processedAt?: number; // When sent to Distillation layer
  
  // Session context
  sessionId: string; // Anonymous session identifier
  scope: "private" | "global"; // Where it was captured
  
  // Metadata (for debugging/future use)
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
  
  // Validation
  isValid: boolean; // Is this input valid for processing?
  validationErrors?: string[]; // If not valid, why?
}

// ============================================================================
// 4. LANGUAGE DETECTION
// ============================================================================

/**
 * LanguageDetector - Function to detect language from text
 * 
 * Implementation options:
 * - Simple heuristic (character ranges, common words)
 * - Library (e.g., franc, langdetect)
 * - API (e.g., Google Cloud Translation API)
 * 
 * This is REPLACEABLE - swap implementations without breaking system
 */
export interface LanguageDetector {
  detect(text: string): LanguageContext;
}

/**
 * Simple language detection (heuristic-based)
 * 
 * This is a CHEAP implementation:
 * - No API calls
 * - No external dependencies
 * - Fast and deterministic
 * - Good enough for most cases
 * 
 * Can be replaced with better implementation later
 */
export function detectLanguageSimple(text: string): LanguageContext {
  if (!text || text.trim().length === 0) {
    return {
      detected: "en",
      confidence: 0.0,
      source: "default",
      timestamp: Date.now(),
    };
  }

  // Hebrew: Unicode range \u0590-\u05FF
  if (/[\u0590-\u05FF]/.test(text)) {
    return {
      detected: "he",
      confidence: 0.9,
      source: "input",
      timestamp: Date.now(),
    };
  }

  // Arabic: Unicode range \u0600-\u06FF
  if (/[\u0600-\u06FF]/.test(text)) {
    return {
      detected: "ar",
      confidence: 0.9,
      source: "input",
      timestamp: Date.now(),
    };
  }

  // Spanish: Common characters
  if (/[ñ¿¡áéíóúü]/.test(text.toLowerCase())) {
    return {
      detected: "es",
      confidence: 0.8,
      source: "input",
      timestamp: Date.now(),
    };
  }

  // French: Common characters
  if (/[àâçéèêëîïôûùüÿœ]/.test(text.toLowerCase())) {
    return {
      detected: "fr",
      confidence: 0.8,
      source: "input",
      timestamp: Date.now(),
    };
  }

  // Default: English
  return {
    detected: "en",
    confidence: 0.7, // Lower confidence for default
    source: "input",
    timestamp: Date.now(),
  };
}

// ============================================================================
// 5. INPUT VALIDATION
// ============================================================================

/**
 * Validate raw input before processing
 * 
 * Rules:
 * - Text must not be empty
 * - Text must not exceed max length (e.g., 1000 chars)
 * - Must have valid sessionId
 * - Must have valid timestamp
 */
export function validateRawInput(input: Partial<RawInput>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.text || input.text.trim().length === 0) {
    errors.push("Text cannot be empty");
  }

  if (input.text && input.text.length > 1000) {
    errors.push("Text exceeds maximum length (1000 characters)");
  }

  if (!input.sessionId) {
    errors.push("Session ID is required");
  }

  if (!input.timestamp || input.timestamp <= 0) {
    errors.push("Valid timestamp is required");
  }

  if (!input.source) {
    errors.push("Input source is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 6. INPUT CREATION
// ============================================================================

/**
 * Create RawInput from text (keyboard input)
 */
export function createRawInputFromText(
  text: string,
  sessionId: string,
  scope: "private" | "global" = "private"
): RawInput {
  const language = detectLanguageSimple(text);
  const validation = validateRawInput({ text, sessionId, timestamp: Date.now(), source: "keyboard" });

  return {
    id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    language,
    source: "keyboard",
    timestamp: Date.now(),
    sessionId,
    scope,
    isValid: validation.isValid,
    validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
  };
}

/**
 * Create RawInput from voice input
 */
export function createRawInputFromVoice(
  voiceInput: VoiceInput,
  sessionId: string,
  scope: "private" | "global" = "private"
): RawInput | null {
  if (!voiceInput.transcript) {
    return null; // No transcript available
  }

  const language = detectLanguageSimple(voiceInput.transcript);
  const validation = validateRawInput({
    text: voiceInput.transcript,
    sessionId,
    timestamp: Date.now(),
    source: "voice",
  });

  return {
    id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: voiceInput.transcript.trim(),
    language,
    source: "voice",
    voiceInput,
    timestamp: voiceInput.startedAt || Date.now(),
    sessionId,
    scope,
    isValid: validation.isValid,
    validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
  };
}

