import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
  subtitle?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

const colorMap = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-500' },
  sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', icon: 'text-sky-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-500' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'text-rose-500' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'text-violet-500' },
};

export default function MetricCard({ label, value, icon: Icon, color = 'emerald', subtitle, delay = 0 }: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={clsx('card p-5 animate-slide-up', c.bg, c.border)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-coal-400 font-medium">{label}</p>
          <p className={clsx('text-3xl font-bold mt-1 tracking-tight', c.text)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-coal-500 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-xl', c.bg)}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </div>
  );
}
