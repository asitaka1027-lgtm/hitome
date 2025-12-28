'use client';

import { useState, useEffect } from 'react';
import { Thread, ThreadStatus, ChannelType, StoreSettings, KPIMetrics } from '../types';
import { getThreads, saveThreads, getSettings, calculateMetrics } from '../lib/storage';
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

  // Load data
  useEffect(() => {
    const loadedSettings = getSettings();
    const loadedThreads = getThreads();
    setSettings(loadedSettings);
    setThreads(loadedThreads);
    
    if (loadedSettings) {
      const calculatedMetrics = calculateMetrics(loadedThreads, loadedSettings);
      setMetrics(calculatedMetrics);
    }
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

  // Simulate new LINE message
  const handleSimulateLINE = () => {
    if (!settings) return;

    const newMessages = [
      { text: '今日の18時に2名で予約できますか？', name: '新規 太郎' },
      { text: '駐車場はありますか？', name: '山田 花子' },
      { text: 'メニューの詳細を教えてください', name: '鈴木 次郎' },
    ];

    const randomMsg = newMessages[Math.floor(Math.random() * newMessages.length)];
    const newThread = generateDemoLINEThread(randomMsg.text, randomMsg.name, settings, 1);

    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    saveThreads(updatedThreads);

    const newMetrics = calculateMetrics(updatedThreads, settings);
    setMetrics(newMetrics);

    setToast({ message: '新しいLINEメッセージを受信しました', type: 'success' });
  };

  // Simulate new Google review
  const handleSimulateGoogle = () => {
    if (!settings) return;

    const newReviews = [
      { rating: 5, comment: '素晴らしいサービスでした！また利用します。', name: '新規 一郎' },
      { rating: 4, comment: '良かったです。次回も期待しています。', name: '佐々木 美咲' },
      { rating: 2, comment: '期待していたほどではありませんでした。', name: '田中 健太' },
    ];

    const randomReview = newReviews[Math.floor(Math.random() * newReviews.length)];
    const newThread = generateDemoGoogleReview(
      randomReview.rating,
      randomReview.comment,
      randomReview.name,
      settings,
      1
    );

    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    saveThreads(updatedThreads);

    const newMetrics = calculateMetrics(updatedThreads, settings);
    setMetrics(newMetrics);

    setToast({ message: '新しいGoogle口コミを受信しました', type: 'success' });
  };

  const handleThreadClick = (thread: Thread) => {
    // Mark as read
    const updatedThreads = threads.map((t) =>
      t.id === thread.id ? { ...t, isRead: true } : t
    );
    setThreads(updatedThreads);
    saveThreads(updatedThreads);
    onThreadSelect(thread);
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
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-muted-gray">該当するメッセージはありません</div>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => handleThreadClick(thread)} />
          ))
        )}
      </div>

      {/* Demo Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light py-3 z-20">
        <div className="container-mobile flex gap-2">
          <button onClick={handleSimulateLINE} className="btn-secondary flex-1 text-sm">
            📱 LINE受信
          </button>
          <button onClick={handleSimulateGoogle} className="btn-secondary flex-1 text-sm">
            ⭐ 口コミ受信
          </button>
        </div>
      </div>
    </div>
  );
}
