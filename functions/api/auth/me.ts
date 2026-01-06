/**
 * Get Current User Endpoint
 * Returns authenticated user info with their stores
 */

import {
  getSession,
  getUser,
  getUserStores,
  parseSessionCookie,
} from '../../lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Get session ID from cookie
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  try {
    // Get session
    const session = await getSession(env.DB, sessionId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get user
    const user = await getUser(env.DB, session.userId);
    
    if (!user) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get user's stores
    const stores = await getUserStores(env.DB, user.id);
    
    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        currentStoreId: session.storeId,
        stores: stores.map(store => ({
          id: store.id,
          name: store.name,
          isActive: store.isActive,
        })),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
