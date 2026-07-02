'use client';

import { useEffect, useState } from 'react';
import { NotebookPen, Trash2, Sprout } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const TYPES = ['PLANTIO','PULVERIZACAO','ADUBACAO','IRRIGACAO','COLHEITA','MANEJO','MONITORAMENTO','OUTRO'];
const TYPE_LABEL: Record<string, string> = {
  PLANTIO: 'Plantio', PULVERIZACAO: 'Pulverização', ADUBACAO: 'Adubação', IRRIGACAO: 'Irrigação',
  COLHEITA: 'Colheita', MANEJO: 'Manejo', MONITORAMENTO: 'Monitoramento', OUTRO: 'Outro',
};

interface Entry {
  id: string; type: string; title: string; description: string | null; date: string;
  inputName: string | null; inputQuantity: number | null; inputUnit: string | null; cost: number | null;
  farm: { id: string; name: string } | null; plot: { id: string; name: string } | null;
}
interface Farm { id: string; name: string; plots: { id: string; name: string }[]; }
interface Summary { totalEntries: number; totalCost: number; byType: Record<string, number>; }

export default function FieldJournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/field-journal'), api.get('/field-journal/summary'), api.get('/farms')])
      .then(([e, s, f]) => { setEntries(e.data); setSummary(s.data); setFarms(f.data); })
      .catch(() => toast.error('Não foi possível carregar o diário.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => { try { await api.delete(`/field-journal/${id}`); load(); } catch { toast.error('Erro'); } };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Diário de Safra" subtitle="Caderno de campo: plantio, insumos e colheita" icon={<NotebookPen className="h-6 w-6 text-brand-600" />} onAdd={() => farms.length ? setShow(true) : toast.error('Cadastre uma fazenda primeiro.')} addLabel="Novo registro" />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Registros" value={summary.totalEntries} />
          <StatCard label="Custo acumulado" value={formatCurrency(summary.totalCost)} />
          <StatCard label="Atividades distintas" value={Object.keys(summary.byType).length} />
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Nenhum registro no caderno" description="Registre atividades de campo para rastreabilidade e ESG." actionLabel="Novo registro" onAction={() => farms.length ? setShow(true) : toast.error('Cadastre uma fazenda primeiro.')} />
      ) : (
        <div className="space-y-3">
          {entries.map((en) => (
            <div key={en.id} className="card flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                  <Sprout className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{en.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {TYPE_LABEL[en.type]} · {formatDate(en.date)}
                    {en.farm ? ` · ${en.farm.name}` : ''}{en.plot ? ` / ${en.plot.name}` : ''}
                  </p>
                  {en.inputName && <p className="text-xs text-gray-400 mt-0.5">{en.inputName} — {en.inputQuantity} {en.inputUnit}</p>}
                  {en.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{en.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {en.cost != null && <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(en.cost)}</span>}
                <button onClick={() => remove(en.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && <EntryModal farms={farms} onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function EntryModal({ farms, onClose, onSaved }: { farms: Farm[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ farmId: farms[0]?.id ?? '', plotId: '', type: 'PLANTIO', title: '', description: '', date: '', inputName: '', inputQuantity: '', inputUnit: '', cost: '' });
  const [saving, setSaving] = useState(false);
  const selectedFarm = farms.find((f) => f.id === form.farmId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmId || !form.title || !form.date) { toast.error('Preencha fazenda, título e data.'); return; }
    setSaving(true);
    try {
      await api.post('/field-journal', {
        farmId: form.farmId, plotId: form.plotId || undefined, type: form.type, title: form.title,
        description: form.description || undefined, date: new Date(form.date).toISOString(),
        inputName: form.inputName || undefined, inputQuantity: form.inputQuantity ? Number(form.inputQuantity) : undefined,
        inputUnit: form.inputUnit || undefined, cost: form.cost ? Number(form.cost) : undefined,
      });
      toast.success('Registro criado'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Novo registro de campo" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Fazenda</label><select className="input" value={form.farmId} onChange={(e) => setForm({ ...form, farmId: e.target.value, plotId: '' })}>{farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
          <div><label className="label">Talhão</label><select className="input" value={form.plotId} onChange={(e) => setForm({ ...form, plotId: e.target.value })}><option value="">—</option>{selectedFarm?.plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Atividade</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></div>
          <div><label className="label">Data</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div><label className="label">Título</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">Descrição</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Insumo</label><input className="input" value={form.inputName} onChange={(e) => setForm({ ...form, inputName: e.target.value })} /></div>
          <div><label className="label">Qtd</label><input type="number" className="input" value={form.inputQuantity} onChange={(e) => setForm({ ...form, inputQuantity: e.target.value })} /></div>
          <div><label className="label">Unid.</label><input className="input" value={form.inputUnit} onChange={(e) => setForm({ ...form, inputUnit: e.target.value })} /></div>
        </div>
        <div><label className="label">Custo (R$)</label><input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Registrar'}</button>
      </form>
    </Modal>
  );
}
