// API to get/update messages for a thread with Multi-Tenancy Support
import { getSession, hasStoreAccess, parseSessionCookie } from '../../lib/auth';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/messages/[id] - Get messages for a thread
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { params, request, env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get session
    const sessionId = parseSessionCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = await getSession(env.DB, sessionId);
    if (!session || !session.storeId) {
      return new Response(
        JSON.stringify({ error: 'No store selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const threadId = params.id as string;
    
    if (!threadId) {
      return new Response(JSON.stringify({ error: 'Thread ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verify thread belongs to user's store
    const thread = await env.DB
      .prepare('SELECT store_id FROM threads WHERE id = ?')
      .bind(threadId)
      .first();
    
    if (!thread || thread.store_id !== session.storeId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get messages
    const result = await env.DB
      .prepare('SELECT * FROM messages WHERE thread_id = ? AND store_id = ? ORDER BY timestamp ASC')
      .bind(threadId, session.storeId)
      .all();
    
    return new Response(JSON.stringify({
      messages: result.results || [],
      success: true,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get messages',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/messages/[id] - Send manual reply
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { params, request, env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get session
    const sessionId = parseSessionCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = await getSession(env.DB, sessionId);
    if (!session || !session.storeId) {
      return new Response(
        JSON.stringify({ error: 'No store selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const threadId = params.id as string;
    const body = await request.json();
    const { message } = body;
    
    if (!threadId || !message) {
      return new Response(
        JSON.stringify({ error: 'Thread ID and message required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify thread belongs to user's store and get LINE info
    const thread = await env.DB
      .prepare(`
        SELECT t.store_id, t.user_id, s.line_access_token 
        FROM threads t
        INNER JOIN stores s ON t.store_id = s.id
        WHERE t.id = ?
      `)
      .bind(threadId)
      .first();
    
    if (!thread || thread.store_id !== session.storeId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // TODO: Send message via LINE Push API
    // For now, just save to database
    
    // Save message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await env.DB
      .prepare(`
        INSERT INTO messages (id, thread_id, store_id, sender, message, timestamp)
        VALUES (?, ?, ?, 'staff', ?, ?)
      `)
      .bind(messageId, threadId, session.storeId, message, Math.floor(Date.now() / 1000))
      .run();
    
    // Update thread status to completed
    await env.DB
      .prepare('UPDATE threads SET status = ?, updated_at = ? WHERE id = ?')
      .bind('completed', Math.floor(Date.now() / 1000), threadId)
      .run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send message',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH /api/messages/[id] - Update thread status
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { params, request, env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get session
    const sessionId = parseSessionCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = await getSession(env.DB, sessionId);
    if (!session || !session.storeId) {
      return new Response(
        JSON.stringify({ error: 'No store selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const threadId = params.id as string;
    const body = await request.json();
    const { status } = body;
    
    if (!threadId || !status) {
      return new Response(
        JSON.stringify({ error: 'Thread ID and status required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify thread belongs to user's store
    const thread = await env.DB
      .prepare('SELECT store_id FROM threads WHERE id = ?')
      .bind(threadId)
      .first();
    
    if (!thread || thread.store_id !== session.storeId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update status
    await env.DB
      .prepare('UPDATE threads SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, Math.floor(Date.now() / 1000), threadId)
      .run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update status:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update status',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
