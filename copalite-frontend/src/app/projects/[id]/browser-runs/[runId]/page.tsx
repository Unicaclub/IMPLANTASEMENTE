'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Globe, Loader2, AlertTriangle, RotateCw, Camera, Code2, Wifi, Terminal, MousePointer, ShieldAlert, FileText, Download, Save, History } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ProblemSummaryCards from '@/components/browser-problems/ProblemSummaryCards';
import ProblemList from '@/components/browser-problems/ProblemList';
import SpecRunSummary from '@/components/browser-specs/SpecRunSummary';
import SpecPageSummaries from '@/components/browser-specs/SpecPageSummaries';
import SpecTruthBoundaries from '@/components/browser-specs/SpecTruthBoundaries';
import SpecDiffSummary from '@/components/browser-specs/SpecDiffSummary';
import { api } from '@/lib/api';
import { RUN_STATUS_BADGE, EVIDENCE_KIND_LABELS } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserRunResponse, BrowserEvidenceResponse, BrowserProblemResponse, ProblemSummaryResponse, BrowserSpecResponse, SavedSpecResponse, EvidenceKind } from '@/types/browser';

const KIND_ICONS: Record<EvidenceKind, typeof Camera> = {
  screenshot: Camera, dom: Code2, request: Wifi, response: Wifi, console: Terminal, action: MousePointer,
};

