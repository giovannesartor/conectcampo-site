'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Satellite, CalendarClock, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface Card {
  label: string;
  value: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  alert?: boolean;
}

export function AgroOverview() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    const safe = (p: Promise<any>) => p.then((r) => r.data).catch(() => null);
    Promise.all([
      safe(api.get('/ndvi/overview')),
      safe(api.get('/calendar/summary')),
      safe(api.get('/marketplace/orders/summary')),
      safe(api.get('/quotes/production-value')),
    ]).then(([ndvi, cal, orders, prod]) => {
      const critical = ndvi?.plots?.filter((p: any) => ['CRITICO', 'ATENCAO'].includes(p.health?.status)).length ?? 0;
      const monitored = ndvi?.plots?.length ?? 0;
      const result: Card[] = [
        {
          label: 'Saúde da lavoura',
          value: monitored ? `${monitored} talhões` : '—',
          sub: critical ? `${critical} requer atenção` : 'tudo saudável',
          href: '/dashboard/ndvi',
          icon: <Satellite className="h-5 w-5" />,
          alert: critical > 0,
        },
        {
          label: 'Vencimentos (30d)',
          value: cal ? String(cal.countProximos30 ?? 0) : '—',
          sub: cal?.countAtrasado ? `${cal.countAtrasado} atrasado(s)` : 'em dia',
          href: '/dashboard/calendar',
          icon: <CalendarClock className="h-5 w-5" />,
          alert: (cal?.countAtrasado ?? 0) > 0,
        },
        {
          label: 'Pedidos marketplace',
          value: orders ? String((orders.totalPurchases ?? 0) + (orders.totalSales ?? 0)) : '—',
          sub: orders?.heldForYou ? `${formatCurrency(orders.heldForYou)} em custódia` : undefined,
          href: '/dashboard/marketplace',
          icon: <ShoppingCart className="h-5 w-5" />,
        },
        {
          label: 'Valor da produção',
          value: prod?.totalValue ? formatCurrency(prod.totalValue) : '—',
          sub: 'a preço de mercado',
          href: '/dashboard/quotes',
          icon: <DollarSign className="h-5 w-5" />,
        },
      ];
      setCards(result);
    });
  }, []);

  if (!cards) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="card card-hover group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.alert ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' : 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'}`}>
              {c.icon}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
            {c.sub && <p className={`text-[11px] mt-0.5 ${c.alert ? 'text-amber-600' : 'text-gray-400'}`}>{c.sub}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
