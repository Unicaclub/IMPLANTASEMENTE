'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ProblemItem from './ProblemItem';
import type { BrowserProblemResponse, ProblemSeverity, ProblemType } from '@/types/browser';

interface Props {
  readonly problems: BrowserProblemResponse[];
}

const SEVERITIES: ProblemSeverity[] = ['critical', 'high', 'medium', 'low'];
const TYPES: ProblemType[] = ['console_error', 'request_failed', 'response_4xx', 'response_5xx', 'auth_redirect'];

export default function ProblemList({ problems }: Props) {
  const [sevFilter, setSevFilter] = useState<ProblemSeverity | ''>('');
  const [typeFilter, setTypeFilter] = useState<ProblemType | ''>('');

  const filtered = problems.filter(p => {
    if (sevFilter && p.severity !== sevFilter) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    return true;
  });

  if (problems.length === 0) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto text-coal-600 mb-3" size={32} />
        <p className="text-coal-400 text-sm">Nenhum problema detectado nesta run</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input-field w-40 text-xs" value={sevFilter} onChange={e => setSevFilter(e.target.value as ProblemSeverity | '')}>
          <option value="">Severidade</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field w-40 text-xs" value={typeFilter} onChange={e => setTypeFilter(e.target.value as ProblemType | '')}>
          <option value="">Tipo</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-[10px] text-coal-500">{filtered.length} de {problems.length}</span>
      </div>
      {filtered.map(p => <ProblemItem key={p.id} problem={p} />)}
    </div>
  );
}
