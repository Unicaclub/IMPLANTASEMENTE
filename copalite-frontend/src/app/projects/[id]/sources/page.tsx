'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Database, Plus, GitBranch, Globe, FileText, Server, StickyNote, Loader2, X,
  AlertTriangle, RotateCw
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  repository:         { icon: GitBranch, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  uploaded_document:  { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  web_app:            { icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  api_spec:           { icon: Server, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  database_schema:    { icon: Database, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  manual_note:        { icon: StickyNote, color: 'text-coal-300', bg: 'bg-coal-700/40' },
};

const SOURCE_TYPES = [
  'repository', 'uploaded_document', 'web_app', 'api_spec', 'database_schema', 'manual_note',
];

export default function SourcesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', sourceType: 'repository', location: '', authMode: 'none' });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSources();
  }, [projectId]);

  async function loadSources() {
    try {
      setSources(await api.listSources(projectId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.location) return;
    setCreating(true);
    try {
      await api.createSource({ projectId, ...form });
      setShowModal(false);
      setForm({ name: '', sourceType: 'repository', location: '', authMode: 'none' });
      setLoading(true);
      await loadSources();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create source');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Sources"
          subtitle="Data sources connected to this project"
          actions={
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
              <Plus size={16} />
              Add Source
            </button>
          }
        />

        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadSources(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : sources.length === 0 ? (
            <div className="card p-12 text-center">
              <Database className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No sources yet</p>
              <p className="text-xs text-coal-500 mt-1">Add a source to start discovery</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex gap-2">
                <Plus size={14} /> Add Source
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((src) => {
                const cfg = TYPE_CONFIG[src.sourceType] || TYPE_CONFIG.manual_note;
                return (
                  <div key={src.id} className="card p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${cfg.bg}`}>
                        <cfg.icon size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-coal-100">{src.name}</h3>
                          <StatusBadge status={src.status} />
                        </div>
                        <p className="text-sm text-coal-400 font-mono truncate">{src.location}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="badge-neutral text-[10px]">{src.sourceType.replace(/_/g, ' ')}</span>
                          {src.authMode && src.authMode !== 'none' && (
                            <span className="badge-info text-[10px]">{src.authMode}</span>
                          )}
                          <span className="text-[11px] text-coal-500">
                            Added {new Date(src.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Source Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Add Source</h2>
                <button onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Main Repository"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Type</label>
                  <select
                    className="input-field"
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Location</label>
                  <input
                    className="input-field font-mono"
                    placeholder="e.g. https://github.com/org/repo.git"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Auth Mode</label>
                  <select
                    className="input-field"
                    value={form.authMode}
                    onChange={(e) => setForm({ ...form, authMode: e.target.value })}
                  >
                    {['none', 'manual', 'session', 'oauth', 'token_ref'].map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name || !form.location || creating}
                  className="btn-primary flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Adding...' : 'Add Source'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
