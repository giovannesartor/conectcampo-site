'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Plus,
  Trees,
  Layers,
  Ruler,
  X,
  Trash2,
  Sprout,
} from 'lucide-react';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import toast from 'react-hot-toast';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CROPS = ['SOJA','MILHO','CAFE','ALGODAO','CANA','ARROZ','TRIGO','FEIJAO','PECUARIA_CORTE','PECUARIA_LEITE','AVICULTURA','SUINOCULTURA','FRUTICULTURA','SILVICULTURA','OUTRO'];
const PLOT_STATUS = ['PREPARO','PLANTADO','EM_DESENVOLVIMENTO','COLHIDO','POUSIO'];

interface Plot {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  safra: string | null;
  status: string;
}
interface Farm {
  id: string;
  name: string;
  city: string;
  state: string;
  totalAreaHa: number;
  carNumero: string | null;
  plots: Plot[];
  _count?: { plots: number };
}
interface Summary {
  totalFarms: number;
  totalPlots: number;
  totalAreaHa: number;
  cropDistribution: { crop: string; area: number }[];
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFarm, setShowFarm] = useState(false);
  const [plotFarm, setPlotFarm] = useState<Farm | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/farms'), api.get('/farms/summary')])
      .then(([f, s]) => {
        setFarms(f.data);
        setSummary(s.data);
      })
      .catch(() => toast.error('Não foi possível carregar as fazendas.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const removeFarm = async (id: string) => {
    if (!confirm('Remover esta fazenda e seus talhões?')) return;
    try {
      await api.delete(`/farms/${id}`);
      toast.success('Fazenda removida');
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const removePlot = async (id: string) => {
    try {
      await api.delete(`/farms/plots/${id}`);
      toast.success('Talhão removido');
      load();
    } catch {
      toast.error('Erro ao remover talhão');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-emerald-600" />
            Gestão de Áreas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fazendas e talhões — base para carbono, CPR e score
          </p>
        </div>
        <button onClick={() => setShowFarm(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova fazenda
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI icon={<Trees className="h-5 w-5" />} label="Fazendas" value={summary.totalFarms} />
          <KPI icon={<Layers className="h-5 w-5" />} label="Talhões" value={summary.totalPlots} />
          <KPI icon={<Ruler className="h-5 w-5" />} label="Área total" value={`${summary.totalAreaHa.toLocaleString('pt-BR')} ha`} />
        </div>
      )}

      {farms.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhuma fazenda cadastrada"
          description="Cadastre suas propriedades e talhões para habilitar monitoramento, carbono e crédito."
          actionLabel="Cadastrar fazenda"
          onAction={() => setShowFarm(true)}
        />
      ) : (
        <div className="space-y-4">
          {farms.map((farm) => (
            <div key={farm.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{farm.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {farm.city}/{farm.state} · {Number(farm.totalAreaHa).toLocaleString('pt-BR')} ha
                    {farm.carNumero ? ` · CAR ${farm.carNumero}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPlotFarm(farm)} className="btn-secondary text-xs flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Talhão
                  </button>
                  <button onClick={() => removeFarm(farm.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {farm.plots.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {farm.plots.map((plot) => (
                    <div key={plot.id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <Sprout className="h-3.5 w-3.5 text-emerald-500" />
                          {plot.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {plot.crop} · {Number(plot.areaHa).toLocaleString('pt-BR')} ha
                          {plot.safra ? ` · ${plot.safra}` : ''}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] text-gray-600 dark:text-gray-300">
                          {plot.status}
                        </span>
                      </div>
                      <button onClick={() => removePlot(plot.id)} className="text-gray-300 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showFarm && <FarmModal onClose={() => setShowFarm(false)} onSaved={() => { setShowFarm(false); load(); }} />}
      {plotFarm && <PlotModal farm={plotFarm} onClose={() => setPlotFarm(null)} onSaved={() => { setPlotFarm(null); load(); }} />}
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function FarmModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', city: '', state: 'SP', totalAreaHa: '', carNumero: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.totalAreaHa) {
      toast.error('Preencha nome, cidade e área.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/farms', {
        name: form.name,
        city: form.city,
        state: form.state,
        totalAreaHa: Number(form.totalAreaHa),
        carNumero: form.carNumero || undefined,
      });
      toast.success('Fazenda cadastrada');
      onSaved();
    } catch {
      toast.error('Erro ao cadastrar fazenda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Nova fazenda" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área total (ha)</label>
            <input type="number" className="input" value={form.totalAreaHa} onChange={(e) => setForm({ ...form, totalAreaHa: e.target.value })} />
          </div>
          <div>
            <label className="label">CAR (opcional)</label>
            <input className="input" value={form.carNumero} onChange={(e) => setForm({ ...form, carNumero: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>
    </Modal>
  );
}

function PlotModal({ farm, onClose, onSaved }: { farm: Farm; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', crop: 'SOJA', areaHa: '', safra: '', status: 'PLANTADO' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.areaHa) {
      toast.error('Preencha nome e área do talhão.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/farms/${farm.id}/plots`, {
        name: form.name,
        crop: form.crop,
        areaHa: Number(form.areaHa),
        safra: form.safra || undefined,
        status: form.status,
      });
      toast.success('Talhão adicionado');
      onSaved();
    } catch {
      toast.error('Erro ao adicionar talhão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Novo talhão — ${farm.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome do talhão</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cultura</label>
            <select className="input" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Área (ha)</label>
            <input type="number" className="input" value={form.areaHa} onChange={(e) => setForm({ ...form, areaHa: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Safra</label>
            <input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {PLOT_STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Adicionar talhão'}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
