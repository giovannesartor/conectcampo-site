'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Spinner, PageHeader } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

interface PlotRisk {
  plotId: string; plotName: string; farmName: string; crop: string; state: string;
  riskScore: number; riskLevel: string; factors: string[];
}
interface Assessment {
  overallScore: number; overallLevel: string; plotsAssessed: number; plots: PlotRisk[];
}

const LEVEL_STYLE: Record<string, string> = {
  BAIXO: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  MODERADO: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  ALTO: 'text-orange-700 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  CRITICO: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800',
};

function Gauge({ score, level }: { score: number; level: string }) {
  const color = level === 'BAIXO' ? '#059669' : level === 'MODERADO' ? '#d97706' : level === 'ALTO' ? '#ea580c' : '#dc2626';
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}</span>
        <span className="text-[10px] uppercase text-gray-400">risco</span>
      </div>
    </div>
  );
}

export default function ClimateScorePage() {
  const [data, setData] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/climate-score')
      .then((r) => setData(r.data))
      .catch(() => toast.error('Não foi possível calcular o risco climático.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Score Climático / Risco de Safra" subtitle="Risco de produção por talhão (clima + NDVI)" icon={<ShieldAlert className="h-6 w-6 text-brand-600" />} />

      {!data || data.plotsAssessed === 0 ? (
        <EmptyState icon={ShieldAlert} title="Sem talhões para avaliar" description="Cadastre fazendas e talhões (e atualize o NDVI) para calcular o risco de safra." />
      ) : (
        <>
          <div className={`card flex items-center gap-6 border ${LEVEL_STYLE[data.overallLevel]}`}>
            <Gauge score={data.overallScore} level={data.overallLevel} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Risco geral da operação</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overallLevel}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data.plotsAssessed} talhão(ões) avaliado(s)</p>
            </div>
            <button onClick={load} className="btn-secondary text-sm ml-auto flex items-center gap-2 self-start">
              <RefreshCw className="h-4 w-4" /> Recalcular
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.plots.map((p) => (
              <div key={p.plotId} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{p.plotName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.farmName} · {p.crop} · {p.state}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLE[p.riskLevel]}`}>{p.riskLevel} · {p.riskScore}</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {p.factors.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      {f.toLowerCase().includes('saud') ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" /> : <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
