'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Play, Pause, RotateCw, X, CheckCircle2, XCircle, Clock,
  Loader2, ArrowRight, Zap, ChevronDown, ChevronRight, Shield, AlertTriangle
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  pending:   { color: 'text-coal-400', bg: 'bg-coal-700/40', icon: Clock, label: 'Pending' },
  running:   { color: 'text-sky-400', bg: 'bg-sky-500/15', icon: Loader2, label: 'Running' },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle2, label: 'Completed' },
  failed:    { color: 'text-rose-400', bg: 'bg-rose-500/15', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: X, label: 'Cancelled' },
  blocked:   { color: 'text-orange-400', bg: 'bg-orange-500/15', icon: AlertTriangle, label: 'Blocked' },
};

const RUN_TYPE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  comparison: 'Comparison',
  audit: 'Audit',
  backlog_generation: 'Backlog Generation',
};

export default function OrchestrationPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [pipelines, setPipelines] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startForm, setStartForm] = useState({ runType: 'discovery', title: '', goal: '', scopeText: '' });
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    try {
      const [runsData, pipelinesData] = await Promise.all([
        api.listRuns(projectId),
        api.getAvailablePipelines(),
      ]);
      setRuns(runsData);
      setPipelines(pipelinesData);
      if (runsData.length > 0) {
        await selectRun(runsData[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function selectRun(run: any) {
    setSelectedRun(run);
    try {
      const status = await api.getPipelineStatus(run.id);
      setPipelineStatus(status);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStart() {
    setStarting(true);
    try {
      const result = await api.startPipeline({
        projectId,
        runType: startForm.runType,
        title: startForm.title,
        goal: startForm.goal,
        scopeText: startForm.scopeText || undefined,
      });
      setShowStartModal(false);
      setStartForm({ runType: 'discovery', title: '', goal: '', scopeText: '' });
      await loadData();
      await selectRun(result.run);
    } catch (err: any) {
      toast('error', err.message || 'Failed to start pipeline');
    } finally {
      setStarting(false);
    }
  }

  async function handleAdvance() {
    if (!selectedRun) return;
    try {
      await api.advanceStep(selectedRun.id, {
        outputSummary: 'Step completed via dashboard',
        success: true,
      });
      await selectRun(selectedRun);
      await loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to advance step');
    }
  }

  async function handleCancel() {
    if (!selectedRun || !confirm('Cancel this pipeline?')) return;
    try {
      await api.cancelPipeline(selectedRun.id);
      await selectRun(selectedRun);
      await loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to cancel pipeline');
    }
  }

  async function handleRetry() {
    if (!selectedRun) return;
    try {
      await api.retryPipeline(selectedRun.id);
      await selectRun(selectedRun);
      await loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to retry pipeline');
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Orchestration"
          subtitle="Pipeline execution and agent coordination"
          actions={
            <button onClick={() => setShowStartModal(true)} className="btn-primary gap-2">
              <Zap size={16} />
              Start Pipeline
            </button>
          }
        />

        <div className="p-8">
          {error && (
            <div className="card p-8 text-center border-rose-500/20 mb-6">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadData(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}
          <div className="grid grid-cols-12 gap-6">
            {/* Run list sidebar */}
            <div className="col-span-4 space-y-3">
              <h3 className="text-sm font-semibold text-coal-400 uppercase tracking-wider mb-3">
                Runs ({runs.length})
              </h3>

              {runs.length === 0 ? (
                <div className="card p-8 text-center">
                  <Play className="mx-auto text-coal-600 mb-3" size={32} />
                  <p className="text-coal-400 text-sm">No runs yet</p>
                  <button onClick={() => setShowStartModal(true)} className="btn-primary mt-4 text-sm">
                    Start your first run
                  </button>
                </div>
              ) : (
                runs.map((run) => {
                  const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
                  const isSelected = selectedRun?.id === run.id;
                  return (
                    <button
                      key={run.id}
                      onClick={() => selectRun(run)}
                      className={`w-full text-left card p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'hover:border-coal-700 hover:bg-coal-900'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`badge ${cfg.bg} ${cfg.color} border-0 text-[11px]`}>
                          {RUN_TYPE_LABELS[run.runType] || run.runType}
                        </span>
                        <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                          <cfg.icon size={14} className={run.status === 'running' ? 'animate-spin' : ''} />
                          <span className="text-xs font-medium">{cfg.label}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-coal-100 line-clamp-1">{run.title}</h4>
                      <p className="text-xs text-coal-500 mt-1 line-clamp-1">{run.goal}</p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pipeline detail */}
            <div className="col-span-8">
              {!selectedRun ? (
                <div className="card p-16 text-center">
                  <Shield className="mx-auto text-coal-600 mb-4" size={48} />
                  <p className="text-coal-400">Select a run to see pipeline details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Run header */}
                  <div className="card p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-coal-50">{selectedRun.title}</h2>
                        <p className="text-sm text-coal-400 mt-1">{selectedRun.goal}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRun.status === 'running' && (
                          <>
                            <button onClick={handleAdvance} className="btn-primary gap-1.5 text-sm py-2">
                              <ArrowRight size={14} /> Advance
                            </button>
                            <button onClick={handleCancel} className="btn-danger gap-1.5 text-sm py-2">
                              <X size={14} /> Cancel
                            </button>
                          </>
                        )}
                        {selectedRun.status === 'failed' && (
                          <button onClick={handleRetry} className="btn-secondary gap-1.5 text-sm py-2">
                            <RotateCw size={14} /> Retry
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {pipelineStatus && (
                      <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-coal-400 font-medium">
                            Progress: {pipelineStatus.progress.completed} / {pipelineStatus.progress.total} steps
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            {pipelineStatus.progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-coal-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pipelineStatus.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Steps timeline */}
                  {pipelineStatus?.steps && (
                    <div className="space-y-0">
                      {pipelineStatus.steps.map((step: any, idx: number) => {
                        const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
                        const isLast = idx === pipelineStatus.steps.length - 1;
                        const isCurrent = step.status === 'running';

                        return (
                          <div key={step.id} className="relative flex gap-4">
                            {/* Timeline line */}
                            {!isLast && (
                              <div className="absolute left-[17px] top-[44px] bottom-0 w-px bg-coal-800" />
                            )}

                            {/* Step indicator */}
                            <div className={`relative z-10 flex-shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 ${
                              isCurrent
                                ? 'border-sky-500 bg-sky-500/20'
                                : step.status === 'completed'
                                ? 'border-emerald-500/60 bg-emerald-500/10'
                                : step.status === 'failed'
                                ? 'border-rose-500/60 bg-rose-500/10'
                                : 'border-coal-700 bg-coal-800/60'
                            }`}>
                              <cfg.icon
                                size={16}
                                className={`${cfg.color} ${isCurrent ? 'animate-spin' : ''}`}
                              />
                            </div>

                            {/* Step content */}
                            <div className={`flex-1 pb-6 ${isCurrent ? '' : ''}`}>
                              <div className={`card p-4 ${isCurrent ? 'border-sky-500/30 bg-sky-500/5' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-coal-500 font-mono">Step {step.stepOrder}</span>
                                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-coal-100 mt-1">
                                      {step.stepName}
                                    </h4>
                                  </div>
                                  <span className="badge-neutral text-[10px]">{step.stepType}</span>
                                </div>

                                {step.notes && (
                                  <p className="text-xs text-coal-400 mt-2 bg-coal-800/40 rounded px-2 py-1">
                                    {step.notes}
                                  </p>
                                )}

                                {step.startedAt && (
                                  <div className="flex items-center gap-4 mt-2 text-[11px] text-coal-500">
                                    <span>Started: {new Date(step.startedAt).toLocaleTimeString()}</span>
                                    {step.finishedAt && (
                                      <span>Finished: {new Date(step.finishedAt).toLocaleTimeString()}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Pipeline Modal */}
        {showStartModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Start New Pipeline</h2>
                <button onClick={() => setShowStartModal(false)} className="text-coal-500 hover:text-coal-300">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Run Type</label>
                  <select
                    value={startForm.runType}
                    onChange={(e) => setStartForm({ ...startForm, runType: e.target.value })}
                    className="input-field"
                  >
                    <option value="discovery">Discovery</option>
                    <option value="comparison">Comparison</option>
                    <option value="audit">Audit</option>
                    <option value="backlog_generation">Backlog Generation</option>
                  </select>
                  {pipelines?.[startForm.runType] && (
                    <p className="text-xs text-coal-500 mt-1">
                      {pipelines[startForm.runType].totalSteps} steps in this pipeline
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Title</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Discovery inicial do ERP"
                    value={startForm.title}
                    onChange={(e) => setStartForm({ ...startForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Goal</label>
                  <textarea
                    className="input-field min-h-[80px] resize-none"
                    placeholder="What should this run accomplish?"
                    value={startForm.goal}
                    onChange={(e) => setStartForm({ ...startForm, goal: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">
                    Scope <span className="text-coal-500">(optional)</span>
                  </label>
                  <textarea
                    className="input-field min-h-[60px] resize-none"
                    placeholder="Limit the scope if needed"
                    value={startForm.scopeText}
                    onChange={(e) => setStartForm({ ...startForm, scopeText: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowStartModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={!startForm.title || !startForm.goal || starting}
                  className="btn-primary flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {starting ? 'Starting...' : 'Start Pipeline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
