'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Store, Trash2, MapPin, Phone, Search, SlidersHorizontal,
  ArrowUpDown, MessageCircle, Package, TrendingUp, Pencil, Pause, Play,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader, StatCard } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CROPS = ['SOJA','MILHO','CAFE','ALGODAO','CANA','ARROZ','TRIGO','FEIJAO','PECUARIA_CORTE','PECUARIA_LEITE','AVICULTURA','SUINOCULTURA','FRUTICULTURA','SILVICULTURA','OUTRO'];
const CROP_LABEL: Record<string, string> = {
  SOJA: 'Soja', MILHO: 'Milho', CAFE: 'Café', ALGODAO: 'Algodão', CANA: 'Cana',
  ARROZ: 'Arroz', TRIGO: 'Trigo', FEIJAO: 'Feijão', PECUARIA_CORTE: 'Boi de corte',
  PECUARIA_LEITE: 'Leite', AVICULTURA: 'Avicultura', SUINOCULTURA: 'Suinocultura',
  FRUTICULTURA: 'Fruticultura', SILVICULTURA: 'Silvicultura', OUTRO: 'Outro',
};
const UNITS = ['sacas', 'toneladas', 'arrobas', 'kg', 'fardos'];

interface Listing {
  id: string; type: string; product: string; cropType: string | null; quantity: number; unit: string;
  pricePerUnit: number | null; state: string | null; city: string | null; safra: string | null;
  description: string | null; contactPhone: string | null; status: string; createdAt: string; user?: { name: string };
}

type SortKey = 'recent' | 'priceAsc' | 'priceDesc' | 'qty';

export default function MarketplacePage() {
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [browse, setBrowse] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  // filtros
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/marketplace'), api.get('/marketplace/mine')])
      .then(([b, m]) => { setBrowse(b.data); setMine(m.data); })
      .catch(() => toast.error('Não foi possível carregar o marketplace.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    if (!confirm('Remover esta oferta?')) return;
    try { await api.delete(`/marketplace/${id}`); toast.success('Oferta removida'); load(); } catch { toast.error('Erro'); }
  };
  const toggleStatus = async (l: Listing) => {
    const status = l.status === 'ATIVA' ? 'PAUSADA' : 'ATIVA';
    try { await api.patch(`/marketplace/${l.id}`, { status }); load(); } catch { toast.error('Erro'); }
  };

  const source = tab === 'browse' ? browse : mine;

  const filtered = useMemo(() => {
    let list = [...source];
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter((l) => l.product.toLowerCase().includes(term) || (l.description ?? '').toLowerCase().includes(term));
    }
    if (filterType) list = list.filter((l) => l.type === filterType);
    if (filterState) list = list.filter((l) => l.state === filterState);
    if (filterCrop) list = list.filter((l) => l.cropType === filterCrop);
    switch (sort) {
      case 'priceAsc': list.sort((a, b) => (a.pricePerUnit ?? Infinity) - (b.pricePerUnit ?? Infinity)); break;
      case 'priceDesc': list.sort((a, b) => (b.pricePerUnit ?? -1) - (a.pricePerUnit ?? -1)); break;
      case 'qty': list.sort((a, b) => Number(b.quantity) - Number(a.quantity)); break;
      default: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [source, q, filterType, filterState, filterCrop, sort]);

  const stats = useMemo(() => {
    const active = browse.filter((l) => l.status === 'ATIVA');
    const vendas = active.filter((l) => l.type === 'VENDA').length;
    const compras = active.filter((l) => l.type === 'COMPRA').length;
    const prices = active.map((l) => l.pricePerUnit).filter((p): p is number => p != null);
    const avg = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    return { total: active.length, vendas, compras, avg };
  }, [browse]);

  if (loading) return <Spinner />;

  const clearFilters = () => { setQ(''); setFilterType(''); setFilterState(''); setFilterCrop(''); setSort('recent'); };
  const activeFilters = [q, filterType, filterState, filterCrop].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace de Grãos" subtitle="Compre e venda produção direto entre produtores" icon={<Store className="h-6 w-6 text-brand-600" />} onAdd={() => { setEditing(null); setShow(true); }} addLabel="Publicar oferta" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ofertas ativas" value={stats.total} />
        <StatCard label="À venda" value={stats.vendas} accent />
        <StatCard label="Procura (compra)" value={stats.compras} />
        <StatCard label="Preço médio" value={stats.avg ? formatCurrency(stats.avg) : '—'} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'browse' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Vitrine</button>
          <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Minhas ofertas</button>
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary text-sm flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filtros{activeFilters ? ` (${activeFilters})` : ''}
        </button>
      </div>

      {/* Barra de busca + filtros */}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar produto ou descrição..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select className="input pl-9 pr-8" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="recent">Mais recentes</option>
              <option value="priceAsc">Menor preço</option>
              <option value="priceDesc">Maior preço</option>
              <option value="qty">Maior quantidade</option>
            </select>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos os tipos</option><option value="VENDA">Venda</option><option value="COMPRA">Compra</option>
            </select>
            <select className="input" value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)}>
              <option value="">Todas as culturas</option>{CROPS.map((c) => <option key={c} value={c}>{CROP_LABEL[c]}</option>)}
            </select>
            <select className="input" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
              <option value="">Todos os estados</option>{STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={clearFilters} className="btn-secondary text-sm">Limpar filtros</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title={activeFilters ? 'Nenhum resultado' : (tab === 'browse' ? 'Nenhuma oferta disponível' : 'Você ainda não publicou ofertas')} description={activeFilters ? 'Ajuste os filtros para ver mais ofertas.' : (tab === 'browse' ? 'Ainda não há ofertas ativas na vitrine.' : 'Publique ofertas de compra ou venda de grãos.')} actionLabel="Publicar oferta" onAction={() => { setEditing(null); setShow(true); }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const isVenda = l.type === 'VENDA';
            const total = l.pricePerUnit != null ? l.pricePerUnit * Number(l.quantity) : null;
            const wa = l.contactPhone ? `https://wa.me/55${l.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse na sua oferta de ${l.product} no ConectCampo.`)}` : null;
            return (
              <div key={l.id} className={`card border-t-4 ${isVenda ? 'border-t-emerald-500' : 'border-t-blue-500'} flex flex-col`}>
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isVenda ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400'}`}>
                    {isVenda ? <TrendingUp className="h-3 w-3" /> : <Package className="h-3 w-3" />}{l.type}
                  </span>
                  {l.status !== 'ATIVA' && tab === 'mine' && <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">{l.status}</span>}
                </div>

                <p className="mt-2 font-semibold text-gray-900 dark:text-white">{l.product}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Number(l.quantity).toLocaleString('pt-BR')} {l.unit}
                  {l.cropType ? ` · ${CROP_LABEL[l.cropType] ?? l.cropType}` : ''}{l.safra ? ` · ${l.safra}` : ''}
                </p>

                {l.pricePerUnit != null && (
                  <div className="mt-2">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(l.pricePerUnit)}<span className="text-xs text-gray-400 font-normal">/{l.unit}</span>
                    </p>
                    {total != null && <p className="text-xs text-gray-400">Total: {formatCurrency(total)}</p>}
                  </div>
                )}

                {l.description && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{l.description}</p>}

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 space-y-1 flex-1">
                  {(l.city || l.state) && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}{l.city && l.state ? '/' : ''}{l.state}</p>}
                  {l.user && <p>Por {l.user.name}</p>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {tab === 'browse' ? (
                    wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs flex-1 flex items-center justify-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> Contato
                      </a>
                    ) : l.contactPhone ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {l.contactPhone}</span>
                    ) : <span className="text-xs text-gray-400">Sem contato informado</span>
                  ) : (
                    <>
                      <button onClick={() => { setEditing(l); setShow(true); }} className="btn-secondary text-xs flex items-center gap-1"><Pencil className="h-3 w-3" /> Editar</button>
                      <button onClick={() => toggleStatus(l)} className="btn-secondary text-xs flex items-center gap-1">
                        {l.status === 'ATIVA' ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Ativar</>}
                      </button>
                      <button onClick={() => remove(l.id)} className="ml-auto text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {show && <ListingModal listing={editing} onClose={() => setShow(false)} onSaved={() => { setShow(false); setTab('mine'); load(); }} />}
    </div>
  );
}

