'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ListChecks, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRight, Filter, ChevronDown, ShieldCheck, Bug, Lightbulb,
  FileText, Wrench, Search as SearchIcon, Loader2, RotateCw, Plus, X
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';

const TYPE_ICONS: Record<string, any> = {
  bug: Bug,
  gap: AlertTriangle,
  improvement: Lightbulb,
  documentation: FileText,
  refactor: Wrench,
  validation: ShieldCheck,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-rose-400 bg-rose-500/15 border-rose-500/20',
  high: 'text-amber-400 bg-amber-500/15 border-amber-500/20',
  medium: 'text-sky-400 bg-sky-500/15 border-sky-500/20',
  low: 'text-coal-400 bg-coal-700/40 border-coal-700',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'text-sky-400 bg-sky-500/15',
  triaged: 'text-violet-400 bg-violet-500/15',
  planned: 'text-emerald-400 bg-emerald-500/15',
  in_progress: 'text-amber-400 bg-amber-500/15',
  blocked: 'text-rose-400 bg-rose-500/15',
  done: 'text-emerald-400 bg-emerald-500/15',
  dismissed: 'text-coal-500 bg-coal-700/40',
};

export default function BacklogPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [itemForm, setItemForm] = useState({
    title: '', description: '', backlogType: 'bug', priority: 'medium', sourceType: 'manual',
  });

  useEffect(() => {
    loadBacklog();
  }, [projectId]);

  async function loadBacklog() {
    try {
      const data = await api.listBacklog(projectId);
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(itemId: string, approve: boolean) {
    setProcessing(itemId);
    try {
      await api.approveBacklog(itemId, approve);
      await loadBacklog();
    } catch (err: any) {
      toast('error', err.message || 'Failed to update backlog item');
    } finally {
      setProcessing(null);
    }
  }

  async function handleCreateItem() {
    if (!itemForm.title || itemForm.description.length < 10) return;
    setCreating(true);
    try {
      await api.post('/backlog', {
        projectId,
        title: itemForm.title,
        description: itemForm.description,
        backlogType: itemForm.backlogType,
        priority: itemForm.priority,
        sourceType: itemForm.sourceType,
      });
      setShowModal(false);
      setItemForm({ title: '', description: '', backlogType: 'bug', priority: 'medium', sourceType: 'manual' });
      setLoading(true);
      await loadBacklog();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateTask(itemId: string) {
    setProcessing(itemId);
    try {
      await api.createTaskFromBacklog(itemId);
      await loadBacklog();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create task');
    } finally {
      setProcessing(null);
    }
  }

  const filtered = items.filter((item) => {
    if (filter === 'pending_approval') return !item.approvedForTask && item.status === 'open';
    if (filter === 'approved') return item.approvedForTask;
    if (filter !== 'all') return item.backlogType === filter;
    return true;
  }).filter((item) => {
    if (!search) return true;
    return item.title.toLowerCase().includes(search.toLowerCase()) ||
           item.description.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: items.length,
    pendingApproval: items.filter(i => !i.approvedForTask && i.status === 'open').length,
    approved: items.filter(i => i.approvedForTask).length,
    bugs: items.filter(i => i.backlogType === 'bug').length,
    gaps: items.filter(i => i.backlogType === 'gap').length,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Backlog"
          subtitle="Triage and approve items before they become tasks"
          actions={
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
              <Plus size={16} />
              New Item
            </button>
          }
        />

        <div className="p-8 space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-coal-200' },
              { label: 'Pending Approval', value: stats.pendingApproval, color: 'text-amber-400' },
              { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
              { label: 'Bugs', value: stats.bugs, color: 'text-rose-400' },
              { label: 'Gaps', value: stats.gaps, color: 'text-violet-400' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-coal-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coal-500" />
              <input
                className="input-field pl-9"
                placeholder="Search backlog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending_approval', label: 'Pending Approval' },
                { key: 'approved', label: 'Approved' },
                { key: 'bug', label: 'Bugs' },
                { key: 'gap', label: 'Gaps' },
                { key: 'improvement', label: 'Improvements' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f.key
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800 hover:border-coal-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadBacklog(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}

          {/* Items list */}
          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <ListChecks className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No backlog items found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const TypeIcon = TYPE_ICONS[item.backlogType] || ListChecks;
                const isProcessing = processing === item.id;

                return (
                  <div key={item.id} className="card p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      {/* Type icon */}
                      <div className={`p-2.5 rounded-lg ${
                        item.backlogType === 'bug' ? 'bg-rose-500/10' :
                        item.backlogType === 'gap' ? 'bg-amber-500/10' :
                        'bg-sky-500/10'
                      }`}>
                        <TypeIcon size={18} className={
                          item.backlogType === 'bug' ? 'text-rose-400' :
                          item.backlogType === 'gap' ? 'text-amber-400' :
                          'text-sky-400'
                        } />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-coal-100 truncate">
                            {item.title}
                          </h3>
                          {item.approvedForTask && (
                            <span className="badge-success text-[10px] gap-1">
                              <CheckCircle2 size={10} /> Approved
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-coal-400 line-clamp-2">{item.description}</p>

                        <div className="flex items-center gap-3 mt-3">
                          <span className={`badge border text-[11px] ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                          <span className={`badge text-[11px] ${STATUS_COLORS[item.status]}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="badge-neutral text-[10px]">{item.backlogType}</span>
                          {item.evidenceCount > 0 && (
                            <span className="text-[11px] text-coal-500">
                              {item.evidenceCount} evidence{item.evidenceCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!item.approvedForTask && item.status === 'open' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, true)}
                              disabled={isProcessing}
                              className="btn-primary py-2 px-3 text-xs gap-1.5 disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(item.id, false)}
                              disabled={isProcessing}
                              className="btn-danger py-2 px-3 text-xs gap-1.5 disabled:opacity-50"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </>
                        )}

                        {item.approvedForTask && item.status !== 'planned' && (
                          <button
                            onClick={() => handleCreateTask(item.id)}
                            disabled={isProcessing}
                            className="btn-secondary py-2 px-3 text-xs gap-1.5 disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                            Create Task
                          </button>
                        )}

                        {item.status === 'planned' && (
                          <span className="text-xs text-emerald-400/70 font-medium">Task created</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Create Backlog Item Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">New Backlog Item</h2>
                <button onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Title</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Missing auth middleware on /users"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">
                    Description <span className="text-coal-500">(min 10 chars)</span>
                  </label>
                  <textarea
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Describe the issue or improvement..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-coal-300 mb-1.5">Type</label>
                    <select
                      className="input-field"
                      value={itemForm.backlogType}
                      onChange={(e) => setItemForm({ ...itemForm, backlogType: e.target.value })}
                    >
                      {['bug', 'gap', 'improvement', 'documentation', 'refactor', 'validation'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-coal-300 mb-1.5">Priority</label>
                    <select
                      className="input-field"
                      value={itemForm.priority}
                      onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
                    >
                      {['critical', 'high', 'medium', 'low'].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Source Type</label>
                  <select
                    className="input-field"
                    value={itemForm.sourceType}
                    onChange={(e) => setItemForm({ ...itemForm, sourceType: e.target.value })}
                  >
                    {['discovery', 'comparison', 'audit', 'manual'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleCreateItem}
                  disabled={!itemForm.title || itemForm.description.length < 10 || creating}
                  className="btn-primary flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
