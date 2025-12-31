-- ONE01 Minimal Persistence Schema
-- Created: 2025-01-XX
-- Purpose: Enable card persistence from AI interactions

-- Sessions table: Track anonymous guest sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL, -- Client-generated session ID (e.g., "session_1234567890_abc123")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- Cards table: Store cards created from AI interactions
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  bubble_id TEXT NOT NULL, -- e.g., "bubble-0", "bubble-1-health", "bubble-2-money"
  title TEXT NOT NULL,
  intent TEXT NOT NULL, -- Extracted intent from AI or user input
  world TEXT, -- "health", "money", "work", "learning", "creative", "life" (nullable)
  state TEXT NOT NULL DEFAULT 'draft', -- draft, active, done, archived
  source TEXT DEFAULT 'ai', -- ai, user, system
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_session_id ON cards(session_id);
CREATE INDEX IF NOT EXISTS idx_cards_bubble_id ON cards(bubble_id);
CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- Card events table: Audit log for card lifecycle events
CREATE TABLE IF NOT EXISTS card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- created, updated, state_changed, deleted, etc.
  metadata JSONB, -- Flexible event data (user message, AI response, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_events_card_id ON card_events(card_id);
CREATE INDEX IF NOT EXISTS idx_card_events_session_id ON card_events(session_id);
CREATE INDEX IF NOT EXISTS idx_card_events_created_at ON card_events(created_at DESC);

-- Chat messages table: Persist chat history (optional for MVP, can be enabled later)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  bubble_id TEXT NOT NULL, -- Which bubble context this message belongs to
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_bubble ON chat_messages(session_id, bubble_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
-- For now, disable RLS since we're using service role key in API routes
-- Can enable later with proper policies when authentication is added
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role (used in API routes) to do everything
-- Regular users (anon) cannot access - this is intentional for now (anonymous-first)
CREATE POLICY "Service role can do everything on sessions" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on cards" ON cards
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on card_events" ON card_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on chat_messages" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');

