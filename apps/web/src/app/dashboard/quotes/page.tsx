'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Bell, Trash2, Sprout } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Modal } from '@/components/dashboard/Modal';
import toast from 'react-hot-toast';

interface Quote {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  changePct: number;
  history: number[];
  source: string;
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={up ? '#059669' : '#dc2626'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [production, setProduction] = useState<{ totalValue: number; items: any[] } | null>(null);
  const [alertFor, setAlertFor] = useState<Quote | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/quotes'), api.get('/quotes/alerts'), api.get('/quotes/production-value')])
      .then(([q, a, p]) => {
        setQuotes(q.data.quotes);
        setUpdatedAt(q.data.updatedAt);
        setAlerts(a.data);
        setProduction(p.data);
      })
      .catch(() => toast.error('Não foi possível carregar as cotações.'))
      .finally(() => setLoading(false));
  };

  const removeAlert = async (id: string) => {
    try { await api.delete(`/quotes/alerts/${id}`); load(); } catch { toast.error('Erro'); }
  };

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            Cotações & Preços
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Commodities agrícolas e dólar — referência CEPEA/B3
          </p>
        </div>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && quotes.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quotes.map((q) => {
              const up = q.changePct >= 0;
              return (
                <div key={q.symbol} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{q.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{q.unit}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        up
                          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
                      }`}
                    >
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {up ? '+' : ''}
                      {q.changePct}%
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {q.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <Sparkline data={q.history} up={up} />
                    <button onClick={() => setAlertFor(q)} className="text-gray-400 hover:text-brand-600" title="Criar alerta de preço">
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {updatedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
              Atualizado em {new Date(updatedAt).toLocaleString('pt-BR')} · valores de referência
            </p>
          )}

          {production && production.items.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-600" /> Valor estimado da sua produção
              </h2>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(production.totalValue)}</p>
              <div className="mt-3 space-y-1">
                {production.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{it.plot} · {it.crop} · {it.estProduction.toLocaleString('pt-BR')} un</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(it.value)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">Baseado na produtividade estimada dos talhões × preço de mercado.</p>
            </div>
          )}

          {alerts.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> Meus alertas de preço
              </h2>
              <div className="mt-3 space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className={a.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}>
                      {a.symbol} {a.direction === 'ABOVE' ? '≥' : '≤'} {Number(a.target).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {!a.active && ' · disparado'}
                    </span>
                    <button onClick={() => removeAlert(a.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {alertFor && <AlertModal quote={alertFor} onClose={() => setAlertFor(null)} onSaved={() => { setAlertFor(null); load(); }} />}
    </div>
  );
}

function AlertModal({ quote, onClose, onSaved }: { quote: Quote; onClose: () => void; onSaved: () => void }) {
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [target, setTarget] = useState(String(quote.price.toFixed(2)));
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number(target)) { toast.error('Informe o preço-alvo.'); return; }
    setSaving(true);
    try {
      await api.post('/quotes/alerts', { symbol: quote.symbol, direction, target: Number(target) });
      toast.success('Alerta criado'); onSaved();
    } catch { toast.error('Erro ao criar alerta'); setSaving(false); }
  };
  return (
    <Modal title={`Alerta de preço — ${quote.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Preço atual: <strong>{quote.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({quote.unit})</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quando o preço ficar</label>
            <select className="input" value={direction} onChange={(e) => setDirection(e.target.value as any)}>
              <option value="ABOVE">Acima de (≥)</option>
              <option value="BELOW">Abaixo de (≤)</option>
            </select>
          </div>
          <div>
            <label className="label">Preço-alvo</label>
            <input type="number" step="0.01" className="input" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Criar alerta'}</button>
      </form>
    </Modal>
  );
}
