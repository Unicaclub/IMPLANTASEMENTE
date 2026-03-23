'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckSquare, Clock, Play, Pause, CheckCircle2, XCircle, Loader2, User, Bot,
  AlertTriangle, RotateCw, ChevronDown, ArrowRight
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  pending:     { color: 'text-coal-400', bg: 'bg-coal-700/40', icon: Clock },
  approved:    { color: 'text-sky-400', bg: 'bg-sky-500/15', icon: CheckCircle2 },
  in_progress: { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Play },
  blocked:     { color: 'text-rose-400', bg: 'bg-rose-500/15', icon: Pause },
  done:        { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle2 },
  cancelled:   { color: 'text-coal-500', bg: 'bg-coal-700/30', icon: XCircle },
};

export default function TasksPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      setTasks(await api.listTasks(projectId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const NEXT_STATUS: Record<string, string> = {
    pending: 'in_progress',
    approved: 'in_progress',
    in_progress: 'done',
  };

  async function handleChangeStatus(taskId: string, newStatus: string) {
    setUpdatingStatus(taskId);
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Tasks" subtitle="Work items created from approved backlog" />
        <div className="p-8 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-2">
            {['all', 'pending', 'approved', 'in_progress', 'done', 'blocked'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800 hover:border-coal-700'
                }`}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
            <span className="text-xs text-coal-500 ml-2">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
          </div>

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
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckSquare className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No tasks found</p>
              <p className="text-xs text-coal-500 mt-1">Tasks are created from approved backlog items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((task) => {
                const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedTask === task.id;
                const nextStatus = NEXT_STATUS[task.status];
                return (
                  <div key={task.id} className="card overflow-hidden animate-fade-in">
                    <button
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      className="w-full p-5 text-left hover:bg-coal-800/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg ${cfg.bg}`}>
                          <cfg.icon size={18} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-coal-100">{task.title}</h3>
                            <span className={`badge text-[11px] ${cfg.bg} ${cfg.color}`}>{task.status.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm text-coal-400 line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="badge-neutral text-[10px]">{task.taskType}</span>
                            {task.assignedUserId && (
                              <span className="flex items-center gap-1 text-[11px] text-coal-500">
                                <User size={10} /> Assigned to user
                              </span>
                            )}
                            {task.assignedAgentId && (
                              <span className="flex items-center gap-1 text-[11px] text-sky-400">
                                <Bot size={10} /> Agent assigned
                              </span>
                            )}
                            {task.dueAt && (
                              <span className="text-[11px] text-coal-500">
                                Due: {new Date(task.dueAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-coal-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-coal-800/60">
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div>
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Task Type</p>
                            <p className="text-sm text-coal-200 mt-1">{task.taskType}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Status</p>
                            <p className="text-sm text-coal-200 mt-1">{task.status.replace('_', ' ')}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-coal-500 uppercase tracking-wider">Description</p>
                            <p className="text-sm text-coal-300 mt-1">{task.description}</p>
                          </div>
                          {task.backlogItemId && (
                            <div className="col-span-2">
                              <p className="text-[10px] text-coal-500 uppercase tracking-wider">Origin Backlog</p>
                              <p className="text-xs text-coal-400 mt-1 font-mono">{task.backlogItemId}</p>
                            </div>
                          )}
                        </div>
                        {nextStatus && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleChangeStatus(task.id, nextStatus); }}
                            disabled={updatingStatus === task.id}
                            className="btn-primary text-sm gap-2 disabled:opacity-50"
                          >
                            {updatingStatus === task.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <ArrowRight size={14} />
                            )}
                            Move to {nextStatus.replace('_', ' ')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
