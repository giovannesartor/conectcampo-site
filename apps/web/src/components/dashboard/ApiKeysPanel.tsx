'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Plus, Copy, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  revokedAt: string | null;
  createdAt: string;
}

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<('read' | 'write')[]>(['read', 'write']);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get<ApiKey[]>('/api-keys');
      setKeys(data);
    } catch {
      toast.error('Erro ao carregar as chaves.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleScope = (s: 'read' | 'write') => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const create = async () => {
    if (scopes.length === 0) {
      toast.error('Selecione ao menos um scope.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/api-keys', {
        name,
        scopes,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });
      setNewSecret(data.secret);
      setName('');
      setExpiresInDays('');
      setScopes(['read', 'write']);
      await load();
    } catch {
      toast.error('Não foi possível criar a chave.');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revogar esta chave? Integrações que a usam deixarão de funcionar.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('Chave revogada.');
      load();
    } catch {
      toast.error('Não foi possível revogar a chave.');
    }
  };

  return (
    <div className="card max-w-2xl space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-600" /> API Keys
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Use chaves de API para integrar seus sistemas à ConectCampo. Envie no header{' '}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">X-API-Key</code>.
        </p>
      </div>

      {/* segredo recém-criado (exibido uma única vez) */}
      {newSecret && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-2">
            <AlertTriangle className="h-4 w-4" /> Copie agora — esta chave não será exibida novamente.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-2 break-all">
              {newSecret}
            </code>
            <button
              onClick={() => { navigator.clipboard?.writeText(newSecret); toast.success('Copiado!'); }}
              className="btn-primary text-xs"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>
          <button onClick={() => setNewSecret(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">
            Já copiei, fechar
          </button>
        </div>
      )}

      {/* criar */}
      <div className="space-y-3">
        <div>
          <label className="label">Nome da chave</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Integração ERP"
            className="input"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Permissões (scopes)</label>
            <div className="flex gap-2">
              {(['read', 'write'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    scopes.includes(s)
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}
                >
                  {s === 'read' ? 'Leitura' : 'Escrita'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Expira em (dias, opcional)</label>
            <input
              type="number"
              min={1}
              max={3650}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="Sem expiração"
              className="input"
            />
          </div>
        </div>
        <button onClick={create} disabled={creating || !name.trim()} className="btn-primary disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar chave
        </button>
      </div>

      {/* lista */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma chave criada ainda.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {k.name}
                  {k.revokedAt ? (
                    <span className="text-xs text-red-500">revogada</span>
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </p>
                <p className="text-xs text-gray-400 font-mono">{k.prefix}…</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {(k.scopes ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                      {s === 'read' ? 'leitura' : 'escrita'}
                    </span>
                  ))}
                  {k.expiresAt && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      new Date(k.expiresAt) < new Date()
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}>
                      {new Date(k.expiresAt) < new Date() ? 'expirada' : `expira ${formatDate(k.expiresAt)}`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Criada em {formatDate(k.createdAt)}
                  {k.lastUsedAt ? ` · último uso ${formatDate(k.lastUsedAt)}` : ' · nunca usada'}
                  {typeof k.requestCount === 'number' ? ` · ${k.requestCount} requisições` : ''}
                </p>
              </div>
              {!k.revokedAt && (
                <button onClick={() => revoke(k.id)} className="text-gray-400 hover:text-red-500 p-2" title="Revogar">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
