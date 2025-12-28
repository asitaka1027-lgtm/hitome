'use client';

import { useState } from 'react';
import { StoreSettings, AlertSegment } from '../types';
import { saveSettings, setOnboardingDone, saveThreads } from '../lib/storage';
import { initializeDemoData } from '../lib/ai-stub';
import Toast from '../components/Toast';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [tone, setTone] = useState<'polite' | 'standard' | 'casual'>('standard');
  const [industry, setIndustry] = useState<'salon' | 'restaurant' | 'medical'>('salon');
  const [lineConnected, setLineConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [autoReplyHighRating, setAutoReplyHighRating] = useState(false);
  const [alertSegment, setAlertSegment] = useState<AlertSegment>('standard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const totalSteps = 6;

  const handleNext = () => {
    if (step === 1 && !storeName.trim()) {
      setToast({ message: '店舗名を入力してください', type: 'error' });
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleLINEConnect = () => {
    setLineConnected(true);
    setToast({ message: 'LINE連携が完了しました', type: 'success' });
  };

  const handleGoogleConnect = () => {
    setGoogleConnected(true);
    setToast({ message: 'Google連携が完了しました', type: 'success' });
  };

  const handleComplete = () => {
    const settings: StoreSettings = {
      storeName: storeName.trim(),
      businessHours: { start: startTime, end: endTime },
      tone,
      industry,
      alertSegment,
      autoReplyHighRating,
      lineConnected,
      googleConnected,
    };

    saveSettings(settings);
    setOnboardingDone();

    // Initialize demo data
    const demoThreads = initializeDemoData(settings);
    saveThreads(demoThreads);

    setToast({ message: 'セットアップ完了！', type: 'success' });
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="container-mobile py-6">
        <h1 className="text-2xl font-bold text-center text-navy mb-2">hitome</h1>
        <p className="text-sm text-muted-gray text-center">初期設定</p>
      </div>

      {/* Progress */}
      <div className="container-mobile mb-8">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-muted-gray text-center mt-2">
          ステップ {step} / {totalSteps}
        </div>
      </div>

      {/* Content */}
      <div className="container-mobile flex-1 pb-8">
        {/* Step 1: Store Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">店舗情報</h2>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">店舗名</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="例：美容室 hitome"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">営業時間</label>
              <div className="flex gap-3 items-center">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                />
                <span className="text-muted-gray">〜</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tone */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">返信の口調</h2>
            <p className="text-sm text-muted-gray">AIが返信案を生成する際の口調を選択してください</p>
            <div className="space-y-3">
              {[
                { value: 'polite', label: '丁寧', desc: 'です・ます調で丁寧に' },
                { value: 'standard', label: '標準', desc: 'ビジネスライクな標準的な口調' },
                { value: 'casual', label: 'カジュアル', desc: 'フレンドリーで親しみやすい' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value as any)}
                  className={`w-full card p-4 text-left transition-all ${
                    tone === option.value ? 'border-2 border-primary' : ''
                  }`}
                >
                  <div className="font-semibold text-navy mb-1">{option.label}</div>
                  <div className="text-sm text-muted-gray">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Industry */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">業種テンプレート</h2>
            <p className="text-sm text-muted-gray">業種に応じたAI設定を適用します</p>
            <div className="space-y-3">
              {[
                { value: 'salon', label: '美容・サロン', desc: 'ヘアサロン、ネイル、エステなど' },
                { value: 'restaurant', label: '飲食店', desc: 'レストラン、カフェ、居酒屋など' },
                { value: 'medical', label: '自費診療系', desc: '美容クリニック、整体、歯科など' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setIndustry(option.value as any)}
                  className={`w-full card p-4 text-left transition-all ${
                    industry === option.value ? 'border-2 border-primary' : ''
                  }`}
                >
                  <div className="font-semibold text-navy mb-1">{option.label}</div>
                  <div className="text-sm text-muted-gray">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Channel Connection */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">チャネル連携</h2>
            <p className="text-sm text-muted-gray">LINEとGoogleを連携してください</p>
            
            {/* LINE */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold">
                    L
                  </div>
                  <div>
                    <div className="font-semibold text-navy">LINE公式</div>
                    <div className="text-xs text-muted-gray">メッセージ受信</div>
                  </div>
                </div>
                {lineConnected && (
                  <div className="text-primary text-sm font-medium">✓ 接続済み</div>
                )}
              </div>
              {!lineConnected && (
                <button onClick={handleLINEConnect} className="btn-primary w-full">
                  LINE連携（承認）
                </button>
              )}
            </div>

            {/* Google */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                    G
                  </div>
                  <div>
                    <div className="font-semibold text-navy">Googleビジネス</div>
                    <div className="text-xs text-muted-gray">口コミ管理</div>
                  </div>
                </div>
                {googleConnected && (
                  <div className="text-primary text-sm font-medium">✓ 接続済み</div>
                )}
              </div>
              {!googleConnected && (
                <button onClick={handleGoogleConnect} className="btn-primary w-full">
                  Google連携（承認）
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review Auto Reply */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">口コミ返信設定</h2>
            <p className="text-sm text-muted-gray">★4〜5の高評価口コミへの自動返信設定</p>
            
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-navy mb-1">★4〜5 自動返信</div>
                  <div className="text-sm text-muted-gray">
                    高評価の口コミに自動で返信案を送信します
                  </div>
                </div>
                <button
                  onClick={() => setAutoReplyHighRating(!autoReplyHighRating)}
                  className={`w-12 h-7 rounded-full transition-all ${
                    autoReplyHighRating ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      autoReplyHighRating ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-sm text-blue-900">
                <div className="font-medium mb-2">💡 ヒント</div>
                <div className="text-xs leading-relaxed">
                  ★1〜3の低評価口コミは自動返信せず、必ず「要確認」に入ります。丁寧な個別対応をお願いします。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Alert Settings */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">アラート基準</h2>
            <p className="text-sm text-muted-gray">未対応時の通知タイミングを設定</p>
            
            <div className="space-y-3">
              {[
                { value: 'immediate', label: '即時（30分）', desc: '最速対応。未対応が30分を超えるとアラート' },
                { value: 'standard', label: '標準（2時間）', desc: 'バランス重視。2時間以内に対応' },
                { value: 'relaxed', label: 'ゆとり（翌営業日）', desc: '翌営業日までに対応すればOK' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAlertSegment(option.value as AlertSegment)}
                  className={`w-full card p-4 text-left transition-all ${
                    alertSegment === option.value ? 'border-2 border-primary' : ''
                  }`}
                >
                  <div className="font-semibold text-navy mb-1">{option.label}</div>
                  <div className="text-sm text-muted-gray">{option.desc}</div>
                </button>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-sm text-green-900">
                <div className="font-medium mb-2">✨ セットアップ完了！</div>
                <div className="text-xs leading-relaxed">
                  すべての設定は後から「設定」画面で変更できます。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="container-mobile pb-8 space-y-3">
        {step < totalSteps && (
          <>
            <button onClick={handleNext} className="btn-primary w-full">
              次へ
            </button>
            {step > 1 && (
              <button onClick={handleBack} className="btn-secondary w-full">
                戻る
              </button>
            )}
          </>
        )}
        {step === totalSteps && (
          <button onClick={handleComplete} className="btn-primary w-full">
            完了してInboxへ
          </button>
        )}
      </div>
    </div>
  );
}
