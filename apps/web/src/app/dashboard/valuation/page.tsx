'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Unlink,
  Zap,
  Maximize2,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: string;
  tokenExpired?: boolean;
}

const QUANTOVALE_APP_URL = 'https://quantovale.online';

export default function ValuationPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ConnectionStatus>('/quantovale/status');
      setStatus(data);
    } catch {
      toast.error('Erro ao verificar conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>('/quantovale/connect');
      window.location.href = data.url;
    } catch {
      toast.error('Não foi possível iniciar a conexão.');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Deseja desconectar sua conta QuantoVale?')) return;
    setDisconnecting(true);
    try {
      await api.delete('/quantovale/disconnect');
      toast.success('Conta QuantoVale desconectada.');
      setStatus({ connected: false });
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setDisconnecting(false);
    }
  }

  function handleRefresh() {
    setIframeLoading(true);
    setIframeKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Not connected ── */
  if (!status?.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center space-y-5 max-w-md w-full">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <Zap className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Conecte sua conta QuantoVale
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Autorize o ConectCampo a acessar sua conta QuantoVale para gerenciar
              valuations diretamente aqui.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Zap className="h-4 w-4" /> Conectar ao QuantoVale
          </button>
          <a
            href={QUANTOVALE_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            Abrir QuantoVale <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  /* ── Token expired ── */
  if (status.tokenExpired) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-10 text-center space-y-4 max-w-md w-full">
          <p className="text-2xl">{'\u26A0\uFE0F'}</p>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
            Sessão expirada
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Seu acesso ao QuantoVale expirou. Reconecte para continuar.
          </p>
          <button
            onClick={handleConnect}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition"
          >
            <Zap className="h-4 w-4" /> Reconectar
          </button>
        </div>
      </div>
    );
  }

  /* ── Connected: iframe ── */
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            QuantoVale
          </span>
          {status.connectedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              — conectado desde {new Date(status.connectedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Recarregar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${iframeLoading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
          <a
            href={QUANTOVALE_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir em nova aba"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Nova aba
          </a>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            title="Desconectar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50"
          >
            <Unlink className="h-3.5 w-3.5" /> Desconectar
          </button>
        </div>
      </div>

      {/* iframe container */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Carregando QuantoVale...
              </p>
            </div>
          </div>
        )}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={QUANTOVALE_APP_URL}
          title="QuantoVale"
          className="w-full h-full border-0"
          onLoad={() => setIframeLoading(false)}
          allow="clipboard-write; clipboard-read"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
}
