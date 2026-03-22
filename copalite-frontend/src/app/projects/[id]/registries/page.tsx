'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Layers, Globe, Code2, Database, MonitorSmartphone, Loader2, Search,
  AlertTriangle, RotateCw
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
];

const CONFIDENCE_BADGE: Record<string, string> = {
  confirmed: 'badge-success',
  inferred: 'badge-info',
  divergent: 'badge-warning',
  unvalidated: 'badge-neutral',
  outdated: 'badge-danger',
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

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, projectId]);

  async function loadTab(tab: string) {
    setLoading(true);
    setError(null);
    try {
      let result: any[] = [];
      switch (tab) {
        case 'modules': result = await api.listModules(projectId); break;
        case 'routes': result = await api.listRoutes(projectId); break;
        case 'apis': result = await api.listApis(projectId); break;
        case 'schemas': result = await api.listSchemas(projectId); break;
        case 'ui': result = await api.listUiScreens(projectId); break;
      }
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (item.name || item.entityName || item.screenName || '').toLowerCase().includes(s) ||
           (item.path || item.description || '').toLowerCase().includes(s);
  });

  function renderItem(item: any) {
    const name = item.name || item.entityName || item.screenName || 'Unnamed';
    const desc = item.description || item.path || item.tableName || '';
    const confidence = item.confidenceStatus;

    return (
      <div key={item.id} className="card p-4 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-coal-100 truncate">{name}</h4>
              {item.slug && <span className="text-[10px] text-coal-500 font-mono">{item.slug}</span>}
            </div>
            {desc && <p className="text-xs text-coal-400 mt-1 truncate">{desc}</p>}
            <div className="flex items-center gap-2 mt-2">
              {item.layerType && <span className="badge-neutral text-[10px]">{item.layerType}</span>}
              {item.routeType && <span className="badge-neutral text-[10px]">{item.routeType}</span>}
              {item.httpMethod && <span className="badge-info text-[10px]">{item.httpMethod}</span>}
              {item.stateType && <span className="badge-neutral text-[10px]">{item.stateType}</span>}
              {confidence && <span className={`badge text-[10px] ${CONFIDENCE_BADGE[confidence] || 'badge-neutral'}`}>{confidence}</span>}
            </div>
          </div>
          {item.method && <span className="badge-info text-[10px] font-mono flex-shrink-0">{item.method}</span>}
        </div>
      </div>
    );
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

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coal-500" />
            <input className="input-field pl-9" placeholder={`Search ${activeTab}...`}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <p className="text-xs text-coal-500">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filtered.map(renderItem)}</div>
          )}
        </div>
      </main>
    </div>
  );
}
