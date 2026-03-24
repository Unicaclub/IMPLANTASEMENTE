'use client';

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { HEALTH_STATUS_BG, HEALTH_STATUS_LABELS } from '@/types/system-health';
import type { HealthStatus } from '@/types/system-health';

const STATUS_ICONS: Record<HealthStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  unknown: HelpCircle,
};

const STATUS_MESSAGES: Record<HealthStatus, string> = {
  healthy: 'Todos os componentes operacionais',
  degraded: 'Alguns componentes com latência elevada',
  down: 'Componentes fora do ar detectados',
  unknown: 'Verificando estado do sistema...',
};

interface Props {
  readonly status: HealthStatus;
}

export default function HealthStatusBanner({ status }: Props) {
  const Icon = STATUS_ICONS[status] ?? HelpCircle;
  const bg = HEALTH_STATUS_BG[status] ?? HEALTH_STATUS_BG.unknown;

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
      <Icon size={20} />
      <div>
        <p className="text-sm font-semibold">{HEALTH_STATUS_LABELS[status]}</p>
        <p className="text-xs opacity-80">{STATUS_MESSAGES[status]}</p>
      </div>
    </div>
  );
}
