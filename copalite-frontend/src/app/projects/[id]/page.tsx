'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Database, Play, Layers, Globe, Code2, MonitorSmartphone,
  FileSearch, ListChecks, CheckSquare, ArrowRight, TrendingUp,
  Activity, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle, Zap, Download
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

function MetricCard({ icon: Icon, label, value, color, href }: any) {
  const content = (
    <div className="card-hover p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
        {href && <ArrowRight size={14} className="text-coal-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />}
      </div>
      <p className="text-2xl font-bold text-coal-50">{value}</p>
      <p className="text-xs text-coal-500 mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

const STATUS_ICON: Record<string, { icon: any; color: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400' },
  running: { icon: Activity, color: 'text-sky-400' },
  failed: { icon: XCircle, color: 'text-rose-400' },
  pending: { icon: Clock, color: 'text-coal-400' },
  cancelled: { icon: AlertTriangle, color: 'text-amber-400' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setDashboard(await api.getProjectDashboard(projectId)); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [projectId]);

  if (loading) return (
    <div className="flex min-h-screen"><Sidebar projectId={projectId} /><main className="flex-1 ml-[260px] flex items-center justify-center"><Loader2 className="animate-spin text-coal-500" size={32} /></main></div>
  );
  async function handleExport() {
    try {
      const report = await api.exportProjectReport(projectId);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `copalite-report-${projectId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Export failed:', err); }
  }

  if (!dashboard) return null;
  const d = dashboard;

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} projectName={d.project.name} />
      <main className="flex-1 ml-[260px]">
        <Header title={d.project.name} subtitle={`${d.project.projectType} · ${d.project.status}`}
          actions={<div className="flex items-center gap-2"><button onClick={handleExport} className="btn-secondary gap-2"><Download size={16} /> Export</button><Link href={`/projects/${projectId}/orchestration`} className="btn-primary gap-2"><Zap size={16} /> Start Run</Link></div>} />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard icon={Database} label="Sources" value={d.sources.total} color="bg-sky-500/10 text-sky-400" href={`/projects/${projectId}/sources`} />
            <MetricCard icon={Play} label="Runs" value={d.runs.total} color="bg-violet-500/10 text-violet-400" href={`/projects/${projectId}/runs`} />
            <MetricCard icon={TrendingUp} label="Discovered" value={d.registries.totalDiscovered} color="bg-emerald-500/10 text-emerald-400" />
            <MetricCard icon={FileSearch} label="Evidence" value={d.evidence.total} color="bg-amber-500/10 text-amber-400" href={`/projects/${projectId}/evidence`} />
            <MetricCard icon={ListChecks} label="Backlog" value={d.backlog.total} color="bg-rose-500/10 text-rose-400" href={`/projects/${projectId}/backlog`} />
            <MetricCard icon={CheckSquare} label="Tasks" value={d.tasks.total} color="bg-teal-500/10 text-teal-400" href={`/projects/${projectId}/tasks`} />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5">
              <div className="card p-6">
                <h3 className="section-title mb-4">Technical Registries</h3>
                <div className="space-y-3">
                  {[
                    { icon: Layers, label: 'Modules', value: d.registries.modules, color: 'text-violet-400' },
                    { icon: Globe, label: 'Routes', value: d.registries.routes, color: 'text-sky-400' },
                    { icon: Code2, label: 'API Endpoints', value: d.registries.apis, color: 'text-emerald-400' },
                    { icon: Database, label: 'Schemas', value: d.registries.schemas, color: 'text-amber-400' },
                    { icon: MonitorSmartphone, label: 'UI Screens', value: d.registries.uiScreens, color: 'text-rose-400' },
                  ].map((reg) => (
                    <div key={reg.label} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3"><reg.icon size={16} className={reg.color} /><span className="text-sm text-coal-300">{reg.label}</span></div>
                      <span className="text-sm font-bold text-coal-100">{reg.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-coal-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-coal-200">Total Discovered</span>
                      <span className="text-lg font-bold text-emerald-400">{d.registries.totalDiscovered}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-7">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">Recent Runs</h3>
                  <Link href={`/projects/${projectId}/runs`} className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>
                </div>
                {d.runs.recent.length === 0 ? (
                  <div className="text-center py-8"><Play className="mx-auto text-coal-600 mb-2" size={28} /><p className="text-sm text-coal-500">No runs yet</p></div>
                ) : (
                  <div className="space-y-2">
                    {d.runs.recent.map((run: any) => {
                      const s = STATUS_ICON[run.status] || STATUS_ICON.pending;
                      return (
                        <Link key={run.id} href={`/projects/${projectId}/orchestration`} className="flex items-center justify-between p-3 rounded-lg hover:bg-coal-800/40 transition-all group">
                          <div className="flex items-center gap-3">
                            <s.icon size={16} className={`${s.color} ${run.status === 'running' ? 'animate-spin' : ''}`} />
                            <div><p className="text-sm font-medium text-coal-200 group-hover:text-coal-50">{run.title}</p><p className="text-[11px] text-coal-500 font-mono">{run.runType}</p></div>
                          </div>
                          <span className="text-[11px] text-coal-500">{new Date(run.createdAt).toLocaleDateString()}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-coal-800">
                  <div className="text-center"><p className="text-lg font-bold text-emerald-400">{d.runs.completed}</p><p className="text-[11px] text-coal-500">Completed</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-sky-400">{d.runs.running}</p><p className="text-[11px] text-coal-500">Running</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-rose-400">{d.runs.failed}</p><p className="text-[11px] text-coal-500">Failed</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4"><h3 className="section-title">Backlog</h3><Link href={`/projects/${projectId}/backlog`} className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</Link></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><p className="text-2xl font-bold text-coal-100">{d.backlog.total}</p><p className="text-xs text-coal-500">Total</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-amber-400">{d.backlog.open}</p><p className="text-xs text-coal-500">Open</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-emerald-400">{d.backlog.approved}</p><p className="text-xs text-coal-500">Approved</p></div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4"><h3 className="section-title">Tasks</h3><Link href={`/projects/${projectId}/tasks`} className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</Link></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><p className="text-2xl font-bold text-coal-100">{d.tasks.total}</p><p className="text-xs text-coal-500">Total</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-sky-400">{d.tasks.inProgress}</p><p className="text-xs text-coal-500">In Progress</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-emerald-400">{d.tasks.done}</p><p className="text-xs text-coal-500">Done</p></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
