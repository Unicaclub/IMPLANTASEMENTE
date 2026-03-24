'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, GitCompare } from 'lucide-react';
import DiffCard from './DiffCard';
import {
  COMPARISON_TYPE_LABELS,
  COMPARISON_RESULT_LABELS,
  COMPARISON_RESULT_COLORS,
} from '@/types/comparison';
import type { ComparisonResponse } from '@/types/comparison';

interface Props {
  readonly comparison: ComparisonResponse;
}

export default function ComparisonCard({ comparison }: Props) {
  const [expanded, setExpanded] = useState(false);

  const diffCount = comparison.diffs?.length ?? 0;

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-coal-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown size={14} className="text-coal-500 shrink-0" /> : <ChevronRight size={14} className="text-coal-500 shrink-0" />}
          <GitCompare size={14} className="text-coal-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-medium text-coal-100 block truncate">
              {comparison.sourceARef} → {comparison.sourceBRef}
            </span>
            <span className="text-[10px] text-coal-500">
              {COMPARISON_TYPE_LABELS[comparison.comparisonType] ?? comparison.comparisonType}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {diffCount > 0 && (
            <span className="text-[10px] text-coal-500">{diffCount} diffs</span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${COMPARISON_RESULT_COLORS[comparison.resultStatus]}`}>
            {COMPARISON_RESULT_LABELS[comparison.resultStatus]}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-coal-800/50 px-4 py-3 space-y-3">
          {comparison.summary && (
            <p className="text-xs text-coal-400">{comparison.summary}</p>
          )}
          {comparison.diffs && comparison.diffs.length > 0 ? (
            comparison.diffs.map(d => <DiffCard key={d.id} diff={d} />)
          ) : (
            <p className="text-xs text-coal-500 italic">Nenhuma divergência registrada</p>
          )}
        </div>
      )}
    </div>
  );
}
