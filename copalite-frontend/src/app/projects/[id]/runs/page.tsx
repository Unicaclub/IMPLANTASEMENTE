'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Play, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, AlertTriangle, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function RunsPage() {
  const { id: projectId } = useParams() as { id: string };
  const [runs, setRuns] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, any[]>>({});
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
    if (!steps[runId]) {
      const s = await api.getRunSteps(runId);
      setSteps(prev => ({ ...prev, [runId]: s }));
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
                      {steps[run.id] ? (
                        <div className="space-y-1">
                          {steps[run.id].map((step: any) => (
                            <div key={step.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-coal-800/30">
                              <span className="text-xs text-coal-600 w-6 text-right font-mono">{step.stepOrder}</span>
                              {step.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-400" />}
                              {step.status === 'running' && <Loader2 size={14} className="text-sky-400 animate-spin" />}
                              {step.status === 'failed' && <XCircle size={14} className="text-rose-400" />}
                              {step.status === 'pending' && <Clock size={14} className="text-coal-600" />}
                              <span className="text-sm text-coal-300 flex-1">{step.stepName}</span>
                              <StatusBadge status={step.status} />
                            </div>
                          ))}
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
