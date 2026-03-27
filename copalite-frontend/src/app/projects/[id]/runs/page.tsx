'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Play, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, AlertTriangle, RotateCw, Bot, FileText } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function RunsPage() {
  const { id: projectId } = useParams() as { id: string };
  const [runs, setRuns] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, any[]>>({});
  const [runDetails, setRunDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      setRuns(await api.listRuns(projectId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const toggleRun = async (runId: string) => {
    if (expandedRun === runId) { setExpandedRun(null); return; }
    setExpandedRun(runId);
    try {
      const [s, status] = await Promise.all([
        steps[runId] ? Promise.resolve(steps[runId]) : api.getRunSteps(runId),
        runDetails[runId] ? Promise.resolve(runDetails[runId]) : api.getPipelineStatus(runId),
      ]);
      if (!steps[runId]) setSteps(prev => ({ ...prev, [runId]: s }));
      if (!runDetails[runId]) setRunDetails(prev => ({ ...prev, [runId]: status }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Runs" subtitle="Execution history" />
        <div className="p-8">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadData(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-coal-500" size={32} /></div>
          ) : runs.length === 0 ? (
            <div className="card p-12 text-center">
              <Play className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No runs yet. Start one from Orchestration.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="card overflow-hidden">
                  <button
                    onClick={() => toggleRun(run.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-coal-800/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <Play size={18} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-coal-100">{run.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-coal-500 font-mono">{run.runType}</span>
                          <span className="text-xs text-coal-600">·</span>
                          <span className="text-xs text-coal-500">
                            {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={run.status} />
                      <ChevronDown
                        size={16}
                        className={`text-coal-500 transition-transform ${expandedRun === run.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {expandedRun === run.id && (
                    <div className="px-5 pb-5 border-t border-coal-800/60">
                      <p className="text-sm text-coal-400 py-3">{run.goal}</p>

                      {/* Run summary info */}
                      {runDetails[run.id] && (
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-coal-800/40 rounded-lg p-3">
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Progress</p>
                            <p className="text-sm font-bold text-coal-200 mt-1">
                              {runDetails[run.id].progress?.completed ?? 0} / {runDetails[run.id].progress?.total ?? 0} steps
                            </p>
                          </div>
                          <div className="bg-coal-800/40 rounded-lg p-3">
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Type</p>
                            <p className="text-sm font-bold text-coal-200 mt-1">{run.runType?.replace(/_/g, ' ')}</p>
                          </div>
                          <div className="bg-coal-800/40 rounded-lg p-3">
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Status</p>
                            <p className="text-sm font-bold text-coal-200 mt-1">{run.status}</p>
                          </div>
                        </div>
                      )}

                      {steps[run.id] ? (
                        <div className="space-y-1">
                          {steps[run.id].map((step: any) => {
                            const isStepExpanded = expandedStep === step.id;
                            const hasOutput = step.agentOutput || step.agentRun?.outputSummary;
                            return (
                              <div key={step.id}>
                                <button
                                  onClick={() => hasOutput ? setExpandedStep(isStepExpanded ? null : step.id) : undefined}
                                  className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all text-left ${
                                    hasOutput ? 'hover:bg-coal-800/30 cursor-pointer' : 'cursor-default'
                                  } ${isStepExpanded ? 'bg-coal-800/20' : ''}`}
                                >
                                  <span className="text-xs text-coal-600 w-6 text-right font-mono">{step.stepOrder}</span>
                                  {step.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-400" />}
                                  {step.status === 'running' && <Loader2 size={14} className="text-sky-400 animate-spin" />}
                                  {step.status === 'failed' && <XCircle size={14} className="text-rose-400" />}
                                  {step.status === 'pending' && <Clock size={14} className="text-coal-600" />}
                                  {step.status === 'cancelled' && <XCircle size={14} className="text-coal-600" />}
                                  <span className="text-sm text-coal-300 flex-1">{step.stepName}</span>
                                  {step.agentRun?.agent?.name && (
                                    <span className="text-[10px] text-violet-400/70 flex items-center gap-1">
                                      <Bot size={10} /> {step.agentRun.agent.name}
                                    </span>
                                  )}
                                  {step.notes && <span className="text-[11px] text-coal-500 max-w-[200px] truncate">{step.notes}</span>}
                                  <StatusBadge status={step.status} />
                                  {hasOutput && (
                                    isStepExpanded
                                      ? <ChevronDown size={14} className="text-coal-500" />
                                      : <ChevronRight size={14} className="text-coal-500" />
                                  )}
                                </button>

                                {isStepExpanded && hasOutput && (() => {
                                  // Resolve the best available output text and structured data
                                  const outputText = step.agentOutput?.contentMarkdown
                                    || step.agentRun?.outputSummary
                                    || '';
                                  const meta = step.agentOutput?.structuredDataJson || {};
                                  // Try to parse JSON from contentMarkdown if parsedData is missing
                                  let parsedData = meta.parsedData;
                                  if (!parsedData && outputText) {
                                    try {
                                      const jsonMatch = outputText.match(/```json\s*([\s\S]*?)```/);
                                      const toParse = jsonMatch ? jsonMatch[1] : outputText;
                                      const candidate = JSON.parse(toParse.trim());
                                      if (typeof candidate === 'object') parsedData = candidate;
                                    } catch { /* not JSON, show as text */ }
                                  }

                                  return (
                                  <div className="ml-9 mr-3 mb-2 mt-1 space-y-3">
                                    {/* Agent run metadata badges */}
                                    {step.agentRun && (
                                      <div className="flex flex-wrap gap-2 text-[10px]">
                                        {step.agentRun.confidenceLevel && (
                                          <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">{step.agentRun.confidenceLevel}</span>
                                        )}
                                        {step.agentRun.startedAt && step.agentRun.finishedAt && (
                                          <span className="bg-coal-800 text-coal-400 px-2 py-0.5 rounded">
                                            {Math.round((new Date(step.agentRun.finishedAt).getTime() - new Date(step.agentRun.startedAt).getTime()) / 1000)}s
                                          </span>
                                        )}
                                        {meta.model && (
                                          <span className="bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">{meta.model}</span>
                                        )}
                                        {meta.tokenUsage?.total && (
                                          <span className="bg-coal-800 text-coal-400 px-2 py-0.5 rounded">{meta.tokenUsage.total.toLocaleString()} tokens</span>
                                        )}
                                        {meta.durationMs && (
                                          <span className="bg-coal-800 text-coal-400 px-2 py-0.5 rounded">{(meta.durationMs / 1000).toFixed(1)}s</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Structured data — parsed JSON from LLM output */}
                                    {parsedData && (
                                      <details className="group" open>
                                        <summary className="text-[10px] text-coal-500 cursor-pointer hover:text-coal-300 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                          <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                                          Structured Data
                                        </summary>
                                        <pre className="text-[11px] text-coal-400 bg-coal-950 border border-coal-800 rounded p-3 mt-1 max-h-[300px] overflow-auto font-mono">
                                          {JSON.stringify(parsedData, null, 2)}
                                        </pre>
                                      </details>
                                    )}

                                    {/* Raw LLM output — contentMarkdown or outputSummary */}
                                    {outputText && (
                                      <details className="group">
                                        <summary className="text-[10px] text-coal-500 cursor-pointer hover:text-coal-300 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                          <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                                          Raw Output ({outputText.length.toLocaleString()} chars)
                                        </summary>
                                        <div className="bg-coal-900/70 border border-coal-800 rounded-lg p-4 mt-1">
                                          <pre className="text-xs text-coal-300 whitespace-pre-wrap max-h-[400px] overflow-auto leading-relaxed font-mono">
                                            {outputText}
                                          </pre>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Loader2 className="animate-spin text-coal-500" size={16} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
