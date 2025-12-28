// Cloudflare Pages Function for LINE Webhook
// https://hitome.pages.dev/api/webhook/line

interface Env {
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
}

interface LINEMessageEvent {
  type: string;
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
  timestamp: number;
  message: {
    id: string;
    type: string;
    text?: string;
  };
}

interface LINEWebhookBody {
  destination: string;
  events: LINEMessageEvent[];
}

// Verify LINE signature
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hash = btoa(String.fromCharCode(...new Uint8Array(signed)));
  return hash === signature;
}

// Reply to LINE message
async function replyMessage(
  replyToken: string,
  text: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Reply failed:', error);
    return false;
  }
}

// Generate AI response (simple stub)
function generateResponse(messageText: string): string {
  const text = messageText.toLowerCase();
  
  // Danger words check
  const dangerWords = ['食中毒', '警察', '訴える', '返金', '炎上', '詐欺'];
  if (dangerWords.some(word => messageText.includes(word))) {
    return ''; // Don't auto-reply for dangerous messages
  }
  
  // Simple pattern matching
  if (text.includes('予約')) {
    return 'ご予約ありがとうございます。ご希望の日時、人数、メニューを教えてください。';
  }
  if (text.includes('営業時間')) {
    return 'お問い合わせありがとうございます。営業時間は09:00〜21:00です。';
  }
  if (text.includes('場所') || text.includes('住所')) {
    return '店舗の場所はプロフィール欄をご確認ください。';
  }
  if (text.includes('駐車場')) {
    return '駐車場についてはお気軽にお問い合わせください。';
  }
  
  return 'お問い合わせありがとうございます。詳しい内容を教えてください。';
}

// POST handler
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // Validate configuration
    if (!env.LINE_CHANNEL_SECRET || !env.LINE_CHANNEL_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get signature
    const signature = request.headers.get('x-line-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get body
    const bodyText = await request.text();
    
    // Verify signature
    const isValid = await verifySignature(bodyText, signature, env.LINE_CHANNEL_SECRET);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Parse webhook
    const body: LINEWebhookBody = JSON.parse(bodyText);
    
    // Process events
    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text' && event.message.text) {
        const messageText = event.message.text;
        const response = generateResponse(messageText);
        
        if (response) {
          await replyMessage(event.replyToken, response, env.LINE_CHANNEL_ACCESS_TOKEN);
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// GET handler (for verification)
export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'LINE Webhook endpoint',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
