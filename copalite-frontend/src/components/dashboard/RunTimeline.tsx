'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/time';

const RUN_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-400',
  running: 'bg-sky-400',
  failed: 'bg-rose-400',
  cancelled: 'bg-coal-500',
  pending: 'bg-amber-400',
  blocked: 'bg-orange-400',
};

interface Run {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Props {
  readonly runs: Run[];
  readonly projectId: string;
}

export default function RunTimeline({ runs, projectId }: Props) {
  if (runs.length === 0) {
    return <p className="text-xs text-coal-500 italic">Nenhuma run registrada</p>;
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {runs.map((run) => {
        const dotColor = RUN_STATUS_COLORS[run.status] ?? 'bg-coal-500';
        const isRunning = run.status === 'running';

        return (
          <Link
            key={run.id}
            href={`/projects/${projectId}/runs`}
            className="flex flex-col items-center gap-1.5 min-w-[80px] group"
          >
            <span className="relative flex h-3 w-3">
              {isRunning && (
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColor}`} />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
            </span>
            <span className="text-[10px] text-coal-400 group-hover:text-coal-200 truncate max-w-[80px]">
              {run.title}
            </span>
            <span className="text-[9px] text-coal-600">{formatRelativeTime(run.createdAt)}</span>
          </Link>
        );
      })}
    </div>
  );
}
