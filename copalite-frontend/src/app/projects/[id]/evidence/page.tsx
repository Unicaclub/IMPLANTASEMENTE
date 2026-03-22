'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileSearch, Code2, FileText, Globe, Camera, Terminal, StickyNote,
  Loader2, Filter, ExternalLink, AlertTriangle, RotateCw
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  code_excerpt:     { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  document_excerpt: { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  observed_route:   { icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  screenshot_note:  { icon: Camera, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  api_trace:        { icon: Terminal, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  manual_note:      { icon: StickyNote, color: 'text-coal-300', bg: 'bg-coal-700/40' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  confirmed: 'badge-success',
  inferred: 'badge-info',
  divergent: 'badge-warning',
  unvalidated: 'badge-neutral',
  outdated: 'badge-danger',
};

export default function EvidencePage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      setEvidence(await api.listEvidence(projectId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filtered = typeFilter === 'all' ? evidence : evidence.filter(e => e.evidenceType === typeFilter);

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Evidence Registry" subtitle={`${evidence.length} pieces of evidence collected`} />
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'code_excerpt', 'document_excerpt', 'observed_route', 'api_trace', 'manual_note'].map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === f ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-coal-400 hover:text-coal-200 bg-coal-800/40 border border-coal-800'
                }`}>
                {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
              </button>
            ))}
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
              <FileSearch className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No evidence found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ev) => {
                const cfg = TYPE_CONFIG[ev.evidenceType] || TYPE_CONFIG.manual_note;
                return (
                  <div key={ev.id} className="card p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${cfg.bg}`}>
                        <cfg.icon size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-coal-100">{ev.title}</h3>
                          <span className={`badge text-[10px] ${CONFIDENCE_COLORS[ev.confidenceStatus] || 'badge-neutral'}`}>
                            {ev.confidenceStatus}
                          </span>
                        </div>
                        <div className="mt-2 bg-coal-800/40 rounded-lg p-3 border border-coal-800">
                          <pre className="text-xs text-coal-300 font-mono whitespace-pre-wrap line-clamp-4">
                            {ev.contentExcerpt}
                          </pre>
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="badge-neutral text-[10px]">{ev.evidenceType.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] text-coal-500">→ {ev.relatedEntityType}</span>
                          {ev.referencePath && (
                            <span className="text-[11px] text-coal-500 font-mono">{ev.referencePath}</span>
                          )}
                          {ev.referenceUrl && (
                            <a href={ev.referenceUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300">
                              <ExternalLink size={10} /> Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
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
