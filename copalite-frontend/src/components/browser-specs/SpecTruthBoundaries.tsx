'use client';

import { CheckCircle2, HelpCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  readonly truth: {
    observedFacts: string[];
    inferredPoints: string[];
    unknowns: string[];
    doNotClaim: string[];
  };
}

export default function SpecTruthBoundaries({ truth }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-coal-200">Limites da Verdade</h3>

      <div className="card p-4 border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Fatos Observados ({truth.observedFacts.length})</span>
        </div>
        <ul className="space-y-1">
          {truth.observedFacts.map((f, i) => <li key={i} className="text-[11px] text-coal-300">• {f}</li>)}
        </ul>
      </div>

      {truth.inferredPoints.length > 0 && (
        <div className="card p-4 border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Inferencias ({truth.inferredPoints.length})</span>
          </div>
          <ul className="space-y-1">
            {truth.inferredPoints.map((f, i) => <li key={i} className="text-[11px] text-coal-400">• {f}</li>)}
          </ul>
        </div>
      )}

      {truth.unknowns.length > 0 && (
        <div className="card p-4 border-coal-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-coal-500" />
            <span className="text-xs font-semibold text-coal-500">Desconhecidos ({truth.unknowns.length})</span>
          </div>
          <ul className="space-y-1">
            {truth.unknowns.map((f, i) => <li key={i} className="text-[11px] text-coal-500">• {f}</li>)}
          </ul>
        </div>
      )}

      <div className="card p-4 border-rose-500/20">
        <div className="flex items-center gap-2 mb-2">
          <XCircle size={14} className="text-rose-400" />
          <span className="text-xs font-semibold text-rose-400">Nao Afirmar ({truth.doNotClaim.length})</span>
        </div>
        <ul className="space-y-1">
          {truth.doNotClaim.map((f, i) => <li key={i} className="text-[11px] text-coal-400">• {f}</li>)}
        </ul>
      </div>
    </div>
  );
}
