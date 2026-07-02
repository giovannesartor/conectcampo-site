'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, RotateCcw, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Spinner, PageHeader } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

interface OrderEvent { id: string; type: string; description: string; createdAt: string }
interface Dispute {
  id: string; product: string; quantity: number; unit: string; subtotal: number;
  buyerTotal: number; sellerNet: number; disputeReason: string | null; createdAt: string;
  buyer?: { name: string; email: string }; seller?: { name: string; email: string };
  events?: OrderEvent[];
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/marketplace/orders/admin/disputes')
      .then((r) => setDisputes(r.data))
      .catch(() => toast.error('Não foi possível carregar as disputas.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const release = async (id: string) => {
    if (!confirm('Liberar o valor ao vendedor (resolver a favor do vendedor)?')) return;
    try { await api.patch(`/marketplace/orders/${id}/confirm`, {}); toast.success('Liberado ao vendedor'); load(); }
    catch { toast.error('Erro'); }
  };
  const refund = async (id: string) => {
    if (!confirm('Reembolsar o comprador (resolver a favor do comprador)?')) return;
    try { await api.patch(`/marketplace/orders/${id}/refund`, {}); toast.success('Comprador reembolsado'); load(); }
    catch { toast.error('Erro'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Disputas do Marketplace" subtitle="Fila de disputas para mediação" icon={<AlertTriangle className="h-6 w-6 text-red-500" />} />

      {disputes.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nenhuma disputa aberta" description="Tudo tranquilo — não há pedidos em disputa no momento." />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="card border-l-4 border-l-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{d.product} · {Number(d.quantity).toLocaleString('pt-BR')} {d.unit}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Comprador: {d.buyer?.name} ({d.buyer?.email}) · Vendedor: {d.seller?.name} ({d.seller?.email})
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(d.subtotal)}</span>
              </div>

              {d.disputeReason && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
                  <strong>Motivo:</strong> {d.disputeReason}
                </div>
              )}

              {d.events && d.events.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Histórico</p>
                  <ul className="space-y-1">
                    {d.events.map((e) => (
                      <li key={e.id} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-gray-700 dark:text-gray-300">{e.type}</strong> — {e.description} · {formatDateTime(e.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={() => release(d.id)} className="btn-primary text-xs flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Liberar ao vendedor
                </button>
                <button onClick={() => refund(d.id)} className="btn-secondary text-xs flex items-center gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Reembolsar comprador
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
