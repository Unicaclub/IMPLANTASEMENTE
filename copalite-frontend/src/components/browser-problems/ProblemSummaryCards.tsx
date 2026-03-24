'use client';

import { AlertTriangle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';
import type { ProblemSummaryResponse } from '@/types/browser';

interface Props {
  readonly summary: ProblemSummaryResponse;
}

export default function ProblemSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="card p-3 text-center">
        <p className="text-2xl font-bold text-coal-100">{summary.total}</p>
        <p className="text-[10px] text-coal-500">Total</p>
      </div>
      <div className="card p-3 text-center border-rose-500/20">
        <p className="text-2xl font-bold text-rose-400">{summary.bySeverity?.critical || 0}</p>
        <p className="text-[10px] text-coal-500">Critico</p>
      </div>
      <div className="card p-3 text-center border-orange-500/20">
        <p className="text-2xl font-bold text-orange-400">{summary.bySeverity?.high || 0}</p>
        <p className="text-[10px] text-coal-500">Alto</p>
      </div>
      <div className="card p-3 text-center border-amber-500/20">
        <p className="text-2xl font-bold text-amber-400">{summary.bySeverity?.medium || 0}</p>
        <p className="text-[10px] text-coal-500">Medio</p>
      </div>
      <div className="card p-3 text-center">
        <p className="text-2xl font-bold text-coal-400">{summary.bySeverity?.low || 0}</p>
        <p className="text-[10px] text-coal-500">Baixo</p>
      </div>
    </div>
  );
}
