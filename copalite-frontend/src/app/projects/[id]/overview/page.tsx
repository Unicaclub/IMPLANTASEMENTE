"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Globe,
  Code2,
  Database,
  Loader2,
  AlertTriangle,
  RotateCw,
  Play,
  Clock,
  CheckCircle2,
  FileSearch,
  ArrowRight,
  Zap,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface RegistryCounts {
  modules: number;
  routes: number;
  apis: number;
  schemas: number;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<any>(null);
  const [counts, setCounts] = useState<RegistryCounts>({
    modules: 0,
    routes: 0,
    apis: 0,
    schemas: 0,
  });
  const [evidence, setEvidence] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [runs, modules, routes, apis, schemas, ev] = await Promise.all([
        api.listRuns(projectId, 1, 50),
        api.listModules(projectId, 1, 1),
        api.listRoutes(projectId, 1, 1),
        api.listApis(projectId, 1, 1),
        api.listSchemas(projectId, 1, 1),
        api.listEvidence(projectId, 1, 3),
      ]);

      const completedRun = (Array.isArray(runs) ? runs : []).find(
        (r: any) => r.status === "completed",
      );
      setLastRun(completedRun ?? null);

      setCounts({
        modules: Array.isArray(modules) ? modules.length : 0,
        routes: Array.isArray(routes) ? routes.length : 0,
        apis: Array.isArray(apis) ? apis.length : 0,
        schemas: Array.isArray(schemas) ? schemas.length : 0,
      });

      setEvidence(Array.isArray(ev) ? ev.slice(0, 3) : []);
    } catch (err: any) {
      setError(err.message || "Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }

  const hasData =
    counts.modules + counts.routes + counts.apis + counts.schemas > 0 ||
    lastRun ||
    evidence.length > 0;

  function runDuration(run: any): string {
    if (!run.createdAt || !run.updatedAt) return "—";
    const ms =
      new Date(run.updatedAt).getTime() - new Date(run.createdAt).getTime();
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60_000)}min`;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Overview" subtitle="Project summary" />

        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="btn-secondary mt-4 gap-2"
              >
                <RotateCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!error && loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-coal-500" size={32} />
            </div>
          )}

          {!error && !loading && !hasData && (
            <div className="card p-12 text-center">
              <Zap className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-300 font-medium">
                Nenhum dado encontrado
              </p>
              <p className="text-xs text-coal-500 mt-1">
                Execute um pipeline para começar a descoberta do projeto.
              </p>
              <Link
                href={`/projects/${projectId}/orchestration`}
                className="btn-primary mt-4 inline-flex gap-2"
              >
                <Play size={14} /> Iniciar Pipeline
              </Link>
            </div>
          )}

          {!error && !loading && hasData && (
            <>
              {/* Registry counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href={`/projects/${projectId}/registries?tab=modules`}>
                  <div className="card-hover p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                        <Layers size={18} />
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-coal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-2xl font-bold text-coal-50">
                      {counts.modules}
                    </p>
                    <p className="text-xs text-coal-500 mt-1">Modules</p>
                  </div>
                </Link>

                <Link href={`/projects/${projectId}/registries?tab=routes`}>
                  <div className="card-hover p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                        <Globe size={18} />
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-coal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-2xl font-bold text-coal-50">
                      {counts.routes}
                    </p>
                    <p className="text-xs text-coal-500 mt-1">Routes</p>
                  </div>
                </Link>

                <Link href={`/projects/${projectId}/registries?tab=apis`}>
                  <div className="card-hover p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Code2 size={18} />
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-coal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-2xl font-bold text-coal-50">
                      {counts.apis}
                    </p>
                    <p className="text-xs text-coal-500 mt-1">APIs</p>
                  </div>
                </Link>

                <Link href={`/projects/${projectId}/registries?tab=schemas`}>
                  <div className="card-hover p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Database size={18} />
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-coal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-2xl font-bold text-coal-50">
                      {counts.schemas}
                    </p>
                    <p className="text-xs text-coal-500 mt-1">Schemas</p>
                  </div>
                </Link>
              </div>

              {/* Last completed run */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-coal-300 mb-4 flex items-center gap-2">
                  <Play size={16} className="text-violet-400" /> Último Run
                  Completado
                </h3>
                {lastRun ? (
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-coal-100">
                        {lastRun.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-coal-500 font-mono">
                          {lastRun.runType?.replaceAll("_", " ")}
                        </span>
                        <span className="text-xs text-coal-600">·</span>
                        <span className="text-xs text-coal-500">
                          {formatDistanceToNow(new Date(lastRun.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-xs text-coal-600">·</span>
                        <span className="text-xs text-coal-400 flex items-center gap-1">
                          <Clock size={12} /> {runDuration(lastRun)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={lastRun.status} />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-coal-500">
                      Nenhum run completado ainda.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent evidence */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-coal-300 flex items-center gap-2">
                    <FileSearch size={16} className="text-teal-400" />{" "}
                    Evidências Recentes
                  </h3>
                  {evidence.length > 0 && (
                    <Link
                      href={`/projects/${projectId}/evidence`}
                      className="text-xs text-coal-400 hover:text-coal-200 transition-colors flex items-center gap-1"
                    >
                      Ver todas <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
                {evidence.length > 0 ? (
                  <div className="space-y-3">
                    {evidence.map((ev: any) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-coal-800/30 border border-coal-800/50"
                      >
                        <FileSearch
                          size={14}
                          className="text-coal-500 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-coal-200 truncate">
                            {ev.title || ev.contentExcerpt?.slice(0, 80) || "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-coal-500">
                              {ev.evidenceType?.replaceAll("_", " ")}
                            </span>
                            <span className="text-[10px] text-coal-600">
                              {new Date(ev.createdAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-coal-500">
                      Nenhuma evidência coletada ainda.
                    </p>
                  </div>
                )}
              </div>

              {/* CTA: Start pipeline */}
              <div className="card p-6 text-center border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-transparent">
                <Zap className="mx-auto text-emerald-400 mb-2" size={24} />
                <p className="text-sm font-medium text-coal-200 mb-1">
                  Pronto para descobrir mais?
                </p>
                <p className="text-xs text-coal-500 mb-4">
                  Inicie um novo pipeline de análise para expandir os
                  registries.
                </p>
                <Link
                  href={`/projects/${projectId}/orchestration`}
                  className="btn-primary inline-flex gap-2"
                >
                  <Play size={14} /> Iniciar Novo Pipeline
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
