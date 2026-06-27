import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'brand' | 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'cyan';
}

const colorMap = {
  brand:  'bg-brand-100 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400',
  green:  'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400',
  blue:   'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
  amber:  'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
  red:    'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
  cyan:   'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
};

export function KPICard({ title, value, subtitle, icon, trend, color = 'brand' }: KPICardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 inline-flex items-center text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-2 sm:p-3 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
