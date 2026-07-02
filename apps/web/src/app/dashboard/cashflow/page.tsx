'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const CATEGORIES = ['VENDA_GRAO','CUSTEIO','INSUMOS','MAO_DE_OBRA','MAQUINARIO','ARRENDAMENTO','FINANCIAMENTO','IMPOSTOS','OUTRO'];
const CAT_LABEL: Record<string, string> = {
  VENDA_GRAO: 'Venda de grão', CUSTEIO: 'Custeio', INSUMOS: 'Insumos', MAO_DE_OBRA: 'Mão de obra',
  MAQUINARIO: 'Maquinário', ARRENDAMENTO: 'Arrendamento', FINANCIAMENTO: 'Financiamento', IMPOSTOS: 'Impostos', OUTRO: 'Outro',
};

interface Entry { id: string; type: string; category: string; description: string; amount: number; date: string; isProjected: boolean; }
interface Summary {
  totalReceita: number; totalDespesa: number; saldoRealizado: number;
  projReceita: number; projDespesa: number; saldoProjetado: number;
  monthlySeries: { month: string; receita: number; despesa: number; saldo: number }[];
}

export default function CashflowPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/cashflow'), api.get('/cashflow/summary')])
      .then(([e, s]) => { setEntries(e.data); setSummary(s.data); })
      .catch(() => toast.error('Não foi possível carregar o fluxo de caixa.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => { try { await api.delete(`/cashflow/${id}`); load(); } catch { toast.error('Erro'); } };

  const exportCsv = async () => {
    try {
      const res = await api.get('/cashflow/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fluxo-de-caixa.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erro ao exportar'); }
  };

  if (loading) return <Spinner />;

  const maxBar = summary ? Math.max(1, ...summary.monthlySeries.map((m) => Math.max(m.receita, m.despesa))) : 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Fluxo de Caixa Agrícola" subtitle="Receitas e despesas por safra, com projeção" icon={<Wallet className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Novo lançamento" />

      <div className="flex justify-end">
        <button onClick={exportCsv} className="btn-secondary text-sm">Exportar CSV</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Receita realizada" value={formatCurrency(summary.totalReceita)} accent />
          <StatCard label="Despesa realizada" value={formatCurrency(summary.totalDespesa)} danger />
          <StatCard label="Saldo realizado" value={formatCurrency(summary.saldoRealizado)} />
          <StatCard label="Saldo projetado" value={formatCurrency(summary.saldoProjetado)} accent={summary.saldoProjetado >= 0} danger={summary.saldoProjetado < 0} />
        </div>
      )}

      {summary && summary.monthlySeries.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Evolução mensal</h2>
          <div className="space-y-2">
            {summary.monthlySeries.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-16 text-xs text-gray-500 dark:text-gray-400">{m.month}</span>
                <div className="flex-1 flex gap-1 h-5">
                  <div className="bg-emerald-400 rounded" style={{ width: `${(m.receita / maxBar) * 50}%` }} title={`Receita ${formatCurrency(m.receita)}`} />
                  <div className="bg-red-400 rounded" style={{ width: `${(m.despesa / maxBar) * 50}%` }} title={`Despesa ${formatCurrency(m.despesa)}`} />
                </div>
                <span className={`w-24 text-right text-xs font-medium ${m.saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(m.saldo)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Receita</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Despesa</span>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhum lançamento" description="Registre receitas e despesas para projetar o fluxo de caixa da safra." actionLabel="Novo lançamento" onAction={() => setShow(true)} />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {entries.map((en) => (
            <div key={en.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {en.type === 'RECEITA' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{en.description}{en.isProjected && <span className="ml-2 rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">projetado</span>}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{CAT_LABEL[en.category]} · {formatDate(en.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${en.type === 'RECEITA' ? 'text-emerald-600' : 'text-red-500'}`}>{en.type === 'RECEITA' ? '+' : '-'}{formatCurrency(en.amount)}</span>
                <button onClick={() => remove(en.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && <EntryModal onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function EntryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'RECEITA', category: 'VENDA_GRAO', description: '', amount: '', date: '', safra: '', isProjected: false });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.date) { toast.error('Preencha descrição, valor e data.'); return; }
    setSaving(true);
    try {
      await api.post('/cashflow', { type: form.type, category: form.category, description: form.description, amount: Number(form.amount), date: new Date(form.date).toISOString(), safra: form.safra || undefined, isProjected: form.isProjected });
      toast.success('Lançamento criado'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Novo lançamento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option></select></div>
          <div><label className="label">Categoria</label><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}</select></div>
        </div>
        <div><label className="label">Descrição</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Valor (R$)</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><label className="label">Data</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><label className="label">Safra</label><input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 pb-2"><input type="checkbox" checked={form.isProjected} onChange={(e) => setForm({ ...form, isProjected: e.target.checked })} /> Projetado</label>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Criar'}</button>
      </form>
    </Modal>
  );
}
