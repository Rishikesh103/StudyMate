import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  className = "",
}: StatCardProps) {
  return (
    <div className={`card stat-card ${className}`}>
      <div className="stat-card-header mb-4 flex justify-between items-start">
        <div className={`stat-icon-wrapper p-3 rounded-xl bg-${color}/10 text-${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`trend-badge flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${trend.isPositive ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="stat-content">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
