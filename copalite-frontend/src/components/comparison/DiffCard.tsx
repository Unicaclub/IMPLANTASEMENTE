'use client';

import { DIFF_SEVERITY_LABELS, DIFF_SEVERITY_COLORS } from '@/types/comparison';
import type { DiffResponse } from '@/types/comparison';

interface Props {
  readonly diff: DiffResponse;
}

export default function DiffCard({ diff }: Props) {
  return (
    <div className="border border-coal-800/50 rounded p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-coal-200">{diff.title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${DIFF_SEVERITY_COLORS[diff.severity]}`}>
          {DIFF_SEVERITY_LABELS[diff.severity]}
        </span>
      </div>
      {diff.description && (
        <p className="text-xs text-coal-400 mt-1">{diff.description}</p>
      )}
    </div>
  );
}
