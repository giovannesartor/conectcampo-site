'use client';

import { useEffect, useCallback, useId, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current();
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]');
      (preferred ?? closeRef.current)?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/60 bg-white p-5 shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
