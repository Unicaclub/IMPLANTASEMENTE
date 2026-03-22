'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bot, Loader2, AlertTriangle, RotateCw, Zap,
  CheckCircle2, XCircle, Archive, Clock
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import Skeleton from '@/components/shared/Skeleton';
import { api } from '@/lib/api';
import type { Agent } from '@/types';

const AGENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  orchestrator:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  architect:          { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  database_builder:   { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  backend_builder:    { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  frontend_builder:   { bg: 'bg-rose-500/10', text: 'text-rose-400' },
  validator:          { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  doc_writer:         { bg: 'bg-lime-500/10', text: 'text-lime-400' },
  devops_agent:       { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  qa_test_agent:      { bg: 'bg-pink-500/10', text: 'text-pink-400' },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: CheckCircle2,
  inactive: XCircle,
  archived: Archive,
};

function AgentCard({ agent }: { agent: Agent }) {
  const typeColor = AGENT_TYPE_COLORS[agent.agentType] ?? { bg: 'bg-coal-700/40', text: 'text-coal-300' };
  const StatusIcon = STATUS_ICONS[agent.status] ?? Clock;
  const statusColor = agent.status === 'active' ? 'text-emerald-400' : agent.status === 'inactive' ? 'text-coal-500' : 'text-amber-400';

  return (
    <div className="card-hover p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${typeColor.bg}`}>
            <Bot size={20} className={typeColor.text} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-coal-100">{agent.name}</h3>
            <p className="text-xs font-mono text-coal-500">{agent.slug}</p>
          </div>
        </div>
        <StatusIcon size={16} className={statusColor} />
      </div>

      {agent.description && (
        <p className="text-xs text-coal-400 line-clamp-2">{agent.description}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <span className={`badge text-[10px] ${typeColor.bg} ${typeColor.text} border border-current/20`}>
          {agent.agentType.replace(/_/g, ' ')}
        </span>
        {agent.executionOrder != null && (
          <span className="text-[10px] text-coal-500 font-mono">
            order: {agent.executionOrder}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await api.listAgents() as Agent[];
      setAgents(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  const activeCount = agents.filter(a => a.status === 'active').length;
  const sorted = [...agents].sort((a, b) => (a.executionOrder ?? 99) - (b.executionOrder ?? 99));

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Agents"
          subtitle={`${activeCount} active agent${activeCount !== 1 ? 's' : ''} available`}
        />

        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); setLoading(true); loadAgents(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton variant="card" count={6} />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="card p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-emerald-400" />
                  <span className="text-sm text-coal-300">
                    <strong className="text-emerald-400">{activeCount}</strong> active
                  </span>
                </div>
                <div className="w-px h-4 bg-coal-700" />
                <span className="text-sm text-coal-500">
                  {agents.length} total agents registered
                </span>
              </div>

              {/* Agent grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>

              {agents.length === 0 && !error && (
                <div className="card p-12 text-center">
                  <Bot className="mx-auto text-coal-600 mb-4" size={48} />
                  <p className="text-coal-400">No agents registered yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
