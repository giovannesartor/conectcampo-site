'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Trash2, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const STATUS = ['ABERTA','NEGOCIACAO','FECHADA','CANCELADA'];
const STATUS_STYLE: Record<string, string> = {
  ABERTA: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  NEGOCIACAO: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
  FECHADA: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  CANCELADA: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
};

interface Offer {
  id: string; partnerName: string | null; inputProduct: string; inputQuantity: number; inputUnit: string;
  inputValue: number | null; grainProduct: string; grainQuantity: number; grainUnit: string;
  safra: string | null; deliveryDate: string | null; status: string;
}
interface Summary { total: number; abertas: number; fechadas: number; totalInsumoValor: number; }

export default function BarterPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/barter'), api.get('/barter/summary')])
      .then(([o, s]) => { setOffers(o.data); setSummary(s.data); })
      .catch(() => toast.error('Não foi possível carregar as operações.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: string) => { try { await api.patch(`/barter/${id}`, { status }); load(); } catch { toast.error('Erro'); } };
  const remove = async (id: string) => { try { await api.delete(`/barter/${id}`); load(); } catch { toast.error('Erro'); } };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Barter — Troca" subtitle="Insumo por grão, integrado aos parceiros" icon={<ArrowLeftRight className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Nova troca" />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Operações" value={summary.total} />
          <StatCard label="Abertas" value={summary.abertas} />
          <StatCard label="Fechadas" value={summary.fechadas} accent />
          <StatCard label="Valor em insumos" value={formatCurrency(summary.totalInsumoValor)} />
        </div>
      )}

      {offers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="Nenhuma operação de barter" description="Registre trocas de insumos por produção para organizar suas negociações." actionLabel="Nova troca" onAction={() => setShow(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                <button onClick={() => remove(o.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Package className="h-3 w-3" /> Recebe (insumo)</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{o.inputProduct}</p>
                  <p className="text-xs text-gray-500">{Number(o.inputQuantity).toLocaleString('pt-BR')} {o.inputUnit}{o.inputValue ? ` · ${formatCurrency(o.inputValue)}` : ''}</p>
                </div>
                <ArrowLeftRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Entrega (grão)</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{o.grainProduct}</p>
                  <p className="text-xs text-gray-500">{Number(o.grainQuantity).toLocaleString('pt-BR')} {o.grainUnit}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {o.partnerName ? `${o.partnerName} · ` : ''}{o.safra ? `Safra ${o.safra}` : ''}{o.deliveryDate ? ` · entrega ${formatDate(o.deliveryDate)}` : ''}
                </p>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-transparent">
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && <OfferModal onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function OfferModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ partnerName: '', inputProduct: '', inputQuantity: '', inputUnit: 'kg', inputValue: '', grainProduct: 'Soja', grainQuantity: '', grainUnit: 'sacas', safra: '', deliveryDate: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.inputProduct || !form.inputQuantity || !form.grainProduct || !form.grainQuantity) { toast.error('Preencha insumo e grão.'); return; }
    setSaving(true);
    try {
      await api.post('/barter', {
        partnerName: form.partnerName || undefined, inputProduct: form.inputProduct, inputQuantity: Number(form.inputQuantity), inputUnit: form.inputUnit,
        inputValue: form.inputValue ? Number(form.inputValue) : undefined, grainProduct: form.grainProduct, grainQuantity: Number(form.grainQuantity), grainUnit: form.grainUnit,
        safra: form.safra || undefined, deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
      });
      toast.success('Troca registrada'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Nova troca (barter)" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Parceiro / revenda</label><input className="input" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1"><label className="label">Insumo</label><input className="input" value={form.inputProduct} onChange={(e) => setForm({ ...form, inputProduct: e.target.value })} /></div>
          <div><label className="label">Qtd</label><input type="number" className="input" value={form.inputQuantity} onChange={(e) => setForm({ ...form, inputQuantity: e.target.value })} /></div>
          <div><label className="label">Unid.</label><input className="input" value={form.inputUnit} onChange={(e) => setForm({ ...form, inputUnit: e.target.value })} /></div>
        </div>
        <div><label className="label">Valor do insumo (R$)</label><input type="number" className="input" value={form.inputValue} onChange={(e) => setForm({ ...form, inputValue: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1"><label className="label">Grão</label><input className="input" value={form.grainProduct} onChange={(e) => setForm({ ...form, grainProduct: e.target.value })} /></div>
          <div><label className="label">Qtd</label><input type="number" className="input" value={form.grainQuantity} onChange={(e) => setForm({ ...form, grainQuantity: e.target.value })} /></div>
          <div><label className="label">Unid.</label><input className="input" value={form.grainUnit} onChange={(e) => setForm({ ...form, grainUnit: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Safra</label><input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} /></div>
          <div><label className="label">Entrega</label><input type="date" className="input" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Registrar troca'}</button>
      </form>
    </Modal>
  );
}
