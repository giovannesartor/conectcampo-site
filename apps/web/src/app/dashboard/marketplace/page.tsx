'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Store, Trash2, MapPin, Phone, Search, SlidersHorizontal, ArrowUpDown,
  MessageCircle, Package, TrendingUp, Pencil, Pause, Play, ShoppingCart,
  ShieldCheck, Truck, CheckCircle2, Clock, AlertTriangle, Info, X, HandCoins, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
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
const PARTY_FEE = 0.005; // 0,5% por parte

interface Listing {
  id: string; type: string; product: string; cropType: string | null; quantity: number; unit: string;
  pricePerUnit: number | null; state: string | null; city: string | null; safra: string | null;
  description: string | null; contactPhone: string | null; status: string; createdAt: string; user?: { name: string };
  sellerRating?: { average: number; count: number };
}

interface Order {
  id: string; product: string; quantity: number; unit: string; unitPrice: number;
  subtotal: number; buyerFee: number; sellerFee: number; buyerTotal: number; sellerNet: number;
  status: string; paymentUrl: string | null; shippingInfo: string | null; createdAt: string;
  buyer?: { name: string }; seller?: { name: string };
  reviewed?: boolean; counterpartRating?: { average: number; count: number };
}

function Stars({ value, count, size = 'text-sm' }: { value: number; count?: number; size?: string }) {
  if (!value && !count) return <span className="text-xs text-gray-400">Sem avaliações</span>;
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= full ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">{value.toFixed(1)}{count != null ? ` (${count})` : ''}</span>
    </span>
  );
}

type SortKey = 'recent' | 'priceAsc' | 'priceDesc' | 'qty';

