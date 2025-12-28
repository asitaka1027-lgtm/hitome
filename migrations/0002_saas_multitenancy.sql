-- SaaS化のためのマルチテナント対応マイグレーション

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  line_user_id TEXT UNIQUE,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);

-- 店舗テーブル
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  
  -- ビジネス情報
  business_hours TEXT NOT NULL,
  tone TEXT DEFAULT 'polite',
  category TEXT DEFAULT 'salon',
  alert_segment TEXT DEFAULT 'standard',
  auto_reply_enabled INTEGER DEFAULT 0,
  
  -- LINE設定（店舗ごと）
  line_channel_id TEXT,
  line_channel_secret TEXT,
  line_access_token TEXT,
  line_refresh_token TEXT,
  line_webhook_verified INTEGER DEFAULT 0,
  
  -- Google設定（店舗ごと）
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_business_id TEXT,
  google_location_id TEXT,
  
  -- メタ情報
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- ユーザー・店舗の多対多関係（将来の複数ユーザー対応）
CREATE TABLE IF NOT EXISTS store_users (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'owner', -- owner, admin, staff
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_users_store_id ON store_users(store_id);
CREATE INDEX IF NOT EXISTS idx_store_users_user_id ON store_users(user_id);

-- 既存のthreadsテーブルにstore_idを追加
ALTER TABLE threads ADD COLUMN store_id TEXT;

-- 既存データの移行用（一時的にNULLを許可）
-- 本番では初回の店舗IDを設定する処理が必要

CREATE INDEX IF NOT EXISTS idx_threads_store_id ON threads(store_id);

-- 既存のmessagesテーブルにstore_idを追加
ALTER TABLE messages ADD COLUMN store_id TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_store_id ON messages(store_id);

-- セッションテーブル（認証用）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  store_id TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 危険ワードテーブル（将来の拡張用）
CREATE TABLE IF NOT EXISTS danger_words (
  id TEXT PRIMARY KEY,
  store_id TEXT,
  word TEXT NOT NULL,
  severity TEXT DEFAULT 'high', -- high, medium, low
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_danger_words_store_id ON danger_words(store_id);
CREATE INDEX IF NOT EXISTS idx_danger_words_word ON danger_words(word);

-- デフォルトの危険ワードを挿入（store_id = NULL = グローバル）
INSERT OR IGNORE INTO danger_words (id, store_id, word, severity, is_active, created_at) VALUES
  ('dw_001', NULL, '食中毒', 'high', 1, unixepoch()),
  ('dw_002', NULL, '警察', 'high', 1, unixepoch()),
  ('dw_003', NULL, '訴える', 'high', 1, unixepoch()),
  ('dw_004', NULL, '弁護士', 'high', 1, unixepoch()),
  ('dw_005', NULL, '薬', 'medium', 1, unixepoch()),
  ('dw_006', NULL, '副作用', 'high', 1, unixepoch()),
  ('dw_007', NULL, '返金', 'medium', 1, unixepoch()),
  ('dw_008', NULL, '炎上', 'high', 1, unixepoch()),
  ('dw_009', NULL, '個人情報', 'high', 1, unixepoch()),
  ('dw_010', NULL, '訴訟', 'high', 1, unixepoch()),
  ('dw_011', NULL, 'クレーム', 'medium', 1, unixepoch()),
  ('dw_012', NULL, '詐欺', 'high', 1, unixepoch()),
  ('dw_013', NULL, '被害', 'high', 1, unixepoch()),
  ('dw_014', NULL, '通報', 'high', 1, unixepoch()),
  ('dw_015', NULL, '騙された', 'high', 1, unixepoch()),
  ('dw_016', NULL, '最悪', 'medium', 1, unixepoch()),
  ('dw_017', NULL, '二度と行かない', 'medium', 1, unixepoch());
