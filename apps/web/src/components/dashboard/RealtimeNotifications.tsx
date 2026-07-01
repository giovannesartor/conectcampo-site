'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

/**
 * Conecta ao stream SSE de notificações e, ao receber uma, mostra um toast
 * e dispara o evento `cc:notification` (o sino ouve para atualizar o badge).
 * O EventSource reconecta sozinho em caso de queda.
 */
export function RealtimeNotifications() {
  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token || typeof window === 'undefined' || !('EventSource' in window)) return;

    const es = new EventSource(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);

    es.addEventListener('notification', (e) => {
      try {
        const n = JSON.parse((e as MessageEvent).data);
        toast(n.title || 'Nova notificação', { duration: 6000 });
        window.dispatchEvent(new CustomEvent('cc:notification', { detail: n }));
      } catch {
        /* ignora payload inválido */
      }
    });

    return () => es.close();
  }, []);

  return null;
}
