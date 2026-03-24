'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Crosshair, Loader2, AlertTriangle, RotateCw, Plus, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';
import { TARGET_STATUS_BADGE } from '@/types/browser';
import type { TargetResponse } from '@/types/browser';

export default function TargetsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [targets, setTargets] = useState<TargetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', baseUrl: '', environment: 'staging', systemType: 'web_application' });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true); setError(null);
    try { setTargets(await api.listTargets(projectId)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Falha ao carregar targets'); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.baseUrl.trim()) return;
    setCreating(true);
    try {
      await api.createTarget({ projectId, ...form });
      setShowModal(false);
      setForm({ name: '', baseUrl: '', environment: 'staging', systemType: 'web_application' });
      loadData();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao criar target');
    } finally { setCreating(false); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Targets" subtitle={`${targets.length} alvos cadastrados`}
          actions={<button onClick={() => setShowModal(true)} className="btn-primary gap-2"><Plus size={16} /> Novo Target</button>} />
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
          ) : !error && targets.length === 0 ? (
            <div className="card p-12 text-center">
              <Crosshair className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhum target cadastrado</p>
              <p className="text-xs text-coal-500 mt-1">Cadastre um sistema-alvo para iniciar browser runs</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex gap-2"><Plus size={14} /> Novo Target</button>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((t) => (
                <div key={t.id} className="card p-5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-coal-100">{t.name}</h3>
                        <span className={`text-[10px] ${TARGET_STATUS_BADGE[t.status]}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-coal-400 font-mono">{t.baseUrl}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="badge-neutral text-[10px]">{t.environment}</span>
                        <span className="badge-neutral text-[10px]">{t.systemType}</span>
                        <span className="text-[10px] text-coal-600">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreate} className="card w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Novo Target</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Nome</label>
                  <input className="input-field" placeholder="ex: Portal Admin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">URL Base</label>
                  <input className="input-field font-mono" placeholder="https://admin.example.com" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-coal-300 mb-1.5">Ambiente</label>
                    <select className="input-field" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                      {['development', 'staging', 'production', 'local'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-coal-300 mb-1.5">Tipo</label>
                    <select className="input-field" value={form.systemType} onChange={(e) => setForm({ ...form, systemType: e.target.value })}>
                      {['web_application', 'api_service', 'legacy_system', 'spa', 'other'].map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={!form.name.trim() || !form.baseUrl.trim() || creating} className="btn-primary gap-2">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null} Criar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
