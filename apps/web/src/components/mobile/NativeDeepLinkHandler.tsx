'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ALLOWED_HOSTS = new Set([
  'app.conectcampo.digital',
  'conectcampo.digital',
  'www.conectcampo.digital',
]);

function routeFromUniversalLink(value: string): string | null {
  try {
    const target = new URL(value);
    let route: string;
    if (target.protocol === 'https:' && ALLOWED_HOSTS.has(target.hostname)) {
      route = `${target.pathname}${target.search}${target.hash}`;
    } else if (target.protocol === 'conectcampo:') {
      const customPath = target.hostname
        ? `/${target.hostname}${target.pathname}`
        : target.pathname;
      route = `${customPath}${target.search}${target.hash}`;
    } else {
      return null;
    }
    if (!route.startsWith('/') || route.startsWith('//')) return null;
    return route === '/' ? '/dashboard' : route;
  } catch {
    return null;
  }
}

export function NativeDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if ((window as any).Capacitor?.isNativePlatform?.() !== true) return;

    let disposed = false;
    let removeListener: (() => void) | undefined;

    const open = (url: string) => {
      const route = routeFromUniversalLink(url);
      if (route && !disposed) router.push(route);
    };

    import('@capacitor/app').then(({ App }) => {
      if (disposed) return;

      void App.getLaunchUrl().then((launch) => {
        if (launch?.url) open(launch.url);
      });

      void App.addListener('appUrlOpen', ({ url }) => open(url)).then((handle) => {
        if (disposed) void handle.remove();
        else removeListener = () => { void handle.remove(); };
      });
    });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [router]);

  return null;
}
