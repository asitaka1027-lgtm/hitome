// LINE Login エンドポイント
// Redirect to LINE OAuth

interface Env {
  LINE_LOGIN_CHANNEL_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  if (!env.LINE_LOGIN_CHANNEL_ID) {
    return new Response('Not configured', { status: 500 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Build LINE OAuth URL
  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.set('response_type', 'code');
  lineAuthUrl.searchParams.set('client_id', env.LINE_LOGIN_CHANNEL_ID);
  lineAuthUrl.searchParams.set('redirect_uri', 'https://hitome.pages.dev/api/auth/line/callback');
  lineAuthUrl.searchParams.set('state', state);
  lineAuthUrl.searchParams.set('scope', 'profile openid');

  // Redirect to LINE
  return Response.redirect(lineAuthUrl.toString(), 302);
};
