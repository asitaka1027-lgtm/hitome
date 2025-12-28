/**
 * LINE Login Callback Endpoint
 * Handles OAuth callback from LINE
 */

import {
  createUser,
  createSession,
  createSessionCookie,
  generateId,
  getUser,
} from '../../../../app/lib/auth';

interface Env {
  DB: D1Database;
  LINE_LOGIN_CHANNEL_ID: string;
  LINE_LOGIN_CHANNEL_SECRET: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get authorization code and state
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code || !state) {
    return new Response('Invalid request', { status: 400 });
  }
  
  // Verify state (CSRF protection)
  const cookies = request.headers.get('Cookie') || '';
  const storedState = cookies.match(/line_auth_state=([^;]+)/)?.[1];
  
  if (state !== storedState) {
    return new Response('Invalid state', { status: 400 });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${url.origin}/api/auth/line/callback`,
        client_id: env.LINE_LOGIN_CHANNEL_ID,
        client_secret: env.LINE_LOGIN_CHANNEL_SECRET,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token');
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Failed to get profile');
    }
    
    const profile = await profileResponse.json();
    
    // Check if user exists
    const existingUser = await env.DB
      .prepare('SELECT * FROM users WHERE line_user_id = ?')
      .bind(profile.userId)
      .first();
    
    let user;
    if (existingUser) {
      // Existing user
      user = {
        id: existingUser.id as string,
        lineUserId: existingUser.line_user_id as string,
        name: existingUser.name as string,
        email: existingUser.email as string | null,
        avatarUrl: existingUser.avatar_url as string | null,
        createdAt: existingUser.created_at as number,
        updatedAt: existingUser.updated_at as number,
      };
      
      // Update profile
      await env.DB
        .prepare(`
          UPDATE users 
          SET name = ?, avatar_url = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(profile.displayName, profile.pictureUrl || null, Date.now(), user.id)
        .run();
    } else {
      // New user
      user = await createUser(env.DB, {
        lineUserId: profile.userId,
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
      });
    }
    
    // Create session
    const session = await createSession(env.DB, user.id);
    
    // Set session cookie
    const response = Response.redirect('/', 302);
    response.headers.set('Set-Cookie', createSessionCookie(session.id, session.expiresAt));
    
    // Clear auth state cookie
    response.headers.append(
      'Set-Cookie',
      'line_auth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );
    
    return response;
  } catch (error) {
    console.error('LINE Login error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}
