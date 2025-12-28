/**
 * Authentication utilities for SaaS multi-tenancy
 */

export interface User {
  id: string;
  email: string | null;
  name: string;
  lineUserId: string | null;
  avatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  businessHours: string;
  tone: string;
  category: string;
  alertSegment: string;
  autoReplyEnabled: boolean;
  lineChannelId: string | null;
  lineChannelSecret: string | null;
  lineAccessToken: string | null;
  googleAccessToken: string | null;
  googleBusinessId: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  userId: string;
  storeId: string | null;
  expiresAt: number;
  createdAt: number;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create session cookie
 */
export function createSessionCookie(sessionId: string, expiresAt: number): string {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  return `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Parse session cookie
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Get session from database
 */
export async function getSession(
  db: D1Database,
  sessionId: string
): Promise<Session | null> {
  const result = await db
    .prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
    .bind(sessionId, Date.now())
    .first();

  if (!result) return null;

  return {
    id: result.id as string,
    userId: result.user_id as string,
    storeId: result.store_id as string | null,
    expiresAt: result.expires_at as number,
    createdAt: result.created_at as number,
  };
}

/**
 * Get user from database
 */
export async function getUser(
  db: D1Database,
  userId: string
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!result) return null;

  return {
    id: result.id as string,
    email: result.email as string | null,
    name: result.name as string,
    lineUserId: result.line_user_id as string | null,
    avatarUrl: result.avatar_url as string | null,
    createdAt: result.created_at as number,
    updatedAt: result.updated_at as number,
  };
}

/**
 * Get stores for user
 */
export async function getUserStores(
  db: D1Database,
  userId: string
): Promise<Store[]> {
  const result = await db
    .prepare(`
      SELECT s.* FROM stores s
      INNER JOIN store_users su ON s.id = su.store_id
      WHERE su.user_id = ? AND s.is_active = 1
      ORDER BY s.created_at DESC
    `)
    .bind(userId)
    .all();

  return (result.results || []).map((row: any) => convertDbToStore(row));
}

/**
 * Get store by ID
 */
export async function getStore(
  db: D1Database,
  storeId: string
): Promise<Store | null> {
  const result = await db
    .prepare('SELECT * FROM stores WHERE id = ? AND is_active = 1')
    .bind(storeId)
    .first();

  if (!result) return null;

  return convertDbToStore(result);
}

/**
 * Check if user has access to store
 */
export async function hasStoreAccess(
  db: D1Database,
  userId: string,
  storeId: string
): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM store_users WHERE user_id = ? AND store_id = ?')
    .bind(userId, storeId)
    .first();

  return result !== null;
}

/**
 * Create new user
 */
export async function createUser(
  db: D1Database,
  data: {
    lineUserId: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  }
): Promise<User> {
  const userId = generateId('user');
  const now = Date.now();

  await db
    .prepare(`
      INSERT INTO users (id, line_user_id, name, email, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      userId,
      data.lineUserId,
      data.name,
      data.email || null,
      data.avatarUrl || null,
      now,
      now
    )
    .run();

  return {
    id: userId,
    lineUserId: data.lineUserId,
    name: data.name,
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create new session
 */
export async function createSession(
  db: D1Database,
  userId: string,
  storeId: string | null = null
): Promise<Session> {
  const sessionId = generateId('session');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  await db
    .prepare(`
      INSERT INTO sessions (id, user_id, store_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(sessionId, userId, storeId, expiresAt, now)
    .run();

  return {
    id: sessionId,
    userId,
    storeId,
    expiresAt,
    createdAt: now,
  };
}

/**
 * Update session store
 */
export async function updateSessionStore(
  db: D1Database,
  sessionId: string,
  storeId: string
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET store_id = ? WHERE id = ?')
    .bind(storeId, sessionId)
    .run();
}

/**
 * Delete session
 */
export async function deleteSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE id = ?')
    .bind(sessionId)
    .run();
}

/**
 * Helper: Convert DB row to Store
 */
function convertDbToStore(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    businessHours: row.business_hours,
    tone: row.tone,
    category: row.category,
    alertSegment: row.alert_segment,
    autoReplyEnabled: Boolean(row.auto_reply_enabled),
    lineChannelId: row.line_channel_id,
    lineChannelSecret: row.line_channel_secret,
    lineAccessToken: row.line_access_token,
    googleAccessToken: row.google_access_token,
    googleBusinessId: row.google_business_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
