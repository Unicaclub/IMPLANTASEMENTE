'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Layers, Globe, Code2, Database, MonitorSmartphone, Loader2, Search,
  AlertTriangle, RotateCw, FileSearch, ChevronDown, ChevronRight, Shield, Lock
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const TABS = [
  { key: 'modules', label: 'Modules', icon: Layers, color: 'text-violet-400' },
  { key: 'routes', label: 'Routes', icon: Globe, color: 'text-sky-400' },
  { key: 'apis', label: 'APIs', icon: Code2, color: 'text-emerald-400' },
  { key: 'schemas', label: 'Schemas', icon: Database, color: 'text-amber-400' },
  { key: 'ui', label: 'UI Screens', icon: MonitorSmartphone, color: 'text-rose-400' },
  { key: 'evidence', label: 'Evidence', icon: FileSearch, color: 'text-teal-400' },
];

const CONFIDENCE_BADGE: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inferred: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  divergent: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  unvalidated: 'bg-coal-700/40 text-coal-400 border-coal-700',
  outdated: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400',
  POST: 'bg-sky-500/15 text-sky-400',
  PUT: 'bg-amber-500/15 text-amber-400',
  PATCH: 'bg-violet-500/15 text-violet-400',
  DELETE: 'bg-rose-500/15 text-rose-400',
};

export default function RegistriesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const initialTab = searchParams?.get('tab') || 'modules';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { loadTab(activeTab); }, [activeTab, projectId]);

  async function loadTab(tab: string) {
    setLoading(true);
    setError(null);
    setExpanded(new Set());
    try {
      let result: any[] = [];
      switch (tab) {
        case 'modules': result = await api.listModules(projectId); break;
        case 'routes': result = await api.listRoutes(projectId); break;
        case 'apis': result = await api.listApis(projectId); break;
        case 'schemas': result = await api.listSchemas(projectId); break;
        case 'ui': result = await api.listUiScreens(projectId); break;
        case 'evidence': result = await api.listEvidence(projectId); break;
      }
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(s);
  });

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderModulesTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Name</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Layer</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Description</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30 cursor-pointer" onClick={() => toggleExpand(item.id)}>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {expanded.has(item.id) ? <ChevronDown size={14} className="text-coal-500" /> : <ChevronRight size={14} className="text-coal-500" />}
                  <span className="text-sm font-medium text-coal-100">{item.name || item.entityName}</span>
                </div>
                {expanded.has(item.id) && item.slug && <p className="text-[11px] text-coal-500 font-mono mt-1 ml-6">{item.slug}</p>}
              </td>
              <td className="py-3 px-4">
                {item.layerType && <span className="badge-neutral text-[10px]">{item.layerType}</span>}
              </td>
              <td className="py-3 px-4">
                <p className="text-xs text-coal-400 line-clamp-1">{item.description || '-'}</p>
              </td>
              <td className="py-3 px-4">
                {item.confidenceStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CONFIDENCE_BADGE[item.confidenceStatus] || CONFIDENCE_BADGE.unvalidated}`}>
                    {item.confidenceStatus}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderApisTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Method</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Path</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Description</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Auth</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30">
              <td className="py-3 px-4">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[item.httpMethod || item.method] || 'bg-coal-700 text-coal-300'}`}>
                  {item.httpMethod || item.method || '?'}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-mono text-coal-200">{item.path || item.endpoint || '-'}</span>
              </td>
              <td className="py-3 px-4">
                <p className="text-xs text-coal-400 line-clamp-1">{item.description || '-'}</p>
              </td>
              <td className="py-3 px-4">
                {item.authRequired && <Lock size={14} className="text-amber-400" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderRoutesTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Path</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Type</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Method</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Controller</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30">
              <td className="py-3 px-4"><span className="text-sm font-mono text-coal-200">{item.path || '-'}</span></td>
              <td className="py-3 px-4">{item.routeType && <span className="badge-neutral text-[10px]">{item.routeType}</span>}</td>
              <td className="py-3 px-4">
                {item.method && <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[item.method] || 'bg-coal-700 text-coal-300'}`}>{item.method}</span>}
              </td>
              <td className="py-3 px-4"><span className="text-xs text-coal-400">{item.controllerName || '-'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderSchemasTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Entity</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Table</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Description</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30 cursor-pointer" onClick={() => toggleExpand(item.id)}>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {expanded.has(item.id) ? <ChevronDown size={14} className="text-coal-500" /> : <ChevronRight size={14} className="text-coal-500" />}
                  <span className="text-sm font-medium text-coal-100">{item.entityName || item.name}</span>
                </div>
              </td>
              <td className="py-3 px-4"><span className="text-sm font-mono text-coal-300">{item.tableName || '-'}</span></td>
              <td className="py-3 px-4"><p className="text-xs text-coal-400 line-clamp-1">{item.description || '-'}</p></td>
              <td className="py-3 px-4">
                {item.confidenceStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CONFIDENCE_BADGE[item.confidenceStatus] || CONFIDENCE_BADGE.unvalidated}`}>
                    {item.confidenceStatus}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderUiTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Screen</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Route</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">State Type</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Description</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30">
              <td className="py-3 px-4"><span className="text-sm font-medium text-coal-100">{item.screenName || item.name}</span></td>
              <td className="py-3 px-4"><span className="text-sm font-mono text-coal-300">{item.route || '-'}</span></td>
              <td className="py-3 px-4">{item.stateType && <span className="badge-neutral text-[10px]">{item.stateType}</span>}</td>
              <td className="py-3 px-4"><p className="text-xs text-coal-400 line-clamp-1">{item.description || '-'}</p></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderEvidenceTable() {
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-coal-800 text-left">
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Title</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Type</th>
            <th className="text-xs text-coal-500 font-medium py-3 px-4">Source File</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-coal-800/50 hover:bg-coal-800/30 cursor-pointer" onClick={() => toggleExpand(item.id)}>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {expanded.has(item.id) ? <ChevronDown size={14} className="text-coal-500" /> : <ChevronRight size={14} className="text-coal-500" />}
                  <span className="text-sm font-medium text-coal-100">{item.title || '-'}</span>
                </div>
                {expanded.has(item.id) && item.content && (
                  <pre className="text-[11px] text-coal-400 mt-2 ml-6 bg-coal-900 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">{item.content}</pre>
                )}
              </td>
              <td className="py-3 px-4">
                {item.evidenceType && <span className="badge-neutral text-[10px]">{item.evidenceType}</span>}
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono text-coal-400">{item.sourceFile || '-'}</span>
                {item.sourceLine && <span className="text-[10px] text-coal-500">:{item.sourceLine}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderTable() {
    switch (activeTab) {
      case 'modules': return renderModulesTable();
      case 'apis': return renderApisTable();
      case 'routes': return renderRoutesTable();
      case 'schemas': return renderSchemasTable();
      case 'ui': return renderUiTable();
      case 'evidence': return renderEvidenceTable();
      default: return null;
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Technical Registries" subtitle="Discovered components and their relationships" />
        <div className="p-8 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-coal-900/50 p-1 rounded-xl border border-coal-800 w-fit">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-coal-800 text-coal-100 shadow-sm'
                    : 'text-coal-400 hover:text-coal-200'
                }`}>
                <tab.icon size={15} className={activeTab === tab.key ? tab.color : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + count */}
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coal-500" />
              <input className="input-field pl-9" placeholder={`Search ${activeTab}...`}
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <p className="text-xs text-coal-500">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadTab(activeTab); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Database className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No {activeTab} found</p>
              <p className="text-xs text-coal-500 mt-1">Run a discovery pipeline to populate registries</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {renderTable()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
