'use client';

import { useEffect, useState } from 'react';
import { Store, Trash2, MapPin, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface Listing {
  id: string; type: string; product: string; quantity: number; unit: string; pricePerUnit: number | null;
  state: string | null; city: string | null; safra: string | null; description: string | null;
  contactPhone: string | null; status: string; createdAt: string; user?: { name: string };
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [browse, setBrowse] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [filterType, setFilterType] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get(`/marketplace${filterType ? `?type=${filterType}` : ''}`), api.get('/marketplace/mine')])
      .then(([b, m]) => { setBrowse(b.data); setMine(m.data); })
      .catch(() => toast.error('Não foi possível carregar o marketplace.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filterType]);

  const remove = async (id: string) => { try { await api.delete(`/marketplace/${id}`); load(); } catch { toast.error('Erro'); } };

  if (loading) return <Spinner />;

  const list = tab === 'browse' ? browse : mine;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace de Grãos" subtitle="Ofertas de compra e venda entre produtores" icon={<Store className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Publicar oferta" />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'browse' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Vitrine</button>
          <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Minhas ofertas</button>
        </div>
        {tab === 'browse' && (
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input max-w-[160px]">
            <option value="">Todos os tipos</option>
            <option value="VENDA">Venda</option>
            <option value="COMPRA">Compra</option>
          </select>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Store} title={tab === 'browse' ? 'Nenhuma oferta disponível' : 'Você ainda não publicou ofertas'} description={tab === 'browse' ? 'Ainda não há ofertas ativas na vitrine.' : 'Publique ofertas de compra ou venda de grãos.'} actionLabel="Publicar oferta" onAction={() => setShow(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((l) => (
            <div key={l.id} className="card">
              <div className="flex items-start justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${l.type === 'VENDA' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400'}`}>{l.type}</span>
                {tab === 'mine' && <button onClick={() => remove(l.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
              </div>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white">{l.product}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{Number(l.quantity).toLocaleString('pt-BR')} {l.unit}{l.safra ? ` · ${l.safra}` : ''}</p>
              {l.pricePerUnit != null && <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{l.pricePerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span className="text-xs text-gray-400 font-normal">/{l.unit}</span></p>}
              {l.description && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{l.description}</p>}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 space-y-1">
                {(l.city || l.state) && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}{l.city && l.state ? '/' : ''}{l.state}</p>}
                {l.user && <p>Por {l.user.name}</p>}
                {l.contactPhone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.contactPhone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {show && <ListingModal onClose={() => setShow(false)} onSaved={() => { setShow(false); setTab('mine'); load(); }} />}
    </div>
  );
}

function ListingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'VENDA', product: '', quantity: '', unit: 'sacas', pricePerUnit: '', state: 'SP', city: '', safra: '', description: '', contactPhone: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product || !form.quantity) { toast.error('Preencha produto e quantidade.'); return; }
    setSaving(true);
    try {
      await api.post('/marketplace', {
        type: form.type, product: form.product, quantity: Number(form.quantity), unit: form.unit,
        pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined, state: form.state, city: form.city || undefined,
        safra: form.safra || undefined, description: form.description || undefined, contactPhone: form.contactPhone || undefined,
      });
      toast.success('Oferta publicada'); onSaved();
    } catch { toast.error('Erro ao publicar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Publicar oferta" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="VENDA">Venda</option><option value="COMPRA">Compra</option></select></div>
          <div><label className="label">Produto</label><input className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Quantidade</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="label">Unidade</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div><label className="label">Preço/unid.</label><input type="number" className="input" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Estado</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">Safra</label><input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} /></div>
        </div>
        <div><label className="label">Contato (telefone)</label><input className="input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
        <div><label className="label">Descrição</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Publicando...' : 'Publicar'}</button>
      </form>
    </Modal>
  );
}
