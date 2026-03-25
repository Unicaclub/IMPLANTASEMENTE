'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, RotateCw, Monitor, Pencil, Save, X } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';
import { TARGET_STATUS_BADGE, RUN_STATUS_BADGE, SESSION_STATUS_BADGE } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { TargetResponse, BrowserRunResponse, TargetSessionResponse } from '@/types/browser';

export default function TargetDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const targetId = params?.targetId as string;
  const [target, setTarget] = useState<TargetResponse | null>(null);
  const [runs, setRuns] = useState<BrowserRunResponse[]>([]);
  const [sessions, setSessions] = useState<TargetSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', environment: '', notes: '', status: '' });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [targetId]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      const [t, r, s] = await Promise.all([
        api.getTarget(targetId),
        api.listBrowserRuns(projectId).then((all: BrowserRunResponse[]) => all.filter(r => r.targetId === targetId)).catch(() => []),
        api.listSessions(targetId).catch(() => []),
      ]);
      setTarget(t); setRuns(r); setSessions(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar target');
    } finally { setLoading(false); }
  }

  function startEditing() {
    if (!target) return;
    setEditForm({ name: target.name, environment: target.environment, notes: target.notes || '', status: target.status });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateTarget(targetId, {
        name: editForm.name,
        environment: editForm.environment,
        notes: editForm.notes || undefined,
        status: editForm.status,
      });
      setTarget(updated);
      setEditing(false);
      toast('success', 'Target atualizado');
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title={target?.name || 'Target'} subtitle={target?.baseUrl || ''}
          actions={!editing ? (
            <button onClick={startEditing} className="btn-secondary gap-2 text-xs"><Pencil size={14} /> Editar</button>
          ) : undefined}
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
          ) : target && (
            <>
              {/* Target info — view or edit mode */}
              {editing ? (
                <div className="card p-5 space-y-4 border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-400">Editando Target</h3>
                    <button onClick={() => setEditing(false)} className="text-coal-500 hover:text-coal-300"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-coal-400 mb-1">Nome</label>
                      <input className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-coal-400 mb-1">Ambiente</label>
                      <select className="input-field" value={editForm.environment} onChange={e => setEditForm({ ...editForm, environment: e.target.value })}>
                        {['development', 'staging', 'production', 'local'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-coal-400 mb-1">Status</label>
                      <select className="input-field" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                        {['active', 'inactive', 'blocked'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-coal-400 mb-1">Notas</label>
                      <input className="input-field" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notas sobre o target" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><p className="text-[10px] text-coal-500 uppercase">Status</p><span className={`text-xs ${TARGET_STATUS_BADGE[target.status]}`}>{target.status}</span></div>
                    <div><p className="text-[10px] text-coal-500 uppercase">Ambiente</p><p className="text-xs text-coal-200">{target.environment}</p></div>
                    <div><p className="text-[10px] text-coal-500 uppercase">Tipo</p><p className="text-xs text-coal-200">{target.systemType}</p></div>
                    <div><p className="text-[10px] text-coal-500 uppercase">Criado</p><p className="text-xs text-coal-200">{formatRelativeTime(target.createdAt)}</p></div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] text-coal-500 uppercase">URL Base</p>
                    <p className="text-xs text-coal-200 font-mono">{target.baseUrl}</p>
                  </div>
                  {target.notes && (
                    <div className="mt-3">
                      <p className="text-[10px] text-coal-500 uppercase">Notas</p>
                      <p className="text-xs text-coal-300">{target.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sessions */}
              <div>
                <h3 className="text-sm font-semibold text-coal-200 mb-3">Sessions ({sessions.length})</h3>
                {sessions.length === 0 ? (
                  <div className="card p-6 text-center"><p className="text-coal-400 text-xs">Nenhuma session</p></div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div key={s.id} className="card p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${SESSION_STATUS_BADGE[s.status]}`}>{s.status}</span>
                          <span className="text-xs text-coal-300">{s.profileName}</span>
                        </div>
                        <span className="text-[10px] text-coal-600">{formatRelativeTime(s.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Browser Runs */}
              <div>
                <h3 className="text-sm font-semibold text-coal-200 mb-3">Browser Runs ({runs.length})</h3>
                {runs.length === 0 ? (
                  <div className="card p-6 text-center"><p className="text-coal-400 text-xs">Nenhuma browser run</p></div>
                ) : (
                  <div className="space-y-2">
                    {runs.map(r => (
                      <Link key={r.id} href={`/projects/${projectId}/browser-runs/${r.id}`} className="card p-3 block hover:border-coal-700 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${RUN_STATUS_BADGE[r.status]}`}>{r.status}</span>
                            <span className="text-xs text-coal-300">{r.journeyName || r.module || 'Run'}</span>
                          </div>
                          <span className="text-[10px] text-coal-600">{formatRelativeTime(r.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
