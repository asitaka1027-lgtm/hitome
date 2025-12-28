// Channel types
export type ChannelType = 'LINE' | 'GOOGLE';

// Thread status
export type ThreadStatus = 'unhandled' | 'review' | 'completed';

// Alert segments
export type AlertSegment = 'immediate' | 'standard' | 'relaxed';

// Thread tags
export type ThreadTag = 
  | 'reservation' 
  | 'question' 
  | 'low_rating' 
  | 'danger'
  | 'location'
  | 'hours'
  | 'complaint'
  | 'menu'
  | 'parking';

// Message in a thread
export interface Message {
  id: string;
  sender: 'user' | 'store' | 'ai';
  content: string;
  timestamp: Date;
}

// Google Review specific
export interface GoogleReview {
  rating: number; // 1-5
  comment: string;
  reviewerName: string;
  timestamp: Date;
}

// Thread (unified inbox item)
export interface Thread {
  id: string;
  channel: ChannelType;
  userName: string;
  status: ThreadStatus;
  tags: ThreadTag[];
  lastMessage: string;
  timestamp: Date;
  receivedAt: Date; // For alert calculation
  aiSummary: string;
  aiIntent: string;
  aiResponse: string;
  messages?: Message[]; // For LINE
  googleReview?: GoogleReview; // For Google
  hasDangerWord: boolean;
  isRead: boolean;
}

// Store settings
export interface StoreSettings {
  storeName: string;
  businessHours: {
    start: string; // "09:00"
    end: string;   // "21:00"
  };
  tone: 'polite' | 'standard' | 'casual';
  industry: 'salon' | 'restaurant' | 'medical';
  alertSegment: AlertSegment;
  autoReplyHighRating: boolean; // For ★4-5
  lineConnected: boolean;
  googleConnected: boolean;
}

// KPI metrics
export interface KPIMetrics {
  unhandledCount: number;
  reviewCount: number;
  missedThisMonth: number;
  avgResponseMinutes: number;
  zeroUnhandledDays: number;
}

// Alert segment config
export const ALERT_SEGMENTS: Record<AlertSegment, number> = {
  immediate: 30, // 30 minutes
  standard: 120, // 2 hours
  relaxed: 1440, // 24 hours (next business day)
};

// Danger words list
export const DANGER_WORDS = [
  '食中毒', '警察', '訴える', '弁護士', '薬', '副作用', 
  '返金', '炎上', '個人情報', '訴訟', 'クレーム', '詐欺',
  '被害', '通報', '騙された', '最悪', '二度と行かない'
];
