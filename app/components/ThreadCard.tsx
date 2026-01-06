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
        <div className="w-12 h-12 bg-gradient-to-br from-[#00B900] to-[#00A000] rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
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
        return 'bg-red-500 text-white';
      case 'low_rating':
        return 'bg-orange-500 text-white';
      case 'complaint':
        return 'bg-red-500 text-white';
      case 'reservation':
        return 'bg-blue-500 text-white';
      case 'question':
        return 'bg-purple-500 text-white';
      case 'hours':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
      className="w-full bg-white rounded-xl p-4 mb-3 text-left transition-all active:scale-[0.98] shadow-md hover:shadow-lg border border-gray-100"
    >
      {/* Header: Icon, Name, Time, Unread Badge */}
      <div className="flex gap-3 mb-2">
        {/* Channel icon */}
        <div className="flex-shrink-0">{getChannelIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and time */}
          <div className="flex items-start justify-between mb-1">
            <div className="font-bold text-gray-900 text-base truncate pr-2">{thread.userName}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-500">{getElapsedTime()}</div>
              {!thread.isRead && thread.status === 'unhandled' && (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
              )}
            </div>
          </div>

          {/* Last message preview */}
          <div className="text-sm text-gray-700 mb-2 line-clamp-1">
            {thread.lastMessage}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {thread.tags.map((tag) => (
              <span 
                key={tag} 
                className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
              >
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
