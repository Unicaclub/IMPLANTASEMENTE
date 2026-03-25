'use client';

import { PROBLEM_SEVERITY_BADGE, PROBLEM_TYPE_LABELS, SEVERITY_LABELS } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserProblemResponse } from '@/types/browser';

interface Props {
  readonly problem: BrowserProblemResponse;
  readonly showFingerprint?: boolean;
}

export default function ProblemItem({ problem, showFingerprint }: Props) {
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${PROBLEM_SEVERITY_BADGE[problem.severity]}`}>
              {SEVERITY_LABELS[problem.severity]}
            </span>
            <span className="badge-neutral text-[10px]">{PROBLEM_TYPE_LABELS[problem.type]}</span>
          </div>
          <p className="text-xs text-coal-200 mt-1 line-clamp-2">{problem.summary}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-coal-500 font-mono truncate max-w-[300px]">{problem.route}</span>
            <span className="text-[10px] text-coal-600">{formatRelativeTime(problem.createdAt)}</span>
          </div>
          {showFingerprint && (
            <span className="text-[9px] text-coal-700 font-mono mt-1 block">{problem.fingerprint.substring(0, 16)}...</span>
          )}
        </div>
      </div>
    </div>
  );
}
