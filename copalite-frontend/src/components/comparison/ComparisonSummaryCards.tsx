'use client';

import { GitCompare, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { ComparisonSummary } from '@/types/comparison';

interface Props {
  readonly summary: ComparisonSummary;
}

export default function ComparisonSummaryCards({ summary }: Props) {
  const criticalDiffs = (summary.diffsBySeverity?.critical ?? 0) + (summary.diffsBySeverity?.high ?? 0);
  const divergences = (summary.byResult?.divergence ?? 0) + (summary.byResult?.partial_match ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare size={16} className="text-coal-400" />
          <span className="text-xs text-coal-500">Total de Comparações</span>
        </div>
        <span className="text-2xl font-bold text-coal-100">{summary.total}</span>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-xs text-coal-500">Divergências</span>
        </div>
        <span className="text-2xl font-bold text-amber-400">{divergences}</span>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertOctagon size={16} className="text-red-400" />
          <span className="text-xs text-coal-500">Diffs Críticos</span>
        </div>
        <span className="text-2xl font-bold text-red-400">{criticalDiffs}</span>
      </div>
    </div>
  );
}
