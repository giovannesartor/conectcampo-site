'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from 'react-hot-toast';
import { NativeDeepLinkHandler } from '@/components/mobile/NativeDeepLinkHandler';
import { NativeAppBridge } from '@/components/mobile/NativeAppBridge';
import { NativeBiometricGate } from '@/components/mobile/NativeBiometricGate';
import { NativePushBridge } from '@/components/mobile/NativePushBridge';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NativeAppBridge />
        <NativeDeepLinkHandler />
        <NativeBiometricGate />
        <NativePushBridge />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
            success: { iconTheme: { primary: '#008c3c', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
