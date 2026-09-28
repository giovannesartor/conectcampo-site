'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clearNativeWidgets, setNativeWidgetSession, supportsNativeWidgets, syncNativeWidgets, WIDGET_PREFERENCES_CHANGED } from '@/lib/native-widgets';

/** The main app shares only explicitly enabled, owner-scoped summaries with WidgetKit. */
export function NativeWidgetSync() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !supportsNativeWidgets()) return;
    if (!user) { void clearNativeWidgets().catch(() => undefined); return; }
    let disposed = false;
    let busy = false;
    let lastSync = 0;
    const sync = async (force = false) => {
      if (disposed || document.visibilityState !== 'visible' || busy || (!force && Date.now() - lastSync < 60000)) return;
      busy = true;
      try { if (await syncNativeWidgets(user.id, force)) lastSync = Date.now(); }
      catch { /* Offline: retain the bounded, dated snapshot; never manufacture new data. */ }
      finally { busy = false; }
    };
    void setNativeWidgetSession(user.id).then(() => sync(true)).catch(() => undefined);
    const refresh = () => { void sync(); };
    const preferences = () => { void sync(true); };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(WIDGET_PREFERENCES_CHANGED, preferences);
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(WIDGET_PREFERENCES_CHANGED, preferences);
      window.clearInterval(timer);
    };
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!isLoading && user && supportsNativeWidgets()) void syncNativeWidgets(user.id).catch(() => undefined);
  }, [pathname, user?.id, isLoading]);

  return null;
}
