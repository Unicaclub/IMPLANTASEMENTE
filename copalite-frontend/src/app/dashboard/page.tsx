'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban, Plus, Boxes, ArrowRight, Shield, X, Loader2, CheckCircle2,
  AlertTriangle, RotateCw, Activity
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import Skeleton from '@/components/shared/Skeleton';
import SystemHealthIndicator from '@/components/system/SystemHealthIndicator';
import ActivityFeedItem from '@/components/activity/ActivityFeedItem';
import { useToast } from '@/components/shared/Toast';
import { useActivity } from '@/hooks/useActivity';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedWs, setSelectedWs] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [wsForm, setWsForm] = useState({ name: '', slug: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [prjForm, setPrjForm] = useState({ name: '', slug: '', projectType: 'legacy_system', description: '' });
  const [creatingProject, setCreatingProject] = useState(false);
  const { activities } = useActivity();

  useEffect(() => { loadWorkspaces(); }, []);

  async function loadWorkspaces() {
    try {
      const ws = await api.listWorkspaces();
      setWorkspaces(ws);
      if (ws.length > 0) await selectWorkspace(ws[0].id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar dados';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function selectWorkspace(wsId: string) {
    setSelectedWs(wsId);
    setLoadingProjects(true);
    try { setProjects(await api.listProjects(wsId)); } catch {} finally { setLoadingProjects(false); }
  }

  async function handleCreateWorkspace() {
    if (!wsForm.name || !wsForm.slug) return;
    setCreating(true);
    try {
      const ws = await api.createWorkspace({ name: wsForm.name, slug: wsForm.slug });
      setShowModal(false);
      setWsForm({ name: '', slug: '' });
      setWorkspaces(prev => [...prev, ws]);
      await selectWorkspace(ws.id);
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao criar workspace');
    } finally { setCreating(false); }
  }

  function handleNameChange(name: string) {
    setWsForm({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
  }

  function handleProjectNameChange(name: string) {
    setPrjForm({ ...prjForm, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
  }

  async function handleCreateProject() {
    if (!prjForm.name || !prjForm.slug || !selectedWs) return;
    setCreatingProject(true);
    try {
      await api.createProject({
        workspaceId: selectedWs, name: prjForm.name, slug: prjForm.slug,
        projectType: prjForm.projectType, description: prjForm.description || undefined,
      });
      setShowProjectModal(false);
      setPrjForm({ name: '', slug: '', projectType: 'legacy_system', description: '' });
      await selectWorkspace(selectedWs);
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally { setCreatingProject(false); }
  }

  const selectedWorkspace = workspaces.find(ws => ws.id === selectedWs);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Dashboard"
          subtitle="Visao geral dos seus workspaces e projetos"
          actions={
            <div className="flex items-center gap-4">
              <SystemHealthIndicator />
              <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
                <Plus size={16} /> Novo Workspace
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadWorkspaces(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="space-y-6">
              <Skeleton variant="card" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton variant="card" count={3} />
              </div>
            </div>
          ) : (
            <>
              {/* Welcome card */}
              <div className="card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="text-emerald-500" size={24} />
                    <h2 className="text-xl font-bold text-coal-50">Bem-vindo ao Copalite</h2>
                  </div>
                  <p className="text-coal-400 text-sm max-w-xl">
                    Crie um workspace, adicione um projeto, registre sources e lance sua primeira run de descoberta.
                    A plataforma mapeara seu software automaticamente usando 9 agentes especializados.
                  </p>
                </div>
              </div>

              {/* Workspaces */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Boxes size={20} className="text-coal-500" />
                    <h2 className="section-title">Workspaces</h2>
                    <span className="badge-neutral ml-2">{workspaces.length}</span>
                  </div>
                </div>
                {workspaces.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Boxes className="mx-auto text-coal-600 mb-3" size={40} />
                    <p className="text-coal-400">Nenhum workspace ainda</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex">
                      Criar primeiro workspace
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => selectWorkspace(ws.id)}
                        className={`text-left card p-5 transition-all duration-200 ${
                          selectedWs === ws.id
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'hover:border-coal-700 hover:bg-coal-900/60 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${selectedWs === ws.id ? 'bg-emerald-500/15' : 'bg-sky-500/10'}`}>
                            <Boxes size={18} className={selectedWs === ws.id ? 'text-emerald-400' : 'text-sky-400'} />
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedWs === ws.id && <CheckCircle2 size={14} className="text-emerald-400" />}
                            <StatusBadge status={ws.status} />
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-coal-100">{ws.name}</h3>
                        <p className="text-sm text-coal-500 mt-1 font-mono">{ws.slug}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Projects */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={20} className="text-coal-500" />
                    <h2 className="section-title">Projetos</h2>
                    {selectedWorkspace && <span className="text-xs text-coal-500 ml-1">em {selectedWorkspace.name}</span>}
                    <span className="badge-neutral ml-2">{projects.length}</span>
                  </div>
                  {selectedWs && (
                    <button onClick={() => setShowProjectModal(true)} className="btn-primary gap-2 text-sm">
                      <Plus size={14} /> Novo Projeto
                    </button>
                  )}
                </div>
                {loadingProjects ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
                ) : projects.length === 0 ? (
                  <div className="card p-12 text-center">
                    <FolderKanban className="mx-auto text-coal-600 mb-3" size={40} />
                    <p className="text-coal-400">{selectedWorkspace ? `Nenhum projeto em ${selectedWorkspace.name}` : 'Selecione um workspace'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((prj) => (
                      <Link key={prj.id} href={`/projects/${prj.id}`} className="card-hover p-5 group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 rounded-lg bg-violet-500/10"><FolderKanban size={18} className="text-violet-400" /></div>
                          <ArrowRight size={16} className="text-coal-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
                        </div>
                        <h3 className="text-base font-semibold text-coal-100">{prj.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={prj.status} />
                          <span className="text-xs text-coal-500 font-mono">{prj.projectType}</span>
                        </div>
                        {prj.description && <p className="text-sm text-coal-400 mt-2 line-clamp-2">{prj.description}</p>}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Activity feed */}
              {activities.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={20} className="text-coal-500" />
                    <h2 className="section-title">Atividade Recente</h2>
                  </div>
                  <div className="card p-4">
                    {activities.slice(0, 10).map((a) => (
                      <ActivityFeedItem key={a.id} activity={a} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Create Workspace Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Criar Workspace</h2>
                <button onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Nome</label>
                  <input className="input-field" placeholder="ex: Minha Empresa" value={wsForm.name} onChange={(e) => handleNameChange(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Slug</label>
                  <input className="input-field font-mono" placeholder="ex: minha-empresa" value={wsForm.slug} onChange={(e) => setWsForm({ ...wsForm, slug: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleCreateWorkspace} disabled={!wsForm.name || !wsForm.slug || creating} className="btn-primary flex-1 gap-2 disabled:opacity-50">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Criar Projeto</h2>
                <button onClick={() => setShowProjectModal(false)} className="text-coal-500 hover:text-coal-300"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Nome</label>
                  <input className="input-field" placeholder="ex: Sistema ERP" value={prjForm.name} onChange={(e) => handleProjectNameChange(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Slug</label>
                  <input className="input-field font-mono" placeholder="ex: sistema-erp" value={prjForm.slug} onChange={(e) => setPrjForm({ ...prjForm, slug: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Tipo</label>
                  <select className="input-field" value={prjForm.projectType} onChange={(e) => setPrjForm({ ...prjForm, projectType: e.target.value })}>
                    {['legacy_system', 'web_application', 'api_service', 'mobile_application', 'microservices', 'monolith', 'data_platform', 'other'].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-coal-300 mb-1.5">Descricao</label>
                  <textarea className="input-field min-h-[80px] resize-none" placeholder="Breve descricao do projeto" value={prjForm.description} onChange={(e) => setPrjForm({ ...prjForm, description: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowProjectModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleCreateProject} disabled={!prjForm.name || !prjForm.slug || creatingProject} className="btn-primary flex-1 gap-2 disabled:opacity-50">
                  {creatingProject ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creatingProject ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
