'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileSearch, Loader2, AlertTriangle, RotateCw, Plus, X,
  Code2, FileText, Globe, Camera, Terminal, StickyNote,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ConfidenceBadge from '@/components/registry/ConfidenceBadge';
import { useToast } from '@/components/shared/Toast';
import { useEvidence } from '@/hooks/useEvidence';
import { createEvidence } from '@/lib/evidence';
import { EVIDENCE_TYPE_LABELS, EVIDENCE_TYPES } from '@/types/evidence';
import type { EvidenceType } from '@/types/evidence';

const ICON_MAP: Record<EvidenceType, typeof Code2> = {
  code_excerpt: Code2,
  document_excerpt: FileText,
  observed_route: Globe,
  screenshot_note: Camera,
  api_trace: Terminal,
  manual_note: StickyNote,
};

export default function EvidencePage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [typeFilter, setTypeFilter] = useState<EvidenceType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const [evForm, setEvForm] = useState({
    title: '', evidenceType: 'manual_note' as EvidenceType, contentExcerpt: '', referencePath: '',
  });

  const filters = typeFilter !== 'all' ? { evidenceType: typeFilter } : undefined;
  const { evidence, loading, error, refetch } = useEvidence(projectId, filters);

  async function handleCreateEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!evForm.title.trim() || !evForm.contentExcerpt.trim()) return;
    setCreating(true);
    try {
      await createEvidence({
        projectId,
        runId: '00000000-0000-0000-0000-000000000000',
        evidenceType: evForm.evidenceType,
        title: evForm.title.trim(),
        contentExcerpt: evForm.contentExcerpt.trim(),
        referencePath: evForm.referencePath.trim() || undefined,
        relatedEntityType: 'project',
        relatedEntityId: projectId,
      });
      setShowModal(false);
      setEvForm({ title: '', evidenceType: 'manual_note', contentExcerpt: '', referencePath: '' });
      refetch();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erro ao criar evidência');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Registro de Evidências"
          subtitle={`${evidence.length} evidências coletadas`}
          actions={
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
              <Plus size={16} />
              Adicionar Evidência
            </button>
          }
        />
        <div className="p-8 space-y-6">
          {/* Filtros por tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'all' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'
              }`}>Todos</button>
            {EVIDENCE_TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'
                }`}>
                {EVIDENCE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={refetch} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : !error && evidence.length === 0 ? (
            <div className="card p-12 text-center">
              <FileSearch className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma evidência encontrada</p>
              <p className="text-xs text-coal-500 mt-1">Execute uma run de descoberta ou adicione manualmente</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex gap-2">
                <Plus size={14} /> Adicionar Evidência
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {evidence.map((ev) => {
                const Icon = ICON_MAP[ev.evidenceType] ?? FileSearch;
                return (
                  <div key={ev.id} className="card p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-coal-800/50">
                        <Icon size={18} className="text-coal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-coal-100">{ev.title || ev.contentExcerpt?.slice(0, 60) || '—'}</h3>
                          <ConfidenceBadge status={ev.confidenceStatus} />
                        </div>
                        {ev.contentExcerpt && (
                          <div className="mt-2 bg-coal-800/40 rounded-lg p-3 border border-coal-800">
                            <pre className="text-xs text-coal-300 font-mono whitespace-pre-wrap line-clamp-4">
                              {ev.contentExcerpt}
                            </pre>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="badge-neutral text-[10px]">{EVIDENCE_TYPE_LABELS[ev.evidenceType] ?? ev.evidenceType}</span>
                          {ev.relatedEntityType && <span className="text-[11px] text-coal-500">→ {ev.relatedEntityType}</span>}
                          {ev.referencePath && <span className="text-[11px] text-coal-500 font-mono">{ev.referencePath}</span>}
                          <span className="text-[11px] text-coal-600">{new Date(ev.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Adicionar Evidência */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateEvidence} className="card w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-coal-50">Adicionar Evidência</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-coal-500 hover:text-coal-300">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="ev-title" className="block text-sm font-medium text-coal-300 mb-1.5">Título</label>
                  <input
                    id="ev-title"
                    className="input-field"
                    placeholder="ex: Middleware de autenticação"
                    value={evForm.title}
                    onChange={(e) => setEvForm({ ...evForm, title: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="ev-type" className="block text-sm font-medium text-coal-300 mb-1.5">Tipo</label>
                  <select
                    id="ev-type"
                    className="input-field"
                    value={evForm.evidenceType}
                    onChange={(e) => setEvForm({ ...evForm, evidenceType: e.target.value as EvidenceType })}
                  >
                    {EVIDENCE_TYPES.map((t) => (
                      <option key={t} value={t}>{EVIDENCE_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ev-content" className="block text-sm font-medium text-coal-300 mb-1.5">Conteúdo</label>
                  <textarea
                    id="ev-content"
                    className="input-field min-h-[100px] resize-y font-mono text-xs"
                    placeholder="Cole o trecho de código, log ou anotação..."
                    value={evForm.contentExcerpt}
                    onChange={(e) => setEvForm({ ...evForm, contentExcerpt: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="ev-path" className="block text-sm font-medium text-coal-300 mb-1.5">
                    Arquivo de referência (opcional)
                  </label>
                  <input
                    id="ev-path"
                    className="input-field font-mono text-xs"
                    placeholder="ex: src/auth/guard.ts"
                    value={evForm.referencePath}
                    onChange={(e) => setEvForm({ ...evForm, referencePath: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button
                  type="submit"
                  disabled={!evForm.title.trim() || !evForm.contentExcerpt.trim() || creating}
                  className="btn-primary gap-2"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
