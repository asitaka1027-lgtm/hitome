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
}

export default function Inbox({ onThreadSelect, onSettingsClick }: InboxProps) {
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
    <div className="min-h-screen bg-bg-base pb-20">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-navy">hitome</h1>
            <button
              onClick={onSettingsClick}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted-gray active:bg-gray-200"
            >
              ⚙️
            </button>
          </div>

          {/* KPI Chips */}
          <div className="mb-4">
            <KPIChips metrics={metrics} />
          </div>

          {/* Alert Segment */}
          {settings && (
            <div className="flex items-center justify-center mb-4">
              <SegmentControl
                selected={settings.alertSegment}
                onChange={(segment) => {
                  const updated = { ...settings, alertSegment: segment };
                  setSettings(updated);
                  // Note: This doesn't save immediately, just for demo
                }}
              />
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className="input-field mb-3"
          />

          {/* Filter */}
          <div className="flex gap-2">
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
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border-light sticky top-[280px] z-10">
        <div className="container-mobile flex">
          <button
            onClick={() => setActiveTab('unhandled')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'unhandled'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-gray'
            }`}
          >
            未対応 ({getTabCount('unhandled')})
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'review'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-muted-gray'
            }`}
          >
            要確認 ({getTabCount('review')})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'completed'
                ? 'border-gray-500 text-gray-700'
                : 'border-transparent text-muted-gray'
            }`}
          >
            完了 ({getTabCount('completed')})
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
