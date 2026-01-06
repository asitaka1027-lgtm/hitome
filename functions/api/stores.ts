/**
 * Store Management Endpoints
 * Create, update, switch stores
 */

import {
  generateId,
  getSession,
  getUserStores,
  hasStoreAccess,
  parseSessionCookie,
  updateSessionStore,
} from '../lib/auth';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/stores - List user's stores
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const session = await getSession(env.DB, sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const stores = await getUserStores(env.DB, session.userId);
  
  return new Response(JSON.stringify({ stores }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/stores - Create new store
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const session = await getSession(env.DB, sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, businessHours, tone, category, alertSegment } = body;
    
    if (!name || !businessHours) {
      return new Response(
        JSON.stringify({ error: 'Name and business hours are required' }),
        { status: 400 }
      );
    }
    
    const storeId = generateId('store');
    const now = Date.now();
    
    // Create store
    await env.DB
      .prepare(`
        INSERT INTO stores (
          id, name, owner_id, business_hours, tone, category, alert_segment,
          auto_reply_enabled, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)
      `)
      .bind(
        storeId,
        name,
        session.userId,
        businessHours,
        tone || 'polite',
        category || 'salon',
        alertSegment || 'standard',
        now,
        now
      )
      .run();
    
    // Add user-store relationship
    await env.DB
      .prepare(`
        INSERT INTO store_users (id, store_id, user_id, role, created_at)
        VALUES (?, ?, ?, 'owner', ?)
      `)
      .bind(generateId('su'), storeId, session.userId, now)
      .run();
    
    // Update session to use this store
    await updateSessionStore(env.DB, sessionId, storeId);
    
    return new Response(
      JSON.stringify({ success: true, storeId }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create store error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create store' }),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores - Switch to different store
 */
export async function onRequestPatch(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const session = await getSession(env.DB, sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { storeId } = body;
    
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID is required' }),
        { status: 400 }
      );
    }
    
    // Check if user has access to this store
    const hasAccess = await hasStoreAccess(env.DB, session.userId, storeId);
    
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403 }
      );
    }
    
    // Update session
    await updateSessionStore(env.DB, sessionId, storeId);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Switch store error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to switch store' }),
      { status: 500 }
    );
  }
}
