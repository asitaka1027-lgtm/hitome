'use client';

import { AlertSegment, ALERT_SEGMENTS } from '../types';

interface SegmentControlProps {
  selected: AlertSegment;
  onChange: (segment: AlertSegment) => void;
}

export default function SegmentControl({ selected, onChange }: SegmentControlProps) {
  const segments: { value: AlertSegment; label: string }[] = [
    { value: 'immediate', label: '30分' },
    { value: 'standard', label: '2時間' },
    { value: 'relaxed', label: '翌営業日' },
  ];

  return (
    <div className="bg-white rounded-xl p-1 shadow-subtle border border-border-light inline-flex">
      {segments.map((segment) => (
        <button
          key={segment.value}
          onClick={() => onChange(segment.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === segment.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-gray hover:text-navy'
          }`}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
