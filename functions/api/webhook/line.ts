// Cloudflare Pages Function for LINE Webhook with D1 integration
// https://hitome.pages.dev/api/webhook/line

interface Env {
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  DB: D1Database;
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

// Get user profile
async function getUserProfile(userId: string, accessToken: string): Promise<string> {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) return 'ユーザー';
    
    const profile = await response.json();
    return profile.displayName || 'ユーザー';
  } catch (error) {
    return 'ユーザー';
  }
}

// Check danger words
function hasDangerWords(text: string): boolean {
  const dangerWords = ['食中毒', '警察', '訴える', '返金', '炎上', '詐欺', '弁護士', '訴訟', '被害', '通報'];
  return dangerWords.some(word => text.includes(word));
}

// Extract tags
function extractTags(text: string): string[] {
  const tags: string[] = [];
  
  if (text.includes('予約')) tags.push('reservation');
  if (text.includes('営業時間') || text.includes('何時')) tags.push('hours');
  if (text.includes('場所') || text.includes('住所')) tags.push('location');
  if (text.includes('駐車')) tags.push('parking');
  if (text.includes('メニュー') || text.includes('料金')) tags.push('menu');
  if (hasDangerWords(text)) tags.push('danger');
  
  return tags.length > 0 ? tags : ['question'];
}

// Generate AI summary
function generateSummary(text: string): string {
  if (hasDangerWords(text)) return 'クレーム疑い。慎重な対応が必要です。';
  if (text.includes('予約')) return '予約の問い合わせ。日時・人数の確認が必要';
  if (text.includes('営業時間')) return '営業時間についての質問';
  if (text.includes('場所')) return '店舗の場所・アクセスについての質問';
  return '一般的な問い合わせ。内容確認が必要';
}

// Generate AI intent
function generateIntent(text: string): string {
  if (hasDangerWords(text)) return 'クレーム疑い';
  if (text.includes('予約')) return '予約希望';
  if (text.includes('営業時間')) return '営業時間の質問';
  if (text.includes('場所')) return '場所の質問';
  return '一般質問';
}

// Generate AI response
function generateResponse(text: string): string {
  const textLower = text.toLowerCase();
  
  // Danger words - no auto reply
  if (hasDangerWords(text)) return '';
  
  // Pattern matching
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

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// POST handler
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // Validate configuration
    if (!env.LINE_CHANNEL_SECRET || !env.LINE_CHANNEL_ACCESS_TOKEN || !env.DB) {
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
        await handleTextMessage(event, env);
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

// Handle text message
async function handleTextMessage(event: LINEMessageEvent, env: Env) {
  const messageText = event.message.text || '';
  const userId = event.source.userId;
  const timestamp = Math.floor(event.timestamp / 1000);
  
  // Get user profile
  const userName = await getUserProfile(userId, env.LINE_CHANNEL_ACCESS_TOKEN);
  
  // Generate AI analysis
  const tags = extractTags(messageText);
  const summary = generateSummary(messageText);
  const intent = generateIntent(messageText);
  const response = generateResponse(messageText);
  const isDangerous = hasDangerWords(messageText);
  
  // Determine status
  const status = isDangerous ? 'review' : 'unhandled';
  
  // Create thread ID
  const threadId = generateId();
  
  // Save to database
  const now = Math.floor(Date.now() / 1000);
  
  // Insert thread
  await env.DB.prepare(`
    INSERT INTO threads (
      id, channel, user_name, user_id, status, tags, last_message,
      ai_summary, ai_intent, ai_response, has_danger_word, is_read,
      google_rating, google_review_comment, created_at, updated_at, received_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    threadId,
    'LINE',
    userName,
    userId,
    status,
    JSON.stringify(tags),
    messageText,
    summary,
    intent,
    response,
    isDangerous ? 1 : 0,
    0,
    null,
    null,
    now,
    now,
    timestamp
  ).run();
  
  // Insert user message
  await env.DB.prepare(`
    INSERT INTO messages (id, thread_id, sender, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    generateId(),
    threadId,
    'user',
    messageText,
    timestamp
  ).run();
  
  // Send reply if not dangerous
  if (response && !isDangerous) {
    const replied = await replyMessage(event.replyToken, response, env.LINE_CHANNEL_ACCESS_TOKEN);
    
    if (replied) {
      // Save AI response to messages
      await env.DB.prepare(`
        INSERT INTO messages (id, thread_id, sender, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        generateId(),
        threadId,
        'ai',
        response,
        now
      ).run();
      
      // Update thread to completed
      await env.DB.prepare(`
        UPDATE threads SET status = 'completed', updated_at = ? WHERE id = ?
      `).bind(now, threadId).run();
    }
  }
}

// GET handler (for verification)
export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'LINE Webhook endpoint with D1',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
