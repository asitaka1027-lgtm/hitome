// Cloudflare Pages Function for LINE Webhook with Multi-Tenancy Support
// https://hitome.pages.dev/api/webhook/line

import { getStore } from '../../lib/auth';

interface Env {
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
  destination: string; // This is the LINE channel ID
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

// Check danger words from database
async function hasDangerWords(db: D1Database, text: string, storeId: string): Promise<boolean> {
  // Get danger words for this store and global
  const result = await db
    .prepare(`
      SELECT word FROM danger_words 
      WHERE (store_id = ? OR store_id IS NULL) AND is_active = 1
    `)
    .bind(storeId)
    .all();
  
  const dangerWords = (result.results || []).map((r: any) => r.word);
  return dangerWords.some(word => text.includes(word));
}

// Extract tags
function extractTags(text: string): string[] {
  const tags: string[] = [];
  
  if (text.match(/営業|時間|何時/)) tags.push('hours');
  if (text.match(/場所|アクセス|どこ|住所/)) tags.push('location');
  if (text.match(/駐車|車|パーキング/)) tags.push('parking');
  if (text.match(/予約|空き|取りたい/)) tags.push('reservation');
  if (text.match(/料金|価格|いくら|値段/)) tags.push('price');
  if (text.match(/メニュー|コース|内容/)) tags.push('menu');
  
  return tags;
}

// Generate AI summary
function generateAISummary(text: string): string {
  if (text.match(/営業|時間/)) return '営業時間についての質問';
  if (text.match(/場所|アクセス/)) return 'アクセス方法についての質問';
  if (text.match(/予約/)) return '予約希望';
  if (text.match(/料金|価格/)) return '料金についての質問';
  return 'お問い合わせ';
}

// Generate AI response
function generateAIResponse(text: string, businessHours: string): string {
  if (text.match(/営業|時間/)) {
    return `お問い合わせありがとうございます。営業時間は${businessHours}です。`;
  }
  if (text.match(/場所|アクセス/)) {
    return 'お問い合わせありがとうございます。詳しいアクセス方法をお送りいたします。';
  }
  if (text.match(/駐車/)) {
    return 'お問い合わせありがとうございます。駐車場についてご案内いたします。';
  }
  if (text.match(/予約/)) {
    return 'ご予約ありがとうございます。詳細を確認させていただきます。';
  }
  
  return 'お問い合わせありがとうございます。担当者が確認いたします。';
}

// Check if should auto reply
function shouldAutoReply(text: string): boolean {
  // Auto reply for common questions
  const autoReplyPatterns = [
    /営業|時間/,
    /場所|アクセス/,
    /駐車/,
  ];
  
  // No auto reply for sensitive topics
  const noAutoReplyPatterns = [
    /料金|価格|いくら/,
    /クレーム|苦情/,
    /診断|治療|薬/,
  ];
  
  if (noAutoReplyPatterns.some(p => p.test(text))) return false;
  return autoReplyPatterns.some(p => p.test(text));
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Handle GET (verification)
  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'ok',
        message: 'LINE Webhook endpoint with Multi-Tenancy'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Handle POST (webhook)
  try {
    const bodyText = await request.text();
    const body: LINEWebhookBody = JSON.parse(bodyText);
    
    // Get destination (LINE Channel ID)
    const channelId = body.destination;
    
    if (!channelId) {
      return new Response(JSON.stringify({ error: 'No channel ID' }), { status: 400 });
    }
    
    // Find store by LINE channel ID
    const storeResult = await env.DB
      .prepare('SELECT * FROM stores WHERE line_channel_id = ? AND is_active = 1')
      .bind(channelId)
      .first();
    
    if (!storeResult) {
      console.error('Store not found for channel:', channelId);
      return new Response(
        JSON.stringify({ error: 'Store not configured' }),
        { status: 404 }
      );
    }
    
    const store = {
      id: storeResult.id as string,
      name: storeResult.name as string,
      businessHours: storeResult.business_hours as string,
      lineChannelSecret: storeResult.line_channel_secret as string,
      lineAccessToken: storeResult.line_access_token as string,
      autoReplyEnabled: Boolean(storeResult.auto_reply_enabled),
    };
    
    // Verify signature
    const signature = request.headers.get('x-line-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }
    
    const isValid = await verifySignature(bodyText, signature, store.lineChannelSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }
    
    // Process each event
    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text || '';
        const userId = event.source.userId;
        
        // Get user name
        const userName = await getUserProfile(userId, store.lineAccessToken);
        
        // Check danger words
        const hasDanger = await hasDangerWords(env.DB, messageText, store.id);
        
        // Extract tags
        const tags = extractTags(messageText);
        
        // Generate AI analysis
        const aiSummary = generateAISummary(messageText);
        const aiResponse = generateAIResponse(messageText, store.businessHours);
        
        // Determine if auto reply
        const canAutoReply = shouldAutoReply(messageText) && !hasDanger && store.autoReplyEnabled;
        
        // Create thread ID
        const threadId = `${event.timestamp}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Save to database
        await env.DB
          .prepare(`
            INSERT INTO threads (
              id, store_id, channel, user_name, user_id, status, tags,
              last_message, ai_summary, ai_intent, ai_response,
              has_danger_word, is_read, created_at, updated_at, received_at
            )
            VALUES (?, ?, 'LINE', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
          `)
          .bind(
            threadId,
            store.id,
            userName,
            userId,
            canAutoReply ? 'completed' : (hasDanger ? 'review' : 'unhandled'),
            JSON.stringify(tags),
            messageText,
            aiSummary,
            aiSummary,
            aiResponse,
            hasDanger ? 1 : 0,
            Math.floor(event.timestamp / 1000),
            Math.floor(event.timestamp / 1000),
            Math.floor(event.timestamp / 1000)
          )
          .run();
        
        // Save message
        await env.DB
          .prepare(`
            INSERT INTO messages (
              id, thread_id, store_id, sender, message, timestamp
            )
            VALUES (?, ?, ?, 'user', ?, ?)
          `)
          .bind(
            event.message.id,
            threadId,
            store.id,
            messageText,
            Math.floor(event.timestamp / 1000)
          )
          .run();
        
        // Auto reply if applicable
        if (canAutoReply) {
          await replyMessage(event.replyToken, aiResponse, store.lineAccessToken);
          
          // Save bot reply
          await env.DB
            .prepare(`
              INSERT INTO messages (
                id, thread_id, store_id, sender, message, timestamp
              )
              VALUES (?, ?, ?, 'bot', ?, ?)
            `)
            .bind(
              `${event.message.id}_reply`,
              threadId,
              store.id,
              aiResponse,
              Math.floor(Date.now() / 1000)
            )
            .run();
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
