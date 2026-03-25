'use client';

import { PAGE_ASSESSMENT_BADGE, PAGE_ASSESSMENT_LABELS, SEVERITY_LABELS } from '@/types/browser';
import type { PageSpec } from '@/types/browser';

interface Props {
  readonly pages: PageSpec[];
}

export default function SpecPageSummaries({ pages }: Props) {
  if (pages.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-coal-200">Paginas ({pages.length})</h3>
      {pages.map((p, i) => (
        <div key={i} className="card p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-coal-200 font-mono truncate max-w-[400px]">{p.route}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${PAGE_ASSESSMENT_BADGE[p.assessment]}`}>
              {PAGE_ASSESSMENT_LABELS[p.assessment]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-coal-500">
            <span>{p.evidencesCount} ev</span>
            <span>{p.problemsCount} prob</span>
            {p.maxSeverity && <span>{SEVERITY_LABELS[p.maxSeverity]}</span>}
            {p.problemTypes.length > 0 && <span>{p.problemTypes.join(', ')}</span>}
          </div>
          {p.notes.length > 0 && (
            <div className="mt-1">
              {p.notes.map((n, j) => <p key={j} className="text-[10px] text-coal-400">{n}</p>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
