/**
 * API Client for D1 Database Integration
 * Provides functions to interact with Cloudflare Functions
 */

import { Thread, ThreadStatus } from '../types';

const API_BASE = typeof window !== 'undefined' ? '' : 'https://hitome.pages.dev';

/**
 * Fetch all threads from D1 database
 */
export async function fetchThreads(): Promise<Thread[]> {
  try {
    const response = await fetch(`${API_BASE}/api/threads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch threads');
    }

    // Convert D1 format to Thread format
    return (data.threads || []).map((t: any) => convertD1ToThread(t));
  } catch (error) {
    console.error('Failed to fetch threads:', error);
    throw error;
  }
}

/**
 * Update thread status
 */
export async function updateThreadStatus(
  threadId: string,
  status: ThreadStatus
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/messages/${threadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update thread');
    }
  } catch (error) {
    console.error('Failed to update thread status:', error);
    throw error;
  }
}

/**
 * Send manual reply
 */
export async function sendManualReply(
  threadId: string,
  message: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/messages/${threadId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to send reply');
    }
  } catch (error) {
    console.error('Failed to send manual reply:', error);
    throw error;
  }
}

/**
 * Convert D1 database format to Thread type
 */
function convertD1ToThread(d1Thread: any): Thread {
  return {
    id: d1Thread.id,
    channel: d1Thread.channel as 'LINE' | 'Google',
    userName: d1Thread.user_name || 'Unknown',
    userId: d1Thread.user_id || '',
    status: d1Thread.status as ThreadStatus,
    tags: d1Thread.tags ? JSON.parse(d1Thread.tags) : [],
    lastMessage: d1Thread.last_message || '',
    aiSummary: d1Thread.ai_summary || '',
    aiIntent: d1Thread.ai_intent || '',
    aiResponse: d1Thread.ai_response || '',
    hasDangerWord: Boolean(d1Thread.has_danger_word),
    isRead: Boolean(d1Thread.is_read),
    googleRating: d1Thread.google_rating || undefined,
    googleReviewComment: d1Thread.google_review_comment || undefined,
    createdAt: d1Thread.created_at || Date.now(),
    updatedAt: d1Thread.updated_at || Date.now(),
    receivedAt: d1Thread.received_at || Date.now(),
  };
}

/**
 * Poll for new threads (for real-time updates)
 */
export function startThreadPolling(
  onUpdate: (threads: Thread[]) => void,
  intervalMs: number = 10000 // 10 seconds
): () => void {
  const poll = async () => {
    try {
      const threads = await fetchThreads();
      onUpdate(threads);
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  const intervalId = setInterval(poll, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
