-- Migration: 0001_create_memories
-- Creates the memories table for RecallAI's long-term memory system

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fact', 'preference', 'episodic')),
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  embedding TEXT,
  source_conversation_id TEXT,
  source_message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  access_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_user_type ON memories(user_id, type);
CREATE INDEX idx_memories_importance ON memories(user_id, importance DESC);
