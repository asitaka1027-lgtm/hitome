import { StoreSettings, Thread, KPIMetrics, ALERT_SEGMENTS } from '../types';

// LocalStorage keys
const KEYS = {
  SETTINGS: 'hitome_settings',
  THREADS: 'hitome_threads',
  METRICS: 'hitome_metrics',
  ONBOARDING: 'hitome_onboarding_done',
};

// Get store settings
export const getSettings = (): StoreSettings | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : null;
};

// Save store settings
export const saveSettings = (settings: StoreSettings): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// Get threads
export const getThreads = (): Thread[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.THREADS);
  if (!data) return [];
  const threads = JSON.parse(data);
  // Parse dates
  return threads.map((t: any) => ({
    ...t,
    timestamp: new Date(t.timestamp),
    receivedAt: new Date(t.receivedAt),
    messages: t.messages?.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
    googleReview: t.googleReview ? {
      ...t.googleReview,
      timestamp: new Date(t.googleReview.timestamp),
    } : undefined,
  }));
};

// Save threads
export const saveThreads = (threads: Thread[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.THREADS, JSON.stringify(threads));
};

// Get metrics
export const getMetrics = (): KPIMetrics => {
  if (typeof window === 'undefined') {
    return {
      unhandledCount: 0,
      reviewCount: 0,
      missedThisMonth: 0,
      avgResponseMinutes: 0,
      zeroUnhandledDays: 0,
    };
  }
  const data = localStorage.getItem(KEYS.METRICS);
  return data ? JSON.parse(data) : {
    unhandledCount: 0,
    reviewCount: 0,
    missedThisMonth: 0,
    avgResponseMinutes: 0,
    zeroUnhandledDays: 0,
  };
};

// Save metrics
export const saveMetrics = (metrics: KPIMetrics): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
};

// Calculate KPI from threads
export const calculateMetrics = (threads: Thread[], settings: StoreSettings): KPIMetrics => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const unhandledCount = threads.filter(t => t.status === 'unhandled').length;
  const reviewCount = threads.filter(t => t.status === 'review').length;
  
  // Missed this month (exceeded alert time)
  const alertMinutes = ALERT_SEGMENTS[settings.alertSegment];
  const missedThisMonth = threads.filter(t => {
    if (t.receivedAt < thisMonth) return false;
    const elapsedMinutes = Math.floor((now.getTime() - t.receivedAt.getTime()) / 60000);
    return elapsedMinutes > alertMinutes && t.status === 'unhandled';
  }).length;
  
  // Average response time (completed this month)
  const completedThisMonth = threads.filter(t => 
    t.status === 'completed' && t.receivedAt >= thisMonth
  );
  const avgResponseMinutes = completedThisMonth.length > 0
    ? Math.floor(
        completedThisMonth.reduce((sum, t) => {
          const elapsed = (t.timestamp.getTime() - t.receivedAt.getTime()) / 60000;
          return sum + elapsed;
        }, 0) / completedThisMonth.length
      )
    : 0;
  
  // Zero unhandled days (mock calculation)
  const zeroUnhandledDays = unhandledCount === 0 ? Math.floor(Math.random() * 15) + 1 : 0;
  
  return {
    unhandledCount,
    reviewCount,
    missedThisMonth,
    avgResponseMinutes,
    zeroUnhandledDays,
  };
};

// Check onboarding status
export const isOnboardingDone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.ONBOARDING) === 'true';
};

// Mark onboarding as done
export const setOnboardingDone = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.ONBOARDING, 'true');
};

// Clear all data
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
};
