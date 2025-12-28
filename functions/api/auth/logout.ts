/**
 * Logout Endpoint
 * Deletes session and clears cookie
 */

import { deleteSession, parseSessionCookie } from '../../../app/lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Get session ID from cookie
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  
  if (sessionId) {
    // Delete session from database
    await deleteSession(env.DB, sessionId);
  }
  
  // Clear session cookie
  const response = new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  response.headers.set(
    'Set-Cookie',
    'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  
  return response;
}