export default function BrowserRunDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const runId = params?.runId as string;
  const [run, setRun] = useState<BrowserRunResponse | null>(null);
  const [evidences, setEvidences] = useState<BrowserEvidenceResponse[]>([]);
  const [problems, setProblems] = useState<BrowserProblemResponse[]>([]);
  const [summary, setSummary] = useState<ProblemSummaryResponse | null>(null);
  const [spec, setSpec] = useState<BrowserSpecResponse | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [baseRunId, setBaseRunId] = useState('');
  const [allRuns, setAllRuns] = useState<BrowserRunResponse[]>([]);
  const [specHistory, setSpecHistory] = useState<SavedSpecResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'spec' | 'problems' | 'evidence'>('spec');

  useEffect(() => { loadData(); }, [runId]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      const [r, e, p, s] = await Promise.all([
        api.getBrowserRun(runId),
        api.listBrowserEvidence(runId),
        api.listBrowserProblems(runId),
        api.getBrowserProblemSummary(runId).catch(() => null),
      ]);
      setRun(r); setEvidences(e); setProblems(p); setSummary(s);

      // Load spec
      loadSpec();

      // Load other runs for diff selector
      if (r.projectId) {
        const runs = await api.listBrowserRuns(r.projectId);
        setAllRuns(runs.filter((br: BrowserRunResponse) => br.status === 'completed' && br.id !== runId));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar detalhes');
    } finally { setLoading(false); }
  }

  async function loadSpec(base?: string) {
    setSpecLoading(true); setSpecError(null);
    try {
      const [s, h] = await Promise.all([
        api.getBrowserSpec(runId, base || undefined),
        api.listSpecHistory(runId),
      ]);
      setSpec(s);
      setSpecHistory(h);
    } catch (err: unknown) {
      setSpecError(err instanceof Error ? err.message : 'Falha ao gerar spec');
    } finally { setSpecLoading(false); }
  }

  async function handleSaveSpec() {
    setSaving(true);
    try {
      await api.saveBrowserSpec(runId, baseRunId || undefined);
      setSpecHistory(await api.listSpecHistory(runId));
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function handleBaseRunChange(id: string) {
    setBaseRunId(id);
    loadSpec(id || undefined);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title={run?.journeyName || run?.module || 'Browser Run'} subtitle={run ? `${run.stepsCount} steps, ${run.evidencesCount} evidencias` : ''} />
        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={loadData} className="btn-secondary mt-4 gap-2"><RotateCw size={14} /> Tentar novamente</button>
            </div>
          )}
          {!error && loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : run && (
            <>
              {/* Run info */}
              <div className="card p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><p className="text-[10px] text-coal-500 uppercase">Status</p><span className={`text-xs ${RUN_STATUS_BADGE[run.status]}`}>{run.status}</span></div>
                  <div><p className="text-[10px] text-coal-500 uppercase">Target</p><p className="text-xs text-coal-200">{run.target?.name || '—'}</p></div>
                  <div><p className="text-[10px] text-coal-500 uppercase">Inicio</p><p className="text-xs text-coal-200">{run.startedAt ? formatRelativeTime(run.startedAt) : '—'}</p></div>
                  <div><p className="text-[10px] text-coal-500 uppercase">Fim</p><p className="text-xs text-coal-200">{run.finishedAt ? formatRelativeTime(run.finishedAt) : '—'}</p></div>
                </div>
                {run.errorMessage && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <p className="text-xs text-rose-400 font-mono">{run.errorMessage}</p>
                  </div>
                )}
              </div>

              {summary && summary.total > 0 && <ProblemSummaryCards summary={summary} />}

              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button onClick={() => setTab('spec')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'spec' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'}`}>
                  <FileText size={12} className="inline mr-1" /> Spec
                </button>
                <button onClick={() => setTab('problems')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'problems' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'}`}>
                  <ShieldAlert size={12} className="inline mr-1" /> Problemas ({problems.length})
                </button>
                <button onClick={() => setTab('evidence')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'evidence' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'}`}>
                  <Camera size={12} className="inline mr-1" /> Evidencias ({evidences.length})
                </button>
              </div>

              {/* === SPEC TAB === */}
              {tab === 'spec' && (
                <div className="space-y-6">
                  {/* Diff selector */}
                  {allRuns.length > 0 && (
                    <div className="card p-3">
                      <label className="text-xs text-coal-400 mr-2">Comparar com run anterior:</label>
                      <select className="input-field w-64 text-xs inline-block" value={baseRunId} onChange={e => handleBaseRunChange(e.target.value)}>
                        <option value="">Sem comparacao</option>
                        {allRuns.map(r => (
                          <option key={r.id} value={r.id}>{r.journeyName || 'Run'} — {formatRelativeTime(r.createdAt)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Actions: Save + Export */}
                  {!specLoading && spec && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={handleSaveSpec} disabled={saving} className="btn-secondary gap-2 text-xs">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Salvar v{specHistory.length > 0 ? specHistory[0].version + 1 : 1}
                        </button>
                        {specHistory.length > 0 && (
                          <span className="text-[10px] text-coal-500">
                            <History size={10} className="inline mr-1" />
                            {specHistory.length} versao(es) salva(s)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/browser-specs/by-run/${runId}/markdown${baseRunId ? '?baseRunId=' + baseRunId : ''}`}
                          target="_blank" rel="noreferrer" className="btn-secondary gap-2 text-xs">
                          <Download size={14} /> Markdown
                        </a>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/browser-specs/by-run/${runId}/pdf${baseRunId ? '?baseRunId=' + baseRunId : ''}`}
                          target="_blank" rel="noreferrer" className="btn-primary gap-2 text-xs">
                          <Download size={14} /> PDF
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Version history */}
                  {specHistory.length > 0 && (
                    <div className="card p-3">
                      <p className="text-[10px] text-coal-500 mb-2">Historico de versoes</p>
                      <div className="space-y-1">
                        {specHistory.map(h => (
                          <div key={h.id} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="badge-info text-[9px]">v{h.version}</span>
                              <span className="text-coal-400">{h.specName || 'sem nome'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-coal-500">{h.problemsCount} prob</span>
                              <span className="text-coal-600">{formatRelativeTime(h.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {specLoading && <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-coal-500" size={24} /></div>}

                  {specError && (
                    <div className="card p-6 text-center border-rose-500/20">
                      <AlertTriangle className="mx-auto text-rose-400 mb-2" size={20} />
                      <p className="text-rose-400 text-xs">{specError}</p>
                    </div>
                  )}

                  {!specLoading && !specError && spec && (
                    <>
                      <SpecRunSummary spec={spec} />
                      {spec.diffSummary && <SpecDiffSummary diff={spec.diffSummary} />}
                      <SpecPageSummaries pages={spec.pageSummaries} />
                      <SpecTruthBoundaries truth={spec.truthBoundaries} />
                    </>
                  )}

                  {!specLoading && !specError && !spec && (
                    <div className="card p-8 text-center">
                      <FileText className="mx-auto text-coal-600 mb-3" size={32} />
                      <p className="text-coal-400 text-sm">Spec nao disponivel para esta run</p>
                    </div>
                  )}
                </div>
              )}

              {/* === PROBLEMS TAB === */}
              {tab === 'problems' && <ProblemList problems={problems} />}

              {/* === EVIDENCE TAB === */}
              {tab === 'evidence' && (
                evidences.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Globe className="mx-auto text-coal-600 mb-3" size={32} />
                    <p className="text-coal-400 text-sm">Nenhuma evidencia</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evidences.map((ev) => {
                      const Icon = KIND_ICONS[ev.kind] ?? Globe;
                      return (
                        <div key={ev.id} className="card p-4 animate-fade-in">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-coal-600 w-6 text-right">#{ev.stepIndex}</span>
                              <div className="p-1.5 rounded bg-coal-800/50"><Icon size={14} className="text-coal-400" /></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="badge-neutral text-[10px]">{EVIDENCE_KIND_LABELS[ev.kind]}</span>
                                {ev.action && <span className="text-xs text-coal-200">{ev.action}</span>}
                              </div>
                              {ev.route && <p className="text-[10px] text-coal-500 font-mono truncate">{ev.route}</p>}
                              <span className="text-[9px] text-coal-600">{formatRelativeTime(ev.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
