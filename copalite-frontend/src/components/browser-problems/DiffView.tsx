'use client';

import { Plus, Minus, ArrowRight } from 'lucide-react';
import ProblemItem from './ProblemItem';
import type { DiffResponse } from '@/types/browser';

interface Props {
  readonly diff: DiffResponse;
}

export default function DiffView({ diff }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center border-emerald-500/20">
          <p className="text-xl font-bold text-emerald-400">{diff.summary.resolved}</p>
          <p className="text-[10px] text-coal-500">Resolvidos</p>
        </div>
        <div className="card p-3 text-center border-coal-700">
          <p className="text-xl font-bold text-coal-300">{diff.summary.persistent}</p>
          <p className="text-[10px] text-coal-500">Persistentes</p>
        </div>
        <div className="card p-3 text-center border-rose-500/20">
          <p className="text-xl font-bold text-rose-400">{diff.summary.new}</p>
          <p className="text-[10px] text-coal-500">Novos</p>
        </div>
      </div>

      {/* New problems */}
      {diff.newProblems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Plus size={14} className="text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-400">Novos ({diff.newProblems.length})</h3>
          </div>
          <div className="space-y-2">
            {diff.newProblems.map(p => <ProblemItem key={p.id} problem={p} showFingerprint />)}
          </div>
        </div>
      )}

      {/* Resolved */}
      {diff.resolvedProblems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Minus size={14} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-400">Resolvidos ({diff.resolvedProblems.length})</h3>
          </div>
          <div className="space-y-2 opacity-70">
            {diff.resolvedProblems.map(p => <ProblemItem key={p.id} problem={p} showFingerprint />)}
          </div>
        </div>
      )}

      {/* Persistent */}
      {diff.persistentProblems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={14} className="text-coal-400" />
            <h3 className="text-sm font-semibold text-coal-400">Persistentes ({diff.persistentProblems.length})</h3>
          </div>
          <div className="space-y-2 opacity-80">
            {diff.persistentProblems.map(p => <ProblemItem key={p.id} problem={p} showFingerprint />)}
          </div>
        </div>
      )}

      {diff.summary.new === 0 && diff.summary.resolved === 0 && diff.summary.persistent === 0 && (
        <div className="card p-8 text-center">
          <p className="text-coal-400 text-sm">Nenhuma diferenca entre as runs</p>
        </div>
      )}
    </div>
  );
}
