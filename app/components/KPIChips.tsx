'use client';

import { KPIMetrics } from '../types';

interface KPIChipsProps {
  metrics: KPIMetrics;
}

export default function KPIChips({ metrics }: KPIChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Unhandled */}
      <div className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-subtle border border-border-light">
        <div className="text-xs text-muted-gray">未対応</div>
        <div className="text-lg font-bold text-navy">{metrics.unhandledCount}</div>
      </div>

      {/* Review */}
      <div className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-subtle border border-border-light">
        <div className="text-xs text-muted-gray">要確認</div>
        <div className="text-lg font-bold text-red-500">{metrics.reviewCount}</div>
      </div>

      {/* Missed this month */}
      <div className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-subtle border border-border-light">
        <div className="text-xs text-muted-gray">見逃し（今月）</div>
        <div className="text-lg font-bold text-orange-500">{metrics.missedThisMonth}</div>
      </div>

      {/* Avg response */}
      <div className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-subtle border border-border-light">
        <div className="text-xs text-muted-gray">平均初動</div>
        <div className="text-lg font-bold text-navy">{metrics.avgResponseMinutes}分</div>
      </div>

      {/* Zero days */}
      <div className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-subtle border border-border-light">
        <div className="text-xs text-muted-gray">未対応ゼロ</div>
        <div className="text-lg font-bold text-primary">{metrics.zeroUnhandledDays}日</div>
      </div>
    </div>
  );
}
