'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const PUSH_PERMISSION_KEY = 'futebol-push-permission';
const PUSH_SUBSCRIBED_KEY = 'futebol-push-subscribed';

export default function PushManager() {
  const { user } = useAuthStore();
  const [pushStatus, setPushStatus] = useState<'checking' | 'unavailable' | 'granted' | 'denied' | 'default'>('checking');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if push is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unavailable');
      return;
    }

    // Check if we already asked and got denied
    const savedPermission = localStorage.getItem(PUSH_PERMISSION_KEY);
    if (savedPermission === 'denied') {
      setPushStatus('denied');
      return;
    }
    if (savedPermission === 'granted') {
      setPushStatus('granted');
      // Re-register if service worker was updated
      registerAndSubscribe();
      return;
    }

    // Check current notification permission
    if (Notification.permission === 'granted') {
      setPushStatus('granted');
      registerAndSubscribe();
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied');
      localStorage.setItem(PUSH_PERMISSION_KEY, 'denied');
    } else {
      setPushStatus('default');
      // Auto-request if user has notifications enabled
      if (user.notificationsEnabled) {
        requestPermission();
      }
    }
  }, [user]);

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      return null;
    }
  };

  const registerAndSubscribe = async () => {
    const registration = await registerServiceWorker();
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Send subscription to server (in case it's new or updated)
        await sendSubscriptionToServer(subscription);
        localStorage.setItem(PUSH_SUBSCRIBED_KEY, 'true');
      }
    } catch {
      // Ignore
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (response.ok) {
        localStorage.setItem(PUSH_SUBSCRIBED_KEY, 'true');
      }
    } catch (error) {
      console.error('Failed to send subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setPushStatus('granted');
      await registerAndSubscribe();
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('denied');
      localStorage.setItem(PUSH_PERMISSION_KEY, 'denied');
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(PUSH_PERMISSION_KEY, permission);

      if (permission === 'granted') {
        setPushStatus('granted');
        await registerAndSubscribe();
      } else if (permission === 'denied') {
        setPushStatus('denied');
      } else {
        setPushStatus('default');
      }
    } catch {
      // User dismissed the prompt
    } finally {
      setSubscribing(false);
    }
  };

  // Don't render anything visible - just handle push in background
  // But we can render a small status indicator if needed
  return null;
}
