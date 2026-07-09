'use client';

import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  Droplets,
  Thermometer,
  AlertTriangle,
  Sprout,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CROPS = ['SOJA','MILHO','ALGODAO','FEIJAO','TRIGO','CAFE','ARROZ','CANA'];

interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainMm: number;
  humidity: number;
  condition: string;
}
interface WeatherAlert {
  type: string;
  severity: string;
  title: string;
  description: string;
}
interface Forecast {
  state: string;
  current: { temp: number; humidity: number; condition: string };
  forecast: DayForecast[];
  alerts: WeatherAlert[];
  source: string;
}

const CONDITION_ICON: Record<string, React.ReactNode> = {
  ENSOLARADO: <Sun className="h-6 w-6 text-amber-500" />,
  PARCIAL: <CloudSun className="h-6 w-6 text-amber-400" />,
  NUBLADO: <Cloud className="h-6 w-6 text-gray-400" />,
  CHUVA: <CloudRain className="h-6 w-6 text-blue-500" />,
  TEMPESTADE: <CloudLightning className="h-6 w-6 text-indigo-500" />,
};

const SEVERITY_STYLE: Record<string, string> = {
  ALTA: 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800',
  MEDIA: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800',
  BAIXA: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800',
};

export default function WeatherPage() {
  const [state, setState] = useState('SP');
  const [crop, setCrop] = useState('SOJA');
  const [data, setData] = useState<Forecast | null>(null);
  const [planting, setPlanting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/weather/forecast?state=${state}`),
      api.get(`/weather/planting-window?crop=${crop}&state=${state}`),
    ])
      .then(([f, p]) => {
        if (cancelled) return;
        setData(f.data);
        setPlanting(p.data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Não foi possível carregar a previsão do tempo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [state, crop]);

  const weekday = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CloudSun className="h-6 w-6 text-blue-500" />
            Clima & Alertas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Previsão de 7 dias, alertas e janela de plantio
          </p>
        </div>
        <div className="flex gap-2">
          <select value={state} onChange={(e) => setState(e.target.value)} className="input">
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input">
            {CROPS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {data.alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.alerts.map((a, i) => (
                <div key={i} className={`rounded-xl border p-4 flex gap-3 ${SEVERITY_STYLE[a.severity] ?? ''}`}>
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-current" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {CONDITION_ICON[data.current.condition]}
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <Thermometer className="h-5 w-5 text-red-400" /> {data.current.temp}°C
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-blue-400" /> {data.current.humidity}% umidade
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {data.forecast.map((d) => (
                <div key={d.date} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{weekday(d.date)}</p>
                  <div className="my-2 flex justify-center">{CONDITION_ICON[d.condition]}</div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{d.tempMax}°</p>
                  <p className="text-xs text-gray-400">{d.tempMin}°</p>
                  <p className="mt-1 text-xs text-blue-500 flex items-center justify-center gap-0.5">
                    <Droplets className="h-3 w-3" />{d.rainMm}mm
                  </p>
                </div>
              ))}
            </div>
          </div>

          {planting && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-600" />
                Janela de plantio — {planting.crop} ({planting.state})
              </h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  {planting.window.start} → {planting.window.end}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{planting.window.note}</p>
              </div>
              <p className="mt-2 text-xs text-gray-400">Mês atual: {planting.currentMonth}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{data.source}</p>
        </>
      ) : null}
    </div>
  );
}
