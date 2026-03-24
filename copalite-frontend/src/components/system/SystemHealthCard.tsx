'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/time';
import type { SystemHealthResponse } from '@/types/system-health';

const STATUS_BADGE: Record<string, string> = {
  healthy: 'badge-success',
  degraded: 'badge-warning',
  down: 'badge-danger',
};

interface Props {
  readonly check: SystemHealthResponse;
}

export default function SystemHealthCard({ check }: Props) {
  const [expanded, setExpanded] = useState(false);
  const badge = STATUS_BADGE[check.status] ?? 'badge-neutral';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-coal-100">{check.componentName}</h3>
        <span className={`text-[10px] ${badge}`}>{check.status}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-coal-500">
        <span className="badge-neutral text-[10px]">{check.componentType}</span>
        <span>{formatRelativeTime(check.checkedAt)}</span>
      </div>
      {check.detailsJson && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-coal-500 hover:text-coal-300"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Detalhes
          </button>
          {expanded && (
            <pre className="mt-2 text-[10px] text-coal-400 bg-coal-900 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(check.detailsJson, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
