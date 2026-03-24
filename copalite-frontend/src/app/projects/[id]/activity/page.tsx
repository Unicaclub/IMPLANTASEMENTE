'use client';

import { useParams } from 'next/navigation';
import { Activity, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ActivityFeedItem from '@/components/activity/ActivityFeedItem';
import { useActivity } from '@/hooks/useActivity';

export default function ActivityPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const { activities, loading, error, refetch } = useActivity(projectId);

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Historico de Atividades"
          subtitle={`${activities.length} atividades registradas`}
        />

        <div className="p-8 space-y-6">
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
          ) : !error && activities.length === 0 ? (
            <div className="card p-12 text-center">
              <Activity className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma atividade registrada</p>
              <p className="text-xs text-coal-500 mt-1">Atividades aparecerao conforme o projeto for utilizado</p>
            </div>
          ) : (
            <div className="card p-4">
              {activities.map((a) => (
                <ActivityFeedItem key={a.id} activity={a} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
