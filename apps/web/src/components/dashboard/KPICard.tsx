import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'cyan';
}

const colorMap = {
  green: 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400',
  blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
  amber: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
  red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
};

export function KPICard({ title, value, subtitle, icon, trend, color = 'green' }: KPICardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 inline-flex items-center text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
