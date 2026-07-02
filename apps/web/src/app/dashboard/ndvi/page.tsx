'use client';

import { useEffect, useState } from 'react';
import { Satellite, RefreshCw, Leaf, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import toast from 'react-hot-toast';

interface PlotHealth {
  status: string;
  label: string;
  ndviMean: number | null;
  trend: string | null;
}
interface PlotOverview {
  plotId: string;
  plotName: string;
  farmName: string;
  crop: string;
  areaHa: number;
  health: PlotHealth;
  lastReadingAt: string | null;
}
interface Reading {
  id: string;
  date: string;
  ndviMean: number;
  ndviMin: number;
  ndviMax: number;
}

const STATUS_STYLE: Record<string, string> = {
  EXCELENTE: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  BOM: 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  ATENCAO: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
  CRITICO: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  SEM_DADOS: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
};

function NdviChart({ readings }: { readings: Reading[] }) {
  if (readings.length < 2) return <p className="text-sm text-gray-400">Dados insuficientes para o gráfico.</p>;
  const w = 560;
  const h = 180;
  const pad = 24;
  const xs = (i: number) => pad + (i / (readings.length - 1)) * (w - 2 * pad);
  const ys = (v: number) => h - pad - v * (h - 2 * pad); // NDVI 0..1
  const line = readings.map((r, i) => `${xs(i)},${ys(r.ndviMean)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={ys(g)} y2={ys(g)} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
      ))}
      <polyline points={line} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {readings.map((r, i) => (
        <circle key={r.id} cx={xs(i)} cy={ys(r.ndviMean)} r="3" fill="#059669" />
      ))}
    </svg>
  );
}

export default function NdviPage() {
  const [plots, setPlots] = useState<PlotOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ plot: PlotOverview; readings: Reading[]; source: string } | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get('/ndvi/overview')
      .then((r) => setPlots(r.data.plots))
      .catch(() => toast.error('Não foi possível carregar o monitoramento.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openDetail = async (plot: PlotOverview) => {
    try {
      const r = await api.get(`/ndvi/plots/${plot.plotId}`);
      setDetail({ plot, readings: r.data.readings, source: r.data.source });
    } catch {
      toast.error('Erro ao carregar série NDVI');
    }
  };

  const refresh = async (plotId: string, keepDetail = false) => {
    setRefreshing(plotId);
    try {
      const r = await api.post(`/ndvi/plots/${plotId}/refresh`);
      toast.success('Satélite atualizado');
      if (keepDetail && detail) {
        setDetail({ ...detail, readings: r.data.readings, source: r.data.source });
      }
      load();
    } catch {
      toast.error('Erro ao atualizar satélite');
    } finally {
      setRefreshing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Satellite className="h-6 w-6 text-emerald-600" />
          Monitoramento por Satélite
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Índice de vegetação (NDVI) por talhão — Sentinel-2
        </p>
      </div>

      {plots.length === 0 ? (
        <EmptyState
          icon={Satellite}
          title="Nenhum talhão para monitorar"
          description="Cadastre fazendas e talhões em Gestão de Áreas para acompanhar a saúde da lavoura via satélite."
          actionLabel="Cadastrar áreas"
          onAction={() => { window.location.href = '/dashboard/farms'; }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((p) => (
            <div key={p.plotId} className="card cursor-pointer hover:shadow-md transition" onClick={() => openDetail(p)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <Leaf className="h-4 w-4 text-emerald-500" /> {p.plotName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.farmName} · {p.crop}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.health.status]}`}>
                  {p.health.label}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">NDVI médio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {p.health.ndviMean != null ? p.health.ndviMean.toFixed(2) : '—'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); refresh(p.plotId); }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing === p.plotId ? 'animate-spin' : ''}`} />
                  Satélite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <Modal title={`NDVI — ${detail.plot.plotName}`} onClose={() => setDetail(null)} maxWidth="max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[detail.plot.health.status]}`}>
              {detail.plot.health.label}
            </span>
            <button
              onClick={() => refresh(detail.plot.plotId, true)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing === detail.plot.plotId ? 'animate-spin' : ''}`} />
              Atualizar satélite
            </button>
          </div>
          <NdviChart readings={detail.readings} />
          <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Fonte: {detail.source}
          </p>
        </Modal>
      )}
    </div>
  );
}
