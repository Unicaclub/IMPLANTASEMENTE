'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { GitCompare, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ComparisonCard from '@/components/comparison/ComparisonCard';
import ComparisonSummaryCards from '@/components/comparison/ComparisonSummaryCards';
import { useComparisons } from '@/hooks/useComparisons';
import {
  COMPARISON_TYPE_LABELS,
  COMPARISON_RESULT_LABELS,
} from '@/types/comparison';
import type { ComparisonType, ComparisonResult, ComparisonSummary } from '@/types/comparison';

const COMPARISON_TYPES: ComparisonType[] = ['doc_vs_code', 'ui_vs_api', 'schema_vs_backend', 'expected_vs_found'];
const RESULT_STATUSES: ComparisonResult[] = ['match', 'partial_match', 'divergence', 'missing', 'inconclusive'];

export default function ComparisonsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [typeFilter, setTypeFilter] = useState<ComparisonType | ''>('');
  const [resultFilter, setResultFilter] = useState<ComparisonResult | ''>('');

  const filters = {
    ...(typeFilter ? { comparisonType: typeFilter } : {}),
    ...(resultFilter ? { resultStatus: resultFilter } : {}),
  };
  const { comparisons, loading, error, refetch } = useComparisons(projectId, filters);

  // Build summary from data client-side
  const summary: ComparisonSummary = {
    total: comparisons.length,
    byResult: {
      match: comparisons.filter(c => c.resultStatus === 'match').length,
      partial_match: comparisons.filter(c => c.resultStatus === 'partial_match').length,
      divergence: comparisons.filter(c => c.resultStatus === 'divergence').length,
      missing: comparisons.filter(c => c.resultStatus === 'missing').length,
      inconclusive: comparisons.filter(c => c.resultStatus === 'inconclusive').length,
    },
    diffsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
  };

  // Count severity from all diffs
  for (const c of comparisons) {
    if (c.diffs) {
      for (const d of c.diffs) {
        if (d.severity in summary.diffsBySeverity) {
          summary.diffsBySeverity[d.severity]++;
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Comparações"
          subtitle="Confronto entre documentação, código e registros"
        />

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          {!loading && !error && comparisons.length > 0 && (
            <ComparisonSummaryCards summary={summary} />
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="input-field w-48"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ComparisonType | '')}
            >
              <option value="">Todos os tipos</option>
              {COMPARISON_TYPES.map((t) => (
                <option key={t} value={t}>{COMPARISON_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              className="input-field w-48"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as ComparisonResult | '')}
            >
              <option value="">Todos os resultados</option>
              {RESULT_STATUSES.map((r) => (
                <option key={r} value={r}>{COMPARISON_RESULT_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={refetch} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : !error && comparisons.length === 0 ? (
            <div className="card p-12 text-center">
              <GitCompare className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma comparação encontrada</p>
              <p className="text-xs text-coal-500 mt-1">Execute uma run de comparação para confrontar artefatos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comparisons.map((comp) => (
                <ComparisonCard key={comp.id} comparison={comp} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
