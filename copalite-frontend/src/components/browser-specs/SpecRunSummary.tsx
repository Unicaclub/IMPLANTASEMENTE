'use client';

import { SEVERITY_LABELS, PROBLEM_SEVERITY_BADGE } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserSpecResponse } from '@/types/browser';

interface Props {
  readonly spec: BrowserSpecResponse;
}

export default function SpecRunSummary({ spec }: Props) {
  const s = spec.runSummary;
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-coal-100">Resumo da Run</h3>
        <span className="text-[10px] text-coal-600">Gerado {formatRelativeTime(spec.generatedAt)}</span>
      </div>
      <p className="text-xs text-coal-300">{s.overallAssessment}</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
        <div className="text-center">
          <p className="text-xl font-bold text-coal-100">{s.pagesVisited}</p>
          <p className="text-[10px] text-coal-500">Paginas</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-coal-100">{s.evidencesCount}</p>
          <p className="text-[10px] text-coal-500">Evidencias</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-400">{s.problemsCount}</p>
          <p className="text-[10px] text-coal-500">Problemas</p>
        </div>
        <div className="text-center">
          {s.maxSeverity ? (
            <p className={`text-xl font-bold ${PROBLEM_SEVERITY_BADGE[s.maxSeverity]?.includes('rose') ? 'text-rose-400' : PROBLEM_SEVERITY_BADGE[s.maxSeverity]?.includes('orange') ? 'text-orange-400' : 'text-amber-400'}`}>
              {SEVERITY_LABELS[s.maxSeverity]}
            </p>
          ) : (
            <p className="text-xl font-bold text-emerald-400">OK</p>
          )}
          <p className="text-[10px] text-coal-500">Max Severidade</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-coal-300">{s.targetName}</p>
          <p className="text-[10px] text-coal-500">Target</p>
        </div>
      </div>
    </div>
  );
}
