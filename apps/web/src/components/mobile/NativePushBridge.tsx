'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/lib/auth-context';
import { syncNativePush } from '@/lib/native-push';

function safeDashboardLink(value: unknown): string | null {
  return typeof value === 'string' && /^\/dashboard(?:\/|$|\?)/.test(value) ? value : null;
}

export function NativePushBridge() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;

    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    void syncNativePush(user.id).catch(() => undefined);
    void import('@capacitor/push-notifications').then(async ({ PushNotifications }) => {
      const received = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        if (disposed) return;
        toast(notification.body || notification.title || 'Você recebeu uma nova atualização.', {
          icon: '🔔',
          duration: 6000,
        });
        window.dispatchEvent(new CustomEvent('cc:notification'));
      });
      const action = await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        const link = safeDashboardLink(event.notification.data?.link);
        if (link && !disposed) router.push(link);
      });

      if (disposed) {
        void received.remove();
        void action.remove();
      } else {
        handles.push(received, action);
      }
    }).catch(() => undefined);

    return () => {
      disposed = true;
      handles.forEach((handle) => { void handle.remove(); });
    };
  }, [router, user]);

  return null;
}
