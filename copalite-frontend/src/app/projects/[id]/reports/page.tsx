'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileBarChart, Loader2, AlertTriangle, RotateCw, ExternalLink } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  inactive: 'badge-neutral',
  archived: 'badge-neutral',
};

export default function ReportsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.get<any>(`/reports?projectId=${projectId}`);
      setReports(Array.isArray(payload) ? payload : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar relatorios');
    } finally {
      setLoading(false);
    }
  }

  async function viewReport(id: string) {
    setLoadingDetail(true);
    try {
      const detail = await api.get<any>(`/reports/${id}`);
      setSelectedReport(detail);
    } catch {
      setSelectedReport(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Relatorios" subtitle={`${reports.length} relatorios gerados`} />
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
          ) : !error && reports.length === 0 ? (
            <div className="card p-12 text-center">
              <FileBarChart className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhum relatorio encontrado</p>
              <p className="text-xs text-coal-500 mt-1">Relatorios sao gerados automaticamente apos uma run</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List */}
              <div className="space-y-3">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => viewReport(r.id)}
                    className={`w-full text-left card p-4 transition-all ${
                      selectedReport?.id === r.id ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:border-coal-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-coal-100 truncate">{r.title}</h3>
                      <span className={`text-[10px] shrink-0 ${STATUS_BADGE[r.status] || 'badge-neutral'}`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-coal-400 line-clamp-2">{r.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge-neutral text-[10px]">{r.reportType}</span>
                      <span className="text-[10px] text-coal-600">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detail */}
              <div className="lg:col-span-2">
                {loadingDetail ? (
                  <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
                ) : selectedReport?.contentMarkdown ? (
                  <div className="card p-6">
                    <h2 className="text-lg font-bold text-coal-100 mb-4">{selectedReport.title}</h2>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-xs text-coal-300 font-mono bg-coal-900 rounded-lg p-4">
                        {selectedReport.contentMarkdown}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="card p-12 text-center">
                    <FileBarChart className="mx-auto text-coal-600 mb-3" size={40} />
                    <p className="text-coal-400">Selecione um relatorio para visualizar</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
