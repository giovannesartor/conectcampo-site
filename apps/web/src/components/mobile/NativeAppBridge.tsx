'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

/**
 * Centraliza o comportamento que só existe dentro do app. Os imports
 * dinâmicos mantêm a aplicação web independente das bridges nativas.
 */
export function NativeAppBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform();
    document.documentElement.dataset.nativeApp = platform;

    let disposed = false;
    const cleanups: Array<() => void> = [];

    void import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => {});

    void import('@capacitor/status-bar')
      .then(async ({ StatusBar, Style }) => {
        await StatusBar.setStyle({ style: Style.Light });
        if (platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#003C28' });
        }
      })
      .catch(() => {});

    void import('@capacitor/network')
      .then(async ({ Network }) => {
        let wasOffline = !(await Network.getStatus()).connected;
        if (wasOffline && !disposed) {
          toast.error('Sem conexão. Algumas ações ficarão disponíveis quando a internet voltar.', {
            id: 'native-network-status',
            duration: Infinity,
          });
        }

        const handle = await Network.addListener('networkStatusChange', ({ connected }) => {
          if (disposed || connected === !wasOffline) return;
          wasOffline = !connected;
          if (connected) {
            toast.dismiss('native-network-status');
            toast.success('Conexão restabelecida.', { duration: 2500 });
          } else {
            toast.error('Sem conexão. Verifique sua internet para continuar.', {
              id: 'native-network-status',
              duration: Infinity,
            });
          }
        });

        if (disposed) void handle.remove();
        else cleanups.push(() => { void handle.remove(); });
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      delete document.documentElement.dataset.nativeApp;
    };
  }, []);

  return null;
}
