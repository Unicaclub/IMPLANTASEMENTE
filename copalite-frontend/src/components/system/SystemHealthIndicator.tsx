'use client';

import { useSystemHealth } from '@/hooks/useSystemHealth';
import { HEALTH_DOT_COLORS, HEALTH_STATUS_LABELS } from '@/types/system-health';
import type { HealthStatus } from '@/types/system-health';

export default function SystemHealthIndicator() {
  const { overallStatus } = useSystemHealth();
  const dotColor = HEALTH_DOT_COLORS[overallStatus] ?? HEALTH_DOT_COLORS.unknown;
  const label = HEALTH_STATUS_LABELS[overallStatus] ?? 'Desconhecido';
  const shouldPulse = overallStatus === 'degraded' || overallStatus === 'down';

  return (
    <div className="flex items-center gap-2" title={`Sistema: ${label}`}>
      <span className="relative flex h-2.5 w-2.5">
        {shouldPulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
      </span>
      <span className="text-xs text-coal-400">{label}</span>
    </div>
  );
}
