'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, Loader2, AlertTriangle, RotateCw, ArrowRight, Plus, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';
import { RUN_STATUS_BADGE } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserRunResponse, TargetResponse } from '@/types/browser';

export default function BrowserRunsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [runs, setRuns] = useState<BrowserRunResponse[]>([]);
  const [targets, setTargets] = useState<TargetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ targetId: '', journeyName: '', module: '' });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      const [r, t] = await Promise.all([api.listBrowserRuns(projectId), api.listTargets(projectId)]);
      setRuns(r); setTargets(t);
      if (t.length > 0 && !form.targetId) setForm(f => ({ ...f, targetId: t[0].id }));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Falha ao carregar'); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.targetId) return;
    setCreating(true);
    try {
      await api.createBrowserRun({
        projectId,
        targetId: form.targetId,
        journeyName: form.journeyName || undefined,
        module: form.module || undefined,
      });
      setShowModal(false);
      setForm({ targetId: targets[0]?.id || '', journeyName: '', module: '' });
      toast('success', 'Browser run criada');
      loadData();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao criar');
    } finally { setCreating(false); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Browser Runs" subtitle={`${runs.length} execucoes`}
          actions={
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2 text-xs" disabled={targets.length === 0}>
              <Plus size={14} /> Nova Run
            </button>
          }
        />
        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={loadData} className="btn-secondary mt-4 gap-2"><RotateCw size={14} /> Tentar</button>
            </div>
          )}
          {!error && loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : !error && runs.length === 0 ? (
            <div className="card p-12 text-center">
              <Globe className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma browser run</p>
              {targets.length > 0 && (
                <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex gap-2 text-xs"><Plus size={14} /> Nova Run</button>
              )}
              {targets.length === 0 && <p className="text-xs text-coal-500 mt-2">Cadastre um target primeiro</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map(r => (
                <Link key={r.id} href={`/projects/${projectId}/browser-runs/${r.id}`} className="card p-5 animate-fade-in block hover:border-coal-700 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-coal-100">{r.journeyName || r.module || 'Browser Run'}</h3>
                        <span className={`text-[10px] ${RUN_STATUS_BADGE[r.status]}`}>{r.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {r.target && <span className="text-xs text-coal-400">{r.target.name}</span>}
                        <span className="text-[10px] text-coal-500">{r.stepsCount} steps</span>
                        <span className="text-[10px] text-coal-500">{r.evidencesCount} evidencias</span>
                        <span className="text-[10px] text-coal-600">{formatRelativeTime(r.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-coal-600 group-hover:text-emerald-400 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreate} className="card w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Nova Browser Run</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-coal-400 mb-1">Target</label>
                  <select className="input-field" value={form.targetId} onChange={e => setForm({ ...form, targetId: e.target.value })}>
                    {targets.map(t => <option key={t.id} value={t.id}>{t.name} — {t.baseUrl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-coal-400 mb-1">Nome da Jornada (opcional)</label>
                  <input className="input-field" placeholder="ex: Login Flow" value={form.journeyName} onChange={e => setForm({ ...form, journeyName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-coal-400 mb-1">Modulo (opcional)</label>
                  <input className="input-field" placeholder="ex: auth, dashboard" value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancelar</button>
                <button type="submit" disabled={!form.targetId || creating} className="btn-primary gap-2 text-xs">
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
