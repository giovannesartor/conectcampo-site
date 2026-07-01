'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Reporta Core Web Vitals (LCP, CLS, INP, FCP, TTFB) para o backend (RUM).
 * Envio best-effort via sendBeacon; nunca bloqueia a navegação.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: (metric as { rating?: string }).rating,
        id: metric.id,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });
      const url = '/api/v1/metrics/web-vitals';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      }
    } catch {
      /* no-op */
    }
  });

  return null;
}
