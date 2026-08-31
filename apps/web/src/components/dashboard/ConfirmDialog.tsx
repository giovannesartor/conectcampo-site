'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  details?: Array<{ label: string; value: string }>;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  reason?: string;
}

type ConfirmRequest = ConfirmDialogOptions & {
  resolve: (result: ConfirmDialogResult) => void;
};

const ConfirmDialogContext = createContext<((options: ConfirmDialogOptions) => Promise<ConfirmDialogResult>) | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [reason, setReason] = useState('');
  const activeRequest = useRef<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions) => new Promise<ConfirmDialogResult>((resolve) => {
    const next = { ...options, resolve };
    activeRequest.current?.resolve({ confirmed: false });
    activeRequest.current = next;
    setReason('');
    setRequest(next);
  }), []);

  const close = useCallback((result: ConfirmDialogResult) => {
    const current = activeRequest.current;
    activeRequest.current = null;
    setRequest(null);
    setReason('');
    current?.resolve(result);
  }, []);

  const tone = request?.tone ?? 'danger';
  const canConfirm = !request?.requireReason || reason.trim().length >= 3;
  const toneClass = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : tone === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
      : 'bg-brand-700 hover:bg-brand-800 focus:ring-brand-500';
  const Icon = tone === 'danger' ? ShieldAlert : tone === 'warning' ? AlertTriangle : CheckCircle2;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} onClose={() => close({ confirmed: false })}>
          <div className="space-y-5">
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${tone === 'danger' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20' : tone === 'warning' ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20' : 'border-brand-200 bg-brand-50 dark:border-brand-900/50 dark:bg-brand-950/20'}`}>
              <Icon className={`mt-0.5 h-5 w-5 flex-none ${tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-brand-700'}`} />
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">{request.description}</p>
            </div>

            {request.details && request.details.length > 0 && (
              <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
                {request.details.map((detail) => (
                  <div key={detail.label} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <dt className="text-gray-500">{detail.label}</dt>
                    <dd className="text-right font-semibold text-gray-900 dark:text-white">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {request.requireReason && (
              <div>
                <label htmlFor="confirm-reason" className="label">{request.reasonLabel ?? 'Justificativa'}</label>
                <textarea
                  id="confirm-reason"
                  data-autofocus="true"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="input min-h-[100px]"
                  placeholder={request.reasonPlaceholder ?? 'Descreva o motivo desta decisão...'}
                />
                <p className="mt-1 text-xs text-gray-500">A justificativa será vinculada à ação e deve ter pelo menos 3 caracteres.</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => close({ confirmed: false })} className="btn-secondary">
                {request.cancelLabel ?? 'Voltar'}
              </button>
              <button
                type="button"
                data-autofocus={!request.requireReason ? 'true' : undefined}
                disabled={!canConfirm}
                onClick={() => close({ confirmed: true, reason: reason.trim() || undefined })}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
              >
                {request.confirmLabel ?? 'Confirmar ação'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error('useConfirmDialog deve ser usado dentro de ConfirmDialogProvider');
  return context;
}
