-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK(channel IN ('LINE', 'GOOGLE')),
  user_name TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('unhandled', 'review', 'completed')) DEFAULT 'unhandled',
  tags TEXT, -- JSON array as text
  last_message TEXT NOT NULL,
  ai_summary TEXT,
  ai_intent TEXT,
  ai_response TEXT,
  has_danger_word INTEGER DEFAULT 0,
  is_read INTEGER DEFAULT 0,
  google_rating INTEGER,
  google_review_comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'store', 'ai')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  store_name TEXT NOT NULL,
  business_hours_start TEXT NOT NULL,
  business_hours_end TEXT NOT NULL,
  tone TEXT NOT NULL CHECK(tone IN ('polite', 'standard', 'casual')),
  industry TEXT NOT NULL CHECK(industry IN ('salon', 'restaurant', 'medical')),
  alert_segment TEXT NOT NULL CHECK(alert_segment IN ('immediate', 'standard', 'relaxed')),
  auto_reply_high_rating INTEGER DEFAULT 0,
  line_connected INTEGER DEFAULT 0,
  google_connected INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_channel ON threads(channel);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Insert default settings
INSERT INTO settings (
  id,
  store_name,
  business_hours_start,
  business_hours_end,
  tone,
  industry,
  alert_segment,
  auto_reply_high_rating,
  line_connected,
  google_connected,
  created_at,
  updated_at
) VALUES (
  1,
  'テスト店舗',
  '09:00',
  '21:00',
  'standard',
  'salon',
  'standard',
  0,
  1,
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
