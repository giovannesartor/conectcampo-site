'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const TYPES = ['CPR','PARCELA_CREDITO','SEGURO','IMPOSTO','ARRENDAMENTO','FORNECEDOR','OUTRO'];
const TYPE_LABEL: Record<string, string> = {
  CPR: 'CPR', PARCELA_CREDITO: 'Parcela de crédito', SEGURO: 'Seguro',
  IMPOSTO: 'Imposto', ARRENDAMENTO: 'Arrendamento', FORNECEDOR: 'Fornecedor', OUTRO: 'Outro',
};

interface Event {
  id: string;
  title: string;
  type: string;
  amount: number | null;
  dueDate: string;
  status: string;
}
interface Summary {
  total: number; totalPendente: number; totalAtrasado: number;
  countAtrasado: number; countProximos30: number; totalProximos30: number;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/calendar'), api.get('/calendar/summary')])
      .then(([e, s]) => { setEvents(e.data); setSummary(s.data); })
      .catch(() => toast.error('Não foi possível carregar o calendário.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const pay = async (id: string) => {
    try { await api.patch(`/calendar/${id}/pay`); toast.success('Marcado como pago'); load(); }
    catch { toast.error('Erro'); }
  };
  const remove = async (id: string) => {
    try { await api.delete(`/calendar/${id}`); load(); } catch { toast.error('Erro'); }
  };
  const sync = async () => {
    try {
      const { data } = await api.post('/calendar/sync', {});
      toast.success(data.created ? `${data.created} vencimento(s) criado(s)` : 'Tudo já sincronizado');
      load();
    } catch { toast.error('Erro ao sincronizar'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Calendário de Vencimentos" subtitle="Parcelas, CPRs, seguros e impostos" icon={<CalendarClock className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Novo vencimento" />

      <div className="flex justify-end">
        <button onClick={sync} className="btn-secondary text-sm">Sincronizar de CPRs e contratos</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="A vencer" value={formatCurrency(summary.totalPendente)} />
          <StatCard label="Próx. 30 dias" value={`${summary.countProximos30}`} sub={formatCurrency(summary.totalProximos30)} />
          <StatCard label="Atrasados" value={`${summary.countAtrasado}`} sub={formatCurrency(summary.totalAtrasado)} danger />
          <StatCard label="Total" value={`${summary.total}`} />
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nenhum vencimento cadastrado" description="Cadastre parcelas e obrigações para receber lembretes." actionLabel="Novo vencimento" onAction={() => setShow(true)} />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((ev) => {
            const overdue = ev.status === 'ATRASADO';
            const paid = ev.status === 'PAGO';
            return (
              <div key={ev.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  {paid ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : overdue ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CalendarClock className="h-5 w-5 text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ev.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{TYPE_LABEL[ev.type]} · vence {formatDate(ev.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ev.amount != null && <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(ev.amount)}</span>}
                  {!paid && <button onClick={() => pay(ev.id)} className="btn-secondary text-xs">Pagar</button>}
                  <button onClick={() => remove(ev.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {show && <EventModal onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function EventModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', type: 'PARCELA_CREDITO', amount: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) { toast.error('Preencha título e data.'); return; }
    setSaving(true);
    try {
      await api.post('/calendar', { title: form.title, type: form.type, amount: form.amount ? Number(form.amount) : undefined, dueDate: new Date(form.dueDate).toISOString() });
      toast.success('Vencimento criado'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Novo vencimento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Título</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></div>
          <div><label className="label">Valor (R$)</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
        <div><label className="label">Vencimento</label><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Criar'}</button>
      </form>
    </Modal>
  );
}
