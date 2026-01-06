'use client';

import { useState, useEffect } from 'react';
import { Thread } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Inbox from './components/Inbox';
import Detail from './components/Detail';
import Settings from './components/Settings';

type Screen = 'login' | 'onboarding' | 'inbox' | 'detail' | 'settings';

interface UserData {
  id: string;
  email?: string;
  name: string;
  picture?: string;
  stores: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  currentStoreId?: string;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          
          // Check if user has stores
          if (data.user.stores && data.user.stores.length > 0) {
            setScreen('inbox');
          } else {
            // New user, needs onboarding
            setScreen('onboarding');
          }
        } else {
          setScreen('login');
        }
      } else {
        setScreen('login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setScreen('login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    checkAuthStatus();
  };

  const handleOnboardingComplete = async (storeData: any) => {
    // Create new store via API
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.store) {
          // Refresh auth status to get updated store list
          await checkAuthStatus();
          setScreen('inbox');
        }
      }
    } catch (err) {
      console.error('Failed to create store:', err);
    }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setScreen('login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 mb-4">
            <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">hitome</div>
          <div className="text-sm text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === 'inbox' && (
        <Inbox 
          onThreadSelect={handleThreadSelect} 
          onSettingsClick={handleSettingsClick}
          currentUser={user}
          onLogout={handleLogout}
        />
      )}
      {screen === 'detail' && selectedThread && (
        <Detail thread={selectedThread} onBack={handleDetailBack} onUpdate={handleDetailUpdate} />
      )}
      {screen === 'settings' && (
        <Settings 
          onBack={handleSettingsBack} 
          onReset={handleSettingsReset}
          currentUser={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
