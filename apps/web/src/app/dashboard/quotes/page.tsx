'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
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

  const load = () => {
    setLoading(true);
    api
      .get('/quotes')
      .then((r) => {
        setQuotes(r.data.quotes);
        setUpdatedAt(r.data.updatedAt);
      })
      .catch(() => toast.error('Não foi possível carregar as cotações.'))
      .finally(() => setLoading(false));
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
                  <div className="mt-2">
                    <Sparkline data={q.history} up={up} />
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
        </>
      )}
    </div>
  );
}
