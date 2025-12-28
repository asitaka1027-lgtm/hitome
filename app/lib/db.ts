// Database helper functions for Cloudflare D1

export interface DBThread {
  id: string;
  channel: 'LINE' | 'GOOGLE';
  user_name: string;
  user_id: string | null;
  status: 'unhandled' | 'review' | 'completed';
  tags: string; // JSON string
  last_message: string;
  ai_summary: string | null;
  ai_intent: string | null;
  ai_response: string | null;
  has_danger_word: number;
  is_read: number;
  google_rating: number | null;
  google_review_comment: string | null;
  created_at: number;
  updated_at: number;
  received_at: number;
}

export interface DBMessage {
  id: string;
  thread_id: string;
  sender: 'user' | 'store' | 'ai';
  content: string;
  created_at: number;
}

export interface DBSettings {
  id: number;
  store_name: string;
  business_hours_start: string;
  business_hours_end: string;
  tone: 'polite' | 'standard' | 'casual';
  industry: 'salon' | 'restaurant' | 'medical';
  alert_segment: 'immediate' | 'standard' | 'relaxed';
  auto_reply_high_rating: number;
  line_connected: number;
  google_connected: number;
  created_at: number;
  updated_at: number;
}

// Get settings
export async function getSettings(db: D1Database): Promise<DBSettings | null> {
  const result = await db
    .prepare('SELECT * FROM settings WHERE id = 1')
    .first<DBSettings>();
  return result;
}

// Create thread
export async function createThread(
  db: D1Database,
  thread: Omit<DBThread, 'created_at' | 'updated_at'>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      INSERT INTO threads (
        id, channel, user_name, user_id, status, tags, last_message,
        ai_summary, ai_intent, ai_response, has_danger_word, is_read,
        google_rating, google_review_comment, created_at, updated_at, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      thread.id,
      thread.channel,
      thread.user_name,
      thread.user_id,
      thread.status,
      thread.tags,
      thread.last_message,
      thread.ai_summary,
      thread.ai_intent,
      thread.ai_response,
      thread.has_danger_word,
      thread.is_read,
      thread.google_rating,
      thread.google_review_comment,
      now,
      now,
      thread.received_at
    )
    .run();
}

// Create message
export async function createMessage(
  db: D1Database,
  message: Omit<DBMessage, 'created_at'>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      INSERT INTO messages (id, thread_id, sender, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(message.id, message.thread_id, message.sender, message.content, now)
    .run();
}

// Get threads with optional filters
export async function getThreads(
  db: D1Database,
  filters?: {
    status?: 'unhandled' | 'review' | 'completed';
    channel?: 'LINE' | 'GOOGLE';
    limit?: number;
  }
): Promise<DBThread[]> {
  let query = 'SELECT * FROM threads WHERE 1=1';
  const bindings: any[] = [];

  if (filters?.status) {
    query += ' AND status = ?';
    bindings.push(filters.status);
  }

  if (filters?.channel) {
    query += ' AND channel = ?';
    bindings.push(filters.channel);
  }

  query += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    bindings.push(filters.limit);
  }

  const result = await db.prepare(query).bind(...bindings).all<DBThread>();
  return result.results || [];
}

// Get messages for a thread
export async function getMessages(
  db: D1Database,
  threadId: string
): Promise<DBMessage[]> {
  const result = await db
    .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC')
    .bind(threadId)
    .all<DBMessage>();
  return result.results || [];
}

// Update thread status
export async function updateThreadStatus(
  db: D1Database,
  threadId: string,
  status: 'unhandled' | 'review' | 'completed'
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare('UPDATE threads SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now, threadId)
    .run();
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
