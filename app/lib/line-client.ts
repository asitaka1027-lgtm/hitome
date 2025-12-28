import { LINE_CONFIG, LINE_API } from './line-config';

// Verify LINE webhook signature using Web Crypto API
export const verifySignature = async (body: string, signature: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(LINE_CONFIG.channelSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signed = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
    
    const hash = btoa(String.fromCharCode(...new Uint8Array(signed)));
    return hash === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

// Send reply message
export const replyMessage = async (
  replyToken: string,
  messages: { type: string; text: string }[]
): Promise<boolean> => {
  try {
    const response = await fetch(LINE_API.REPLY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CONFIG.channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send reply:', error);
    return false;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<{
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
} | null> => {
  try {
    const response = await fetch(`${LINE_API.PROFILE}/${userId}`, {
      headers: {
        Authorization: `Bearer ${LINE_CONFIG.channelAccessToken}`,
      },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

// Parse LINE webhook events
export interface LINEMessageEvent {
  type: 'message';
  replyToken: string;
  source: {
    userId: string;
    type: 'user' | 'group' | 'room';
  };
  timestamp: number;
  message: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
    text?: string;
  };
}

export interface LINEWebhookBody {
  destination: string;
  events: LINEMessageEvent[];
}
