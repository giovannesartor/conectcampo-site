'use client';

import { useEffect, useState } from 'react';
import { FileSignature, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const STATUS = ['RASCUNHO','ATIVO','ENTREGUE','LIQUIDADO','CANCELADO'];
const STATUS_STYLE: Record<string, string> = {
  RASCUNHO: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  ATIVO: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  ENTREGUE: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
  LIQUIDADO: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  CANCELADO: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
};

interface Contract {
  id: string; buyerName: string; product: string; quantity: number; unit: string; pricePerUnit: number;
  totalValue: number | null; deliveryType: string; deliveryDate: string | null; safra: string | null;
  hedged: boolean; status: string;
}
interface Summary { total: number; ativos: number; entregues: number; totalContratado: number; totalHedge: number; }

export default function SalesContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/sales-contracts'), api.get('/sales-contracts/summary')])
      .then(([c, s]) => { setContracts(c.data); setSummary(s.data); })
      .catch(() => toast.error('Não foi possível carregar os contratos.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: string) => { try { await api.patch(`/sales-contracts/${id}`, { status }); load(); } catch { toast.error('Erro'); } };
  const remove = async (id: string) => { try { await api.delete(`/sales-contracts/${id}`); load(); } catch { toast.error('Erro'); } };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos de Venda" subtitle="Contratos a termo, preços travados e hedge" icon={<FileSignature className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Novo contrato" />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Valor contratado" value={formatCurrency(summary.totalContratado)} accent />
          <StatCard label="Ativos" value={summary.ativos} />
          <StatCard label="Entregues" value={summary.entregues} />
          <StatCard label="Com hedge" value={summary.totalHedge} />
        </div>
      )}

      {contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="Nenhum contrato de venda" description="Registre contratos a termo e trave preços da sua produção." actionLabel="Novo contrato" onAction={() => setShow(true)} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="py-2 pr-4">Comprador</th><th className="py-2 pr-4">Produto</th><th className="py-2 pr-4">Qtd</th>
                <th className="py-2 pr-4">Preço</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Entrega</th>
                <th className="py-2 pr-4">Status</th><th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {contracts.map((c) => (
                <tr key={c.id} className="text-gray-700 dark:text-gray-300">
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{c.buyerName}{c.hedged && <ShieldCheck className="inline h-3.5 w-3.5 ml-1 text-emerald-500" />}</td>
                  <td className="py-3 pr-4">{c.product}</td>
                  <td className="py-3 pr-4">{Number(c.quantity).toLocaleString('pt-BR')} {c.unit}</td>
                  <td className="py-3 pr-4">{formatCurrency(c.pricePerUnit)}</td>
                  <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white">{c.totalValue != null ? formatCurrency(c.totalValue) : '—'}</td>
                  <td className="py-3 pr-4">{c.deliveryDate ? formatDate(c.deliveryDate) : c.deliveryType}</td>
                  <td className="py-3 pr-4">
                    <select value={c.status} onChange={(e) => setStatus(c.id, e.target.value)} className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 ${STATUS_STYLE[c.status]}`}>
                      {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3"><button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show && <ContractModal onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function ContractModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ buyerName: '', product: '', quantity: '', unit: 'sacas', pricePerUnit: '', deliveryType: 'A_TERMO', deliveryDate: '', safra: '', hedged: false, hedgeReference: '' });
  const [saving, setSaving] = useState(false);
  const total = form.quantity && form.pricePerUnit ? Number(form.quantity) * Number(form.pricePerUnit) : 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerName || !form.product || !form.quantity || !form.pricePerUnit) { toast.error('Preencha os campos obrigatórios.'); return; }
    setSaving(true);
    try {
      await api.post('/sales-contracts', {
        buyerName: form.buyerName, product: form.product, quantity: Number(form.quantity), unit: form.unit, pricePerUnit: Number(form.pricePerUnit),
        deliveryType: form.deliveryType, deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
        safra: form.safra || undefined, hedged: form.hedged, hedgeReference: form.hedgeReference || undefined,
      });
      toast.success('Contrato criado'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Novo contrato de venda" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Comprador / trading</label><input className="input" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Produto</label><input className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} /></div>
          <div><label className="label">Quantidade</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="label">Unidade</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Preço/unidade (R$)</label><input type="number" className="input" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></div>
          <div><label className="label">Entrega</label><select className="input" value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}><option value="A_TERMO">A termo</option><option value="DISPONIVEL">Disponível</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Data de entrega</label><input type="date" className="input" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></div>
          <div><label className="label">Safra</label><input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={form.hedged} onChange={(e) => setForm({ ...form, hedged: e.target.checked })} /> Possui hedge (B3)</label>
        {form.hedged && <div><label className="label">Referência do hedge</label><input className="input" value={form.hedgeReference} onChange={(e) => setForm({ ...form, hedgeReference: e.target.value })} /></div>}
        {total > 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Valor total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span></p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Criar contrato'}</button>
      </form>
    </Modal>
  );
}
