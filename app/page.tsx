'use client';

import { useState, useEffect } from 'react';
import { Thread } from './types';
import { isOnboardingDone } from './lib/storage';
import Onboarding from './components/Onboarding';
import Inbox from './components/Inbox';
import Detail from './components/Detail';
import Settings from './components/Settings';

type Screen = 'onboarding' | 'inbox' | 'detail' | 'settings';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if onboarding is done
    const done = isOnboardingDone();
    if (done) {
      setScreen('inbox');
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    setScreen('inbox');
  };

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    setScreen('detail');
  };

  const handleDetailBack = () => {
    setScreen('inbox');
    setSelectedThread(null);
  };

  const handleDetailUpdate = () => {
    // Trigger re-render in Inbox
    // (In real app, use state management)
  };

  const handleSettingsClick = () => {
    setScreen('settings');
  };

  const handleSettingsBack = () => {
    setScreen('inbox');
  };

  const handleSettingsReset = () => {
    setScreen('onboarding');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📬</div>
          <div className="text-xl font-bold text-navy mb-2">hitome</div>
          <div className="text-sm text-muted-gray">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === 'inbox' && (
        <Inbox onThreadSelect={handleThreadSelect} onSettingsClick={handleSettingsClick} />
      )}
      {screen === 'detail' && selectedThread && (
        <Detail thread={selectedThread} onBack={handleDetailBack} onUpdate={handleDetailUpdate} />
      )}
      {screen === 'settings' && (
        <Settings onBack={handleSettingsBack} onReset={handleSettingsReset} />
      )}
    </>
  );
}
