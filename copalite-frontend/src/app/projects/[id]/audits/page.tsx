'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const RESULT_BADGE: Record<string, string> = {
  match: 'badge-success',
  partial_match: 'badge-info',
  divergence: 'badge-danger',
  missing: 'badge-warning',
  inconclusive: 'badge-neutral',
};

export default function AuditsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.get<any>(`/audits?projectId=${projectId}`);
      setAudits(Array.isArray(payload) ? payload : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar auditorias');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Auditorias" subtitle={`${audits.length} auditorias registradas`} />
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
          ) : !error && audits.length === 0 ? (
            <div className="card p-12 text-center">
              <ShieldCheck className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma auditoria encontrada</p>
              <p className="text-xs text-coal-500 mt-1">Execute uma run para gerar auditorias automaticamente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((a) => (
                <div key={a.id} className="card p-5 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-coal-100">{a.title}</h3>
                    <span className={`text-[10px] ${RESULT_BADGE[a.resultStatus] || 'badge-neutral'}`}>{a.resultStatus}</span>
                  </div>
                  <p className="text-xs text-coal-400 line-clamp-2">{a.summary}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="badge-neutral text-[10px]">{a.auditType}</span>
                    {a.scopeText && <span className="text-[10px] text-coal-500">{a.scopeText}</span>}
                    <span className="text-[10px] text-coal-600">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
