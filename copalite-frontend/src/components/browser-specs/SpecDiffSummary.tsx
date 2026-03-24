'use client';

import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { DIFF_ASSESSMENT_LABELS, DIFF_ASSESSMENT_COLORS } from '@/types/browser';
import type { BrowserSpecResponse } from '@/types/browser';

interface Props {
  readonly diff: NonNullable<BrowserSpecResponse['diffSummary']>;
}

export default function SpecDiffSummary({ diff }: Props) {
  const AssessIcon = diff.assessment === 'improved' ? ArrowUp : diff.assessment === 'degraded' ? ArrowDown : ArrowRight;
  const color = DIFF_ASSESSMENT_COLORS[diff.assessment];

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AssessIcon size={16} className={color} />
        <h3 className="text-sm font-semibold text-coal-200">
          Comparacao: <span className={color}>{DIFF_ASSESSMENT_LABELS[diff.assessment]}</span>
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center card p-3 border-rose-500/20">
          <p className="text-xl font-bold text-rose-400">{diff.newCount}</p>
          <p className="text-[10px] text-coal-500">Novos</p>
        </div>
        <div className="text-center card p-3 border-emerald-500/20">
          <p className="text-xl font-bold text-emerald-400">{diff.resolvedCount}</p>
          <p className="text-[10px] text-coal-500">Resolvidos</p>
        </div>
        <div className="text-center card p-3">
          <p className="text-xl font-bold text-coal-300">{diff.persistentCount}</p>
          <p className="text-[10px] text-coal-500">Persistentes</p>
        </div>
      </div>

      {diff.notes.length > 0 && (
        <div>
          {diff.notes.map((n, i) => <p key={i} className="text-xs text-coal-400">• {n}</p>)}
        </div>
      )}

      {diff.impactedRoutes.length > 0 && (
        <div>
          <p className="text-[10px] text-coal-500 mb-1">Rotas impactadas:</p>
          {diff.impactedRoutes.map((r, i) => (
            <p key={i} className="text-[10px] text-coal-400 font-mono truncate">• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
