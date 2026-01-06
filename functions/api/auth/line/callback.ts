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
} from '../../../lib/auth';

interface Env {
  DB: D1Database;
  LINE_LOGIN_CHANNEL_ID: string;
  LINE_LOGIN_CHANNEL_SECRET: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get authorization code
  const code = url.searchParams.get('code');
  
  if (!code) {
    return new Response('Invalid request: missing code', { status: 400 });
  }
  
  // Note: State verification is skipped for now
  // In production, implement proper state storage (D1 or KV)
  
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
    const redirectUrl = `${url.origin}/`;
    const response = Response.redirect(redirectUrl, 302);
    response.headers.set('Set-Cookie', createSessionCookie(session.id, session.expiresAt));
    
    return response;
  } catch (error) {
    console.error('LINE Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Redirect to login with error
    const redirectUrl = `${url.origin}/?error=auth_failed&message=${encodeURIComponent(errorMessage)}`;
    return Response.redirect(redirectUrl, 302);
  }
}