const ORDER_STATUS: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', style: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400', icon: <Clock className="h-3 w-3" /> },
  PAGO_EM_CUSTODIA: { label: 'Pago · em custódia', style: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400', icon: <ShieldCheck className="h-3 w-3" /> },
  ENVIADO: { label: 'Enviado', style: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400', icon: <Truck className="h-3 w-3" /> },
  RECEBIDO_LIBERADO: { label: 'Recebido · liberado', style: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  REPASSADO: { label: 'Repassado', style: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: <HandCoins className="h-3 w-3" /> },
  CANCELADO: { label: 'Cancelado', style: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300', icon: <X className="h-3 w-3" /> },
  DISPUTA: { label: 'Em disputa', style: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400', icon: <AlertTriangle className="h-3 w-3" /> },
  REEMBOLSADO: { label: 'Reembolsado', style: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300', icon: <X className="h-3 w-3" /> },
};

export default function MarketplacePage() {
  const [tab, setTab] = useState<'browse' | 'mine' | 'orders'>('browse');
  const [browse, setBrowse] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<{ purchases: Order[]; sales: Order[] }>({ purchases: [], sales: [] });
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [buying, setBuying] = useState<Listing | null>(null);
  const [howItWorks, setHowItWorks] = useState(false);

  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/marketplace'), api.get('/marketplace/mine'), api.get('/marketplace/orders')])
      .then(([b, m, o]) => { setBrowse(b.data); setMine(m.data); setOrders(o.data); })
      .catch(() => toast.error('Não foi possível carregar o marketplace.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const removeListing = async (id: string) => {
    if (!confirm('Remover esta oferta?')) return;
    try { await api.delete(`/marketplace/${id}`); toast.success('Oferta removida'); load(); } catch { toast.error('Erro'); }
  };
  const toggleStatus = async (l: Listing) => {
    const status = l.status === 'ATIVA' ? 'PAUSADA' : 'ATIVA';
    try { await api.patch(`/marketplace/${l.id}`, { status }); load(); } catch { toast.error('Erro'); }
  };

  // ── Ações de pedido ──
  const shipOrder = async (id: string) => { try { await api.patch(`/marketplace/orders/${id}/ship`, {}); toast.success('Marcado como enviado'); load(); } catch { toast.error('Erro'); } };
  const confirmOrder = async (id: string) => { if (!confirm('Confirmar que recebeu o produto? O valor será liberado ao vendedor.')) return; try { await api.patch(`/marketplace/orders/${id}/confirm`, {}); toast.success('Recebimento confirmado'); load(); } catch { toast.error('Erro'); } };
  const disputeOrder = async (id: string) => { const reason = prompt('Descreva o motivo da disputa:'); if (!reason) return; try { await api.patch(`/marketplace/orders/${id}/dispute`, { reason }); toast.success('Disputa aberta'); load(); } catch { toast.error('Erro'); } };
  const cancelOrder = async (id: string) => { try { await api.patch(`/marketplace/orders/${id}/cancel`, {}); load(); } catch { toast.error('Erro'); } };

  const source = tab === 'mine' ? mine : browse;

  const filtered = useMemo(() => {
    let list = [...source];
    if (q.trim()) { const t = q.toLowerCase(); list = list.filter((l) => l.product.toLowerCase().includes(t) || (l.description ?? '').toLowerCase().includes(t)); }
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
    const prices = active.map((l) => l.pricePerUnit).filter((p): p is number => p != null);
    const avg = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    return { total: active.length, vendas: active.filter((l) => l.type === 'VENDA').length, compras: active.filter((l) => l.type === 'COMPRA').length, avg };
  }, [browse]);

  if (loading) return <Spinner />;

  const clearFilters = () => { setQ(''); setFilterType(''); setFilterState(''); setFilterCrop(''); setSort('recent'); };
  const activeFilters = [q, filterType, filterState, filterCrop].filter(Boolean).length;
  const ordersCount = orders.purchases.length + orders.sales.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace de Grãos" subtitle="Compre e venda com pagamento seguro em custódia" icon={<Store className="h-6 w-6 text-brand-600" />} onAdd={() => { setEditing(null); setShow(true); }} addLabel="Publicar oferta" />

      {/* Como funciona (escrow) */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 p-4">
        <button onClick={() => setHowItWorks((v) => !v)} className="w-full flex items-center justify-between text-left">
          <span className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="h-5 w-5" /> Pagamento seguro em custódia — como funciona
          </span>
          <Info className="h-4 w-4 text-emerald-600" />
        </button>
        {howItWorks && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {[
              { n: 1, t: 'Comprador paga', d: 'O pagamento é feito via ValsaPay (sem taxas de gateway).' },
              { n: 2, t: 'ConectCampo retém', d: 'O valor fica em custódia — o vendedor ainda não recebe.' },
              { n: 3, t: 'Vendedor entrega', d: 'O vendedor envia o produto e marca como enviado.' },
              { n: 4, t: 'Comprador confirma', d: 'Ao confirmar o recebimento, o valor é liberado ao vendedor.' },
            ].map((s) => (
              <div key={s.n} className="rounded-xl bg-white/70 dark:bg-gray-900/40 p-3">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">{s.n}</div>
                <p className="mt-2 font-semibold text-gray-900 dark:text-white">{s.t}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{s.d}</p>
              </div>
            ))}
            <p className="md:col-span-4 text-xs text-emerald-800 dark:text-emerald-300">
              💰 <strong>Taxa ConectCampo: 1% por venda</strong>, dividida igualmente — 0,5% do comprador e 0,5% do vendedor.
              O comprador paga o valor + 0,5%; o vendedor recebe o valor − 0,5%. Pagamentos do marketplace são exclusivamente via ValsaPay.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ofertas ativas" value={stats.total} />
        <StatCard label="À venda" value={stats.vendas} accent />
        <StatCard label="Procura (compra)" value={stats.compras} />
        <StatCard label="Preço médio" value={stats.avg ? formatCurrency(stats.avg) : '—'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'browse' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Vitrine</button>
          <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Minhas ofertas</button>
          <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'orders' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Meus pedidos{ordersCount ? ` (${ordersCount})` : ''}</button>
        </div>
        {tab !== 'orders' && (
          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary text-sm flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filtros{activeFilters ? ` (${activeFilters})` : ''}
          </button>
        )}
      </div>

      {tab === 'orders' ? (
        <OrdersView orders={orders} onShip={shipOrder} onConfirm={confirmOrder} onDispute={disputeOrder} onCancel={cancelOrder} onReload={load} />
      ) : (
        <>
          <div className="card space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="input pl-9" placeholder="Buscar produto ou descrição..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select className="input pl-9 pr-8" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  <option value="recent">Mais recentes</option><option value="priceAsc">Menor preço</option>
                  <option value="priceDesc">Maior preço</option><option value="qty">Maior quantidade</option>
                </select>
              </div>
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="">Todos os tipos</option><option value="VENDA">Venda</option><option value="COMPRA">Compra</option></select>
                <select className="input" value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)}><option value="">Todas as culturas</option>{CROPS.map((c) => <option key={c} value={c}>{CROP_LABEL[c]}</option>)}</select>
                <select className="input" value={filterState} onChange={(e) => setFilterState(e.target.value)}><option value="">Todos os estados</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
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
                const canBuy = tab === 'browse' && isVenda && l.pricePerUnit != null;
                return (
                  <div key={l.id} className={`card border-t-4 ${isVenda ? 'border-t-emerald-500' : 'border-t-blue-500'} flex flex-col`}>
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isVenda ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400'}`}>
                        {isVenda ? <TrendingUp className="h-3 w-3" /> : <Package className="h-3 w-3" />}{l.type}
                      </span>
                      {l.status !== 'ATIVA' && tab === 'mine' && <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">{l.status}</span>}
                    </div>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-white">{l.product}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{Number(l.quantity).toLocaleString('pt-BR')} {l.unit}{l.cropType ? ` · ${CROP_LABEL[l.cropType] ?? l.cropType}` : ''}{l.safra ? ` · ${l.safra}` : ''}</p>
                    {l.pricePerUnit != null && (
                      <div className="mt-2">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(l.pricePerUnit)}<span className="text-xs text-gray-400 font-normal">/{l.unit}</span></p>
                        {total != null && <p className="text-xs text-gray-400">Total: {formatCurrency(total)}</p>}
                      </div>
                    )}
                    {l.description && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{l.description}</p>}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 space-y-1 flex-1">
                      {(l.city || l.state) && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}{l.city && l.state ? '/' : ''}{l.state}</p>}
                      {l.user && <p>Por {l.user.name}</p>}
                      {tab === 'browse' && l.sellerRating && <Stars value={l.sellerRating.average} count={l.sellerRating.count} />}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {tab === 'browse' ? (
                        <>
                          {canBuy && (
                            <button onClick={() => setBuying(l)} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1">
                              <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                            </button>
                          )}
                          {wa ? (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${canBuy ? 'btn-secondary' : 'btn-primary flex-1'} text-xs flex items-center justify-center gap-1`}>
                              <MessageCircle className="h-3.5 w-3.5" /> Contato
                            </a>
                          ) : (!canBuy && (l.contactPhone ? <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {l.contactPhone}</span> : <span className="text-xs text-gray-400">Sem contato</span>))}
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditing(l); setShow(true); }} className="btn-secondary text-xs flex items-center gap-1"><Pencil className="h-3 w-3" /> Editar</button>
                          <button onClick={() => toggleStatus(l)} className="btn-secondary text-xs flex items-center gap-1">{l.status === 'ATIVA' ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Ativar</>}</button>
                          <button onClick={() => removeListing(l.id)} className="ml-auto text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {show && <ListingModal listing={editing} onClose={() => setShow(false)} onSaved={() => { setShow(false); setTab('mine'); load(); }} />}
      {buying && <OrderModal listing={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}

// ─── Meus pedidos ────────────────────────────────────────────────────────────

function OrdersView({ orders, onShip, onConfirm, onDispute, onCancel, onReload }: {
  orders: { purchases: Order[]; sales: Order[] };
  onShip: (id: string) => void; onConfirm: (id: string) => void; onDispute: (id: string) => void; onCancel: (id: string) => void;
  onReload: () => void;
}) {
  const [side, setSide] = useState<'purchases' | 'sales'>('purchases');
  const [reviewing, setReviewing] = useState<Order | null>(null);
  const list = orders[side];
  const isCompleted = (s: string) => s === 'RECEBIDO_LIBERADO' || s === 'REPASSADO';

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setSide('purchases')} className={`px-3 py-1.5 rounded-lg text-sm ${side === 'purchases' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>Compras ({orders.purchases.length})</button>
        <button onClick={() => setSide('sales')} className={`px-3 py-1.5 rounded-lg text-sm ${side === 'sales' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>Vendas ({orders.sales.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={side === 'purchases' ? 'Nenhuma compra ainda' : 'Nenhuma venda ainda'} description={side === 'purchases' ? 'Compre uma oferta na vitrine para começar.' : 'Suas vendas aparecerão aqui quando alguém comprar suas ofertas.'} />
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const st = ORDER_STATUS[o.status];
            const counterpart = side === 'purchases' ? o.seller?.name : o.buyer?.name;
            return (
              <div key={o.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{o.product}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Number(o.quantity).toLocaleString('pt-BR')} {o.unit} · {formatCurrency(o.unitPrice)}/{o.unit}
                      {counterpart ? ` · ${side === 'purchases' ? 'Vendedor' : 'Comprador'}: ${counterpart}` : ''} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st?.style}`}>{st?.icon}{st?.label ?? o.status}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><p className="text-xs text-gray-400">Subtotal</p><p className="font-medium text-gray-900 dark:text-white">{formatCurrency(o.subtotal)}</p></div>
                  {side === 'purchases' ? (
                    <><div><p className="text-xs text-gray-400">Taxa (0,5%)</p><p className="font-medium text-gray-900 dark:text-white">{formatCurrency(o.buyerFee)}</p></div>
                    <div><p className="text-xs text-gray-400">Você pagou</p><p className="font-semibold text-emerald-600">{formatCurrency(o.buyerTotal)}</p></div></>
                  ) : (
                    <><div><p className="text-xs text-gray-400">Taxa (0,5%)</p><p className="font-medium text-gray-900 dark:text-white">{formatCurrency(o.sellerFee)}</p></div>
                    <div><p className="text-xs text-gray-400">Você recebe</p><p className="font-semibold text-emerald-600">{formatCurrency(o.sellerNet)}</p></div></>
                  )}
                </div>

                {o.shippingInfo && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Truck className="h-3 w-3" /> {o.shippingInfo}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {side === 'purchases' && o.status === 'AGUARDANDO_PAGAMENTO' && o.paymentUrl && (
                    <a href={o.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">Pagar agora</a>
                  )}
                  {side === 'purchases' && o.status === 'AGUARDANDO_PAGAMENTO' && (
                    <button onClick={() => onCancel(o.id)} className="btn-secondary text-xs">Cancelar</button>
                  )}
                  {side === 'purchases' && (o.status === 'PAGO_EM_CUSTODIA' || o.status === 'ENVIADO') && (
                    <>
                      <button onClick={() => onConfirm(o.id)} className="btn-primary text-xs flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Confirmar recebimento</button>
                      <button onClick={() => onDispute(o.id)} className="btn-secondary text-xs">Abrir disputa</button>
                    </>
                  )}
                  {side === 'sales' && o.status === 'PAGO_EM_CUSTODIA' && (
                    <button onClick={() => onShip(o.id)} className="btn-primary text-xs flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Marcar como enviado</button>
                  )}
                  {side === 'sales' && (o.status === 'RECEBIDO_LIBERADO' || o.status === 'REPASSADO') && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Valor liberado</span>
                  )}
                  {isCompleted(o.status) && !o.reviewed && (
                    <button onClick={() => setReviewing(o)} className="btn-secondary text-xs flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Avaliar {side === 'purchases' ? 'vendedor' : 'comprador'}</button>
                  )}
                  {isCompleted(o.status) && o.reviewed && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Avaliado</span>
                  )}
                  {o.counterpartRating && o.counterpartRating.count > 0 && (
                    <span className="ml-auto"><Stars value={o.counterpartRating.average} count={o.counterpartRating.count} /></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          order={reviewing}
          side={side}
          onClose={() => setReviewing(null)}
          onSaved={() => { setReviewing(null); onReload(); }}
        />
      )}
    </div>
  );
}

// ─── Modal de avaliação ──────────────────────────────────────────────────────

function ReviewModal({ order, side, onClose, onSaved }: {
  order: Order; side: 'purchases' | 'sales'; onClose: () => void; onSaved: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const target = side === 'purchases' ? 'vendedor' : 'comprador';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/marketplace/orders/${order.id}/review`, { rating, comment: comment || undefined });
      toast.success('Avaliação enviada'); onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao avaliar');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Avaliar ${target}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Como foi sua experiência com "{order.product}"?</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}>
              <Star className={`h-8 w-8 transition ${i <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
        </div>
        <div>
          <label className="label">Comentário (opcional)</label>
          <textarea className="input min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte como foi a negociação, entrega, comunicação..." />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Enviando...' : 'Enviar avaliação'}</button>
      </form>
    </Modal>
  );
}

// ─── Modal de compra (escrow) ────────────────────────────────────────────────

function OrderModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const price = listing.pricePerUnit ?? 0;
  const qty = Number(quantity) || 0;
  const subtotal = qty * price;
  const buyerFee = subtotal * PARTY_FEE;
  const buyerTotal = subtotal + buyerFee;
  const maxQty = Number(listing.quantity);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) { toast.error('Informe a quantidade.'); return; }
    if (qty > maxQty) { toast.error(`Máximo disponível: ${maxQty} ${listing.unit}`); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/marketplace/orders', { listingId: listing.id, quantity: qty });
      if (data.paymentUrl) {
        toast.success('Redirecionando para o pagamento seguro...');
        window.location.href = data.paymentUrl;
      } else {
        toast.error('Não foi possível gerar o pagamento.');
        setSaving(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar pedido');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Comprar — ${listing.product}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex gap-2">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          Pagamento em custódia: o valor só é liberado ao vendedor após você confirmar o recebimento.
        </div>
        <div>
          <label className="label">Quantidade ({listing.unit}) · disponível: {maxQty.toLocaleString('pt-BR')}</label>
          <input type="number" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={`Até ${maxQty}`} />
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          <div className="flex justify-between p-3"><span className="text-gray-500 dark:text-gray-400">Preço unitário</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(price)}/{listing.unit}</span></div>
          <div className="flex justify-between p-3"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between p-3"><span className="text-gray-500 dark:text-gray-400">Taxa ConectCampo (0,5%)</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(buyerFee)}</span></div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800/40"><span className="font-semibold text-gray-900 dark:text-white">Total a pagar</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(buyerTotal)}</span></div>
        </div>
        <p className="text-xs text-gray-400">Pagamento processado via ValsaPay (PIX/cartão/boleto). O vendedor recebe {formatCurrency(subtotal - subtotal * PARTY_FEE)} após a confirmação.</p>
        <button type="submit" disabled={saving || qty <= 0} className="btn-primary w-full flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4" /> {saving ? 'Gerando pagamento...' : 'Pagar com ValsaPay'}
        </button>
      </form>
    </Modal>
  );
}

// ─── Modal de oferta ─────────────────────────────────────────────────────────

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
