'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#06b6d4', '#ef4444'];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// Format BRL for tooltips
function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface RevenueChartProps {
  data: { month: string; commissions: number; subscriptions: number }[];
}

export function RevenueAreaChart({ data }: RevenueChartProps) {
  return (
    <ChartCard title="Receita Mensal" subtitle="Comissões vs Assinaturas">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatBRL(value),
              name === 'commissions' ? 'Comissões' : 'Assinaturas',
            ]}
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value) =>
              value === 'commissions' ? 'Comissões' : 'Assinaturas'
            }
          />
          <Area
            type="monotone"
            dataKey="commissions"
            stroke="#16a34a"
            fillOpacity={1}
            fill="url(#colorComm)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="subscriptions"
            stroke="#2563eb"
            fillOpacity={1}
            fill="url(#colorSubs)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface OperationsChartProps {
  data: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  SCORING: 'Scoring',
  MATCHING: 'Matching',
  PROPOSALS_RECEIVED: 'Propostas',
  ACCEPTED: 'Aceita',
  IN_ANALYSIS: 'Análise',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CONTRACTED: 'Contratada',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export function OperationsBarChart({ data }: OperationsChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] || d.status,
  }));

  return (
    <ChartCard title="Operações por Status" subtitle="Distribuição atual">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Operações" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PieChartData {
  name: string;
  value: number;
}

export function UsersPieChart({ data }: { data: PieChartData[] }) {
  const ROLE_LABELS: Record<string, string> = {
    PRODUCER: 'Produtor',
    COMPANY: 'Empresa',
    FINANCIAL_INSTITUTION: 'Inst. Financeira',
    CREDIT_ANALYST: 'Analista',
    ADMIN: 'Admin',
  };

  const labeled = data.map((d) => ({
    ...d,
    label: ROLE_LABELS[d.name] || d.name,
  }));

  return (
    <ChartCard title="Usuários por Perfil" subtitle="Composição da base">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={labeled}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            nameKey="label"
          >
            {labeled.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface GMVChartProps {
  data: { month: string; volume: number; count: number }[];
}

export function GMVChart({ data }: GMVChartProps) {
  return (
    <ChartCard title="Volume Mensal (GMV)" subtitle="Valor total das operações por mês">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            formatter={(value: number) => [formatBRL(value), 'Volume']}
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="volume" fill="#9333ea" radius={[4, 4, 0, 0]} name="Volume (R$)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
