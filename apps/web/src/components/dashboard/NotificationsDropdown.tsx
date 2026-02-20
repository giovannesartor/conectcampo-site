'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, FileText, CreditCard, AlertTriangle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'operation';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Proposta recebida',
    message: 'Banco Agro enviou uma proposta para sua operação de CPR Financeira.',
    time: '5 min atrás',
    read: false,
  },
  {
    id: '2',
    type: 'operation',
    title: 'Operação em análise',
    message: 'Sua operação #OP-2024-0312 passou para a fase de scoring.',
    time: '1h atrás',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Documento pendente',
    message: 'Envie a matrícula do imóvel rural para prosseguir com a operação.',
    time: '3h atrás',
    read: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Novo conteúdo no blog',
    message: 'Confira: "CPR verde e ESG: o crédito rural como ferramenta de sustentabilidade".',
    time: '1 dia atrás',
    read: true,
  },
];

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CreditCard className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  operation: <FileText className="h-4 w-4 text-purple-500" />,
};

const typeBg: Record<Notification['type'], string> = {
  info: 'bg-blue-100 dark:bg-blue-900/30',
  success: 'bg-green-100 dark:bg-green-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
  operation: 'bg-purple-100 dark:bg-purple-900/30',
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost relative p-2"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:text-brand-500 flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-dark-border last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-bg ${
                    !n.read ? 'bg-brand-50/50 dark:bg-brand-950/10' : ''
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeBg[n.type]}`}>
                    {typeIcons[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {n.title}
                        {!n.read && (
                          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500" />
                        )}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(n.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-dark-border px-4 py-2">
            <button className="w-full text-center text-xs text-brand-600 hover:text-brand-500 py-1">
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