function ListingModal({ listing, onClose, onSaved }: { listing: Listing | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    type: listing?.type ?? 'VENDA', product: listing?.product ?? '', cropType: listing?.cropType ?? '',
    quantity: listing?.quantity ? String(listing.quantity) : '', unit: listing?.unit ?? 'sacas',
    pricePerUnit: listing?.pricePerUnit != null ? String(listing.pricePerUnit) : '',
    state: listing?.state ?? 'SP', city: listing?.city ?? '', safra: listing?.safra ?? '',
    description: listing?.description ?? '', contactPhone: listing?.contactPhone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const total = form.quantity && form.pricePerUnit ? Number(form.quantity) * Number(form.pricePerUnit) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product || !form.quantity) { toast.error('Preencha produto e quantidade.'); return; }
    setSaving(true);
    const payload = {
      type: form.type, product: form.product, cropType: form.cropType || undefined, quantity: Number(form.quantity), unit: form.unit,
      pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined, state: form.state, city: form.city || undefined,
      safra: form.safra || undefined, description: form.description || undefined, contactPhone: form.contactPhone || undefined,
    };
    try {
      if (listing) await api.patch(`/marketplace/${listing.id}`, payload);
      else await api.post('/marketplace', payload);
      toast.success(listing ? 'Oferta atualizada' : 'Oferta publicada'); onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  return (
    <Modal title={listing ? 'Editar oferta' : 'Publicar oferta'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="VENDA">Venda</option><option value="COMPRA">Compra</option></select></div>
          <div><label className="label">Cultura</label><select className="input" value={form.cropType} onChange={(e) => setForm({ ...form, cropType: e.target.value })}><option value="">—</option>{CROPS.map((c) => <option key={c} value={c}>{CROP_LABEL[c]}</option>)}</select></div>
        </div>
        <div><label className="label">Produto</label><input className="input" placeholder="Ex: Soja em grão" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Quantidade</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="label">Unidade</label><select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
          <div><label className="label">Preço/unid.</label><input type="number" className="input" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Estado</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">Safra</label><input className="input" placeholder="2025/2026" value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} /></div>
        </div>
        <div><label className="label">Contato (WhatsApp)</label><input className="input" placeholder="(65) 99999-9999" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
        <div><label className="label">Descrição</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {total > 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Valor total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span></p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : listing ? 'Salvar alterações' : 'Publicar'}</button>
      </form>
    </Modal>
  );
}
