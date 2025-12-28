'use client';

import { Thread, ThreadTag } from '../types';

interface ThreadCardProps {
  thread: Thread;
  onClick: () => void;
}

export default function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const getChannelIcon = () => {
    if (thread.channel === 'LINE') {
      return (
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          L
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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

  const getTagColor = (tag: ThreadTag): string => {
    switch (tag) {
      case 'danger':
        return 'bg-red-100 text-red-700';
      case 'low_rating':
        return 'bg-orange-100 text-orange-700';
      case 'complaint':
        return 'bg-red-100 text-red-700';
      case 'reservation':
        return 'bg-blue-100 text-blue-700';
      case 'question':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTagLabel = (tag: ThreadTag): string => {
    const labels: Record<ThreadTag, string> = {
      reservation: '予約',
      question: '質問',
      low_rating: '低評価',
      danger: '危険',
      location: '場所',
      hours: '営業時間',
      complaint: 'クレーム',
      menu: 'メニュー',
      parking: '駐車場',
    };
    return labels[tag];
  };

  return (
    <button
      onClick={onClick}
      className={`card w-full p-4 mb-3 text-left transition-all active:scale-[0.98] ${
        !thread.isRead && thread.status === 'unhandled' ? 'border-l-4 border-l-primary' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Channel icon */}
        <div className="flex-shrink-0">{getChannelIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and time */}
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-navy truncate">{thread.userName}</div>
            <div className="text-xs text-muted-gray ml-2 flex-shrink-0">{getElapsedTime()}</div>
          </div>

          {/* AI summary */}
          <div className="text-sm text-muted-gray mb-2 line-clamp-1">{thread.aiSummary}</div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {thread.tags.map((tag) => (
              <span key={tag} className={`tag ${getTagColor(tag)}`}>
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
