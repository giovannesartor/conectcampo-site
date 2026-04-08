'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ExternalLink, RefreshCw, Unlink, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: string;
  scopes?: string[];
  tokenExpired?: boolean;
}

interface Valuation {
  id: string;
  company_name?: string;
  valuation_result?: number;
  created_at?: string;
  [key: string]: unknown;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ValuationPage() {
  const router = useRouter();

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // ── Busca o status de conexão ao montar ─────────────────────────────────────
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const { data } = await api.get<ConnectionStatus>('/quantovale/status');
      setStatus(data);
      if (data.connected) fetchValuations();
    } catch {
      toast.error('Erro ao verificar conexão com o QuantoVale.');
    } finally {
      setLoadingStatus(false);
    }
  }

  async function fetchValuations() {
    setLoadingValuations(true);
    try {
      const { data } = await api.get<{ items: Valuation[] }>('/quantovale/valuations');
      setValuations(data.items ?? []);
    } catch {
      toast.error('Erro ao buscar valuations. Tente reconectar.');
    } finally {
      setLoadingValuations(false);
    }
  }

  // ── Inicia o fluxo OAuth2 ────────────────────────────────────────────────────
  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>('/quantovale/connect');
      window.location.href = data.url;
    } catch {
      toast.error('Não foi possível iniciar a conexão. Tente novamente.');
    }
  }

  // ── Desconecta ───────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!confirm('Deseja desconectar sua conta QuantoVale?')) return;
    setDisconnecting(true);
    try {
      await api.delete('/quantovale/disconnect');
      toast.success('Conta QuantoVale desconectada.');
      setStatus({ connected: false });
      setValuations([]);
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setDisconnecting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Valuations — QuantoVale
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Valuation empresarial integrado ao QuantoVale
          </p>
        </div>
        {status?.connected && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchValuations}
              disabled={loadingValuations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-dark-border px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingValuations ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" />
              Desconectar
            </button>
          </div>
        )}
      </div>

      {/* Não conectado */}
      {!status?.connected && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <Zap className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conecte sua conta QuantoVale
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Integre o QuantoVale ao ConectCampo para visualizar, criar e gerenciar valuations
            empresariais diretamente aqui.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Zap className="h-4 w-4" />
            Conectar ao QuantoVale
          </button>
        </div>
      )}

      {/* Token expirado — aviso */}
      {status?.connected && status.tokenExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Sessão expirada
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Seu token do QuantoVale expirou. Reconecte para continuar.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Conectado — info */}
      {status?.connected && !status.tokenExpired && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            QuantoVale conectado
          </p>
          {status.connectedAt && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
              Desde {new Date(status.connectedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )}

      {/* Lista de valuations */}
      {status?.connected && (
        <>
          {loadingValuations ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : valuations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 p-10 text-center space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nenhum valuation encontrado
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Crie seu primeiro valuation no QuantoVale e ele aparecerá aqui.
              </p>
              <a
                href="https://quantovale.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
              >
                Ir ao QuantoVale <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Empresa</th>
                    <th className="px-5 py-3 text-right">Valuation</th>
                    <th className="px-5 py-3 text-right">Data</th>
                    <th className="px-5 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {valuations.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                        {v.company_name ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                        {v.valuation_result
                          ? formatCurrency(v.valuation_result)
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500 dark:text-gray-400">
                        {v.created_at
                          ? new Date(v.created_at).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <a
                          href={`https://quantovale.com.br/app/valuations/${v.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Ver <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
