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
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
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

  const create = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/api-keys', { name });
      setNewSecret(data.secret);
      setName('');
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
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">Nome da chave</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Integração ERP"
            className="input"
          />
        </div>
        <button onClick={create} disabled={creating || !name.trim()} className="btn-primary disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
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
                <p className="text-[11px] text-gray-400">
                  Criada em {formatDate(k.createdAt)}
                  {k.lastUsedAt ? ` · último uso ${formatDate(k.lastUsedAt)}` : ' · nunca usada'}
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
