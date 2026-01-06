'use client';

import { useState, useEffect } from 'react';
import { Thread, ThreadStatus, ChannelType, StoreSettings, KPIMetrics } from '../types';
import { getSettings, calculateMetrics } from '../lib/storage';
import { fetchThreads, startThreadPolling } from '../lib/api-client';
import { generateDemoLINEThread, generateDemoGoogleReview } from '../lib/ai-stub';
import KPIChips from '../components/KPIChips';
import SegmentControl from '../components/SegmentControl';
import ThreadCard from '../components/ThreadCard';
import Toast from '../components/Toast';

interface InboxProps {
  onThreadSelect: (thread: Thread) => void;
  onSettingsClick: () => void;
  currentUser?: {
    name: string;
    stores: Array<{ id: string; name: string; role: string }>;
  } | null;
  onLogout?: () => void;
}

export default function Inbox({ onThreadSelect, onSettingsClick, currentUser, onLogout }: InboxProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [metrics, setMetrics] = useState<KPIMetrics>({
    unhandledCount: 0,
    reviewCount: 0,
    missedThisMonth: 0,
    avgResponseMinutes: 0,
    zeroUnhandledDays: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | ChannelType>('all');
  const [activeTab, setActiveTab] = useState<ThreadStatus>('unhandled');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from D1 database
  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);

    // Fetch threads from D1
    const loadThreads = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedThreads = await fetchThreads();
        setThreads(fetchedThreads);
        
        if (loadedSettings) {
          const calculatedMetrics = calculateMetrics(fetchedThreads, loadedSettings);
          setMetrics(calculatedMetrics);
        }
      } catch (err) {
        console.error('Failed to load threads:', err);
        setError('データの読み込みに失敗しました');
        setToast({ message: 'データの読み込みに失敗しました', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();

    // Start polling for real-time updates (every 10 seconds)
    const stopPolling = startThreadPolling((updatedThreads) => {
      setThreads(updatedThreads);
      if (loadedSettings) {
        const calculatedMetrics = calculateMetrics(updatedThreads, loadedSettings);
        setMetrics(calculatedMetrics);
      }
    }, 10000);

    // Cleanup polling on unmount
    return () => stopPolling();
  }, []);

  // Filter threads
  const filteredThreads = threads.filter((thread) => {
    // Status filter
    if (thread.status !== activeTab) return false;

    // Channel filter
    if (filterChannel !== 'all' && thread.channel !== filterChannel) return false;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        thread.userName.toLowerCase().includes(query) ||
        thread.lastMessage.toLowerCase().includes(query) ||
        thread.aiSummary.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Simulate new LINE message (Demo only - for testing without real LINE)
  const handleSimulateLINE = () => {
    if (!settings) return;

    setToast({ 
      message: 'デモモードは無効です。実際のLINEメッセージをお送りください。', 
      type: 'error' 
    });
    
    // Note: In production, new messages come from LINE Webhook automatically
    // This demo button is disabled when D1 integration is active
  };

  // Simulate new Google review (Demo only - for testing without real Google)
  const handleSimulateGoogle = () => {
    if (!settings) return;

    setToast({ 
      message: 'デモモードは無効です。実際のGoogle口コミをお待ちください。', 
      type: 'error' 
    });
    
    // Note: In production, new reviews come from Google Business Profile API
    // This demo button is disabled when D1 integration is active
  };

  const handleThreadClick = async (thread: Thread) => {
    // Mark as read in local state immediately for responsiveness
    const updatedThreads = threads.map((t) =>
      t.id === thread.id ? { ...t, isRead: true } : t
    );
    setThreads(updatedThreads);
    
    // Navigate to detail
    onThreadSelect({ ...thread, isRead: true });
    
    // TODO: Update isRead status in D1 database
    // This will be implemented when we add the update endpoint
  };

  const getTabCount = (status: ThreadStatus): number => {
    return threads.filter((t) => t.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10 shadow-md">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">hitome</h1>
              {currentUser && currentUser.stores.length > 0 && (
                <p className="text-sm text-white/80 mt-1">{currentUser.stores[0].name}</p>
              )}
            </div>
            <button
              onClick={onSettingsClick}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* KPI Chips */}
          <div className="mb-4">
            <KPIChips metrics={metrics} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container-mobile pt-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 検索..."
          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mb-3"
        />

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterChannel('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filterChannel === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-muted-gray'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilterChannel('LINE')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filterChannel === 'LINE'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-muted-gray'
            }`}
          >
            LINE
          </button>
          <button
            onClick={() => setFilterChannel('GOOGLE')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filterChannel === 'GOOGLE'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-muted-gray'
            }`}
          >
            口コミ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-[340px] z-10 shadow-sm">
        <div className="container-mobile flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('unhandled')}
            className={`flex-1 py-4 text-sm font-bold transition-all relative ${
              activeTab === 'unhandled'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            要対応
            {activeTab === 'unhandled' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-4 text-sm font-bold transition-all relative ${
              activeTab === 'completed'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            完了済み
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="container-mobile pt-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <div className="text-muted-gray">読み込み中...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              再読み込み
            </button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-muted-gray">該当するメッセージはありません</div>
            <div className="text-sm text-muted-gray mt-2">
              LINEでメッセージを送信すると、ここに表示されます
            </div>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => handleThreadClick(thread)} />
          ))
        )}
      </div>

      {/* Demo Buttons - Disabled in production */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light py-3 z-20">
        <div className="container-mobile">
          <div className="text-xs text-center text-muted-gray mb-2">
            💡 実際のLINEメッセージを送信してテストしてください
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSimulateLINE} 
              className="btn-secondary flex-1 text-sm opacity-50 cursor-not-allowed"
              disabled
            >
              📱 LINE受信（無効）
            </button>
            <button 
              onClick={handleSimulateGoogle} 
              className="btn-secondary flex-1 text-sm opacity-50 cursor-not-allowed"
              disabled
            >
              ⭐ 口コミ受信（無効）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
