'use client';

import { useState } from 'react';
import { Thread } from '../types';
import { getThreads, saveThreads, getSettings } from '../lib/storage';
import Toast from '../components/Toast';

interface DetailProps {
  thread: Thread;
  onBack: () => void;
  onUpdate: () => void;
}

export default function Detail({ thread, onBack, onUpdate }: DetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(thread.aiResponse);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getChannelIcon = () => {
    if (thread.channel === 'LINE') {
      return (
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
          L
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          G
        </div>
      );
    }
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - thread.timestamp.getTime()) / 60000);
    
    if (elapsed < 60) return `${elapsed}分前`;
    if (elapsed < 1440) return `${Math.floor(elapsed / 60)}時間前`;
    return `${Math.floor(elapsed / 1440)}日前`;
  };

  const handleSend = () => {
    // Update thread to completed
    const threads = getThreads();
    const updatedThreads = threads.map((t) =>
      t.id === thread.id ? { ...t, status: 'completed' as const, timestamp: new Date() } : t
    );
    saveThreads(updatedThreads);

    setToast({ message: '送信しました！', type: 'success' });
    setTimeout(() => {
      onUpdate();
      onBack();
    }, 1000);
  };

  const handleEditAndSend = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const threads = getThreads();
    const updatedThreads = threads.map((t) =>
      t.id === thread.id
        ? { ...t, aiResponse: editedResponse, status: 'completed' as const, timestamp: new Date() }
        : t
    );
    saveThreads(updatedThreads);

    setToast({ message: '送信しました！', type: 'success' });
    setTimeout(() => {
      onUpdate();
      onBack();
    }, 1000);
  };

  const handleMoveToReview = () => {
    const threads = getThreads();
    const updatedThreads = threads.map((t) =>
      t.id === thread.id ? { ...t, status: 'review' as const } : t
    );
    saveThreads(updatedThreads);

    setToast({ message: '要確認に移動しました', type: 'success' });
    setTimeout(() => {
      onUpdate();
      onBack();
    }, 1000);
  };

  const renderGoogleStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10">
        <div className="container-mobile py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-navy active:bg-gray-200"
            >
              ←
            </button>
            {getChannelIcon()}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy truncate">{thread.userName}</div>
              <div className="text-xs text-muted-gray">{getElapsedTime()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-mobile flex-1 py-4 space-y-4">
        {/* Message/Review Content */}
        {thread.channel === 'LINE' && thread.messages && (
          <div className="space-y-3">
            {thread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'user'
                      ? 'bg-white shadow-card'
                      : 'bg-primary text-white'
                  }`}
                >
                  <div className="text-sm leading-relaxed">{msg.content}</div>
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-muted-gray' : 'text-white/70'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {thread.channel === 'GOOGLE' && thread.googleReview && (
          <div className="card p-4">
            <div className="mb-3">{renderGoogleStars(thread.googleReview.rating)}</div>
            <div className="text-sm text-navy leading-relaxed mb-3">
              {thread.googleReview.comment}
            </div>
            <div className="text-xs text-muted-gray">
              {new Date(thread.googleReview.timestamp).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        )}

        {/* AI Box */}
        <div className="bg-bg-accent rounded-2xl p-4 space-y-3 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-bold text-primary">🤖 AI分析</div>
          </div>

          {/* Summary */}
          <div>
            <div className="text-xs font-medium text-muted-gray mb-1">要約</div>
            <div className="text-sm text-navy leading-relaxed">{thread.aiSummary}</div>
          </div>

          {/* Intent */}
          <div>
            <div className="text-xs font-medium text-muted-gray mb-1">意図</div>
            <div className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium text-navy">
              {thread.aiIntent}
            </div>
          </div>

          {/* AI Response */}
          <div>
            <div className="text-xs font-medium text-muted-gray mb-1">返信案</div>
            {!isEditing ? (
              <div className="text-sm text-navy leading-relaxed bg-white rounded-xl p-3">
                {thread.aiResponse}
              </div>
            ) : (
              <textarea
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                rows={6}
                className="w-full bg-white border border-border-light rounded-xl px-4 py-3 text-sm text-navy resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30"
              />
            )}
          </div>

          {thread.hasDangerWord && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-xs font-medium text-red-700">⚠️ 危険ワード検出</div>
              <div className="text-xs text-red-600 mt-1">
                慎重な対応が必要です。自動返信は停止しています。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border-t border-border-light py-4 sticky bottom-0">
        <div className="container-mobile space-y-2">
          {!isEditing ? (
            <>
              <button onClick={handleSend} className="btn-primary w-full">
                送信
              </button>
              <div className="flex gap-2">
                <button onClick={handleEditAndSend} className="btn-secondary flex-1">
                  編集して送信
                </button>
                <button onClick={handleMoveToReview} className="btn-outline flex-1">
                  要確認へ
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={handleSaveEdit} className="btn-primary w-full">
                保存して送信
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary w-full">
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
