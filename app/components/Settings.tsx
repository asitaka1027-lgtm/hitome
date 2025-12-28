'use client';

import { useState, useEffect } from 'react';
import { StoreSettings, AlertSegment, DANGER_WORDS } from '../types';
import { getSettings, saveSettings, clearAllData } from '../lib/storage';
import Toast from '../components/Toast';

interface SettingsProps {
  onBack: () => void;
  onReset: () => void;
}

export default function Settings({ onBack, onReset }: SettingsProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loaded = getSettings();
    setSettings(loaded);
  }, []);

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setToast({ message: '設定を保存しました', type: 'success' });
  };

  const handleReset = () => {
    if (confirm('すべてのデータを削除してリセットしますか？この操作は取り消せません。')) {
      clearAllData();
      setToast({ message: 'データをリセットしました', type: 'success' });
      setTimeout(() => {
        onReset();
      }, 1000);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-muted-gray">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pb-8">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10">
        <div className="container-mobile py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-navy active:bg-gray-200"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-navy">設定</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-mobile pt-6 space-y-6">
        {/* Store Info */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">店舗情報</h2>
          
          <div>
            <label className="block text-sm font-medium text-navy mb-2">店舗名</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">営業時間</label>
            <div className="flex gap-3 items-center">
              <input
                type="time"
                value={settings.businessHours.start}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, start: e.target.value },
                  })
                }
                className="input-field"
              />
              <span className="text-muted-gray">〜</span>
              <input
                type="time"
                value={settings.businessHours.end}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, end: e.target.value },
                  })
                }
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Tone */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">返信の口調</h2>
          <div className="space-y-2">
            {[
              { value: 'polite', label: '丁寧' },
              { value: 'standard', label: '標準' },
              { value: 'casual', label: 'カジュアル' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, tone: option.value as any })}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  settings.tone === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-navy'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">業種テンプレート</h2>
          <div className="space-y-2">
            {[
              { value: 'salon', label: '美容・サロン' },
              { value: 'restaurant', label: '飲食店' },
              { value: 'medical', label: '自費診療系' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, industry: option.value as any })}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  settings.industry === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-navy'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Segment */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">アラート基準</h2>
          <div className="space-y-2">
            {[
              { value: 'immediate', label: '即時（30分）' },
              { value: 'standard', label: '標準（2時間）' },
              { value: 'relaxed', label: 'ゆとり（翌営業日）' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, alertSegment: option.value as AlertSegment })}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  settings.alertSegment === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-navy'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Reply */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">口コミ返信設定</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-navy mb-1">★4〜5 自動返信</div>
              <div className="text-sm text-muted-gray">高評価口コミへの自動返信</div>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, autoReplyHighRating: !settings.autoReplyHighRating })
              }
              className={`w-12 h-7 rounded-full transition-all ${
                settings.autoReplyHighRating ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  settings.autoReplyHighRating ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Danger Words */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">危険ワードリスト</h2>
          <div className="text-sm text-muted-gray mb-3">
            以下のワードを検出すると自動で「要確認」に移動します
          </div>
          <div className="flex flex-wrap gap-2">
            {DANGER_WORDS.map((word) => (
              <span key={word} className="tag bg-red-100 text-red-700">
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Channel Status */}
        <div className="card p-4 space-y-4">
          <h2 className="font-bold text-navy">連携状況</h2>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold">
                L
              </div>
              <div>
                <div className="font-medium text-navy">LINE公式</div>
                <div className="text-xs text-muted-gray">メッセージ受信</div>
              </div>
            </div>
            <div className="text-primary text-sm font-medium">
              {settings.lineConnected ? '✓ 接続済み' : '未接続'}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                G
              </div>
              <div>
                <div className="font-medium text-navy">Googleビジネス</div>
                <div className="text-xs text-muted-gray">口コミ管理</div>
              </div>
            </div>
            <div className="text-primary text-sm font-medium">
              {settings.googleConnected ? '✓ 接続済み' : '未接続'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={handleSave} className="btn-primary w-full">
            設定を保存
          </button>
          <button onClick={handleReset} className="btn-outline w-full text-red-500 border-red-300">
            データをリセット
          </button>
        </div>
      </div>
    </div>
  );
}
