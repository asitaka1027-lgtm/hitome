/**
 * LINE Login Authentication Endpoint
 * Redirects user to LINE Login page
 */

interface Env {
  LINE_LOGIN_CHANNEL_ID: string;
  LINE_LOGIN_CHANNEL_SECRET: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  
  // Generate nonce
  const nonce = crypto.randomUUID();
  
  // Redirect URL
  const redirectUri = `${url.origin}/api/auth/line/callback`;
  
  // Build LINE Login URL
  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.set('response_type', 'code');
  lineAuthUrl.searchParams.set('client_id', env.LINE_LOGIN_CHANNEL_ID);
  lineAuthUrl.searchParams.set('redirect_uri', redirectUri);
  lineAuthUrl.searchParams.set('state', state);
  lineAuthUrl.searchParams.set('scope', 'profile openid email');
  lineAuthUrl.searchParams.set('nonce', nonce);
  
  // Store state in cookie for verification
  const response = Response.redirect(lineAuthUrl.toString(), 302);
  response.headers.set(
    'Set-Cookie',
    `line_auth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  
  return response;
}
