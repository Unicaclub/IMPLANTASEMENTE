'use client';

import {
  Play, ListTodo, FileText, Database, GitCompare, BarChart2, Activity,
  FileSearch, Bot, CheckSquare, Shield,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/time';
import type { ActivityHistoryResponse } from '@/types/activity';

const ENTITY_ICONS: Record<string, typeof Activity> = {
  run: Play,
  runs: Play,
  backlog_item: ListTodo,
  backlog: ListTodo,
  document: FileText,
  documents: FileText,
  source: Database,
  sources: Database,
  comparison: GitCompare,
  comparisons: GitCompare,
  report: BarChart2,
  reports: BarChart2,
  evidence: FileSearch,
  task: CheckSquare,
  tasks: CheckSquare,
  agent: Bot,
  agents: Bot,
  audit: Shield,
  audits: Shield,
};

interface Props {
  readonly activity: ActivityHistoryResponse;
}

export default function ActivityFeedItem({ activity }: Props) {
  const Icon = ENTITY_ICONS[activity.entityType] ?? Activity;
  const description = activity.description || `${activity.actionType} em ${activity.entityType}`;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-coal-800/40 last:border-0">
      <div className="p-1.5 rounded-lg bg-coal-800/50 shrink-0 mt-0.5">
        <Icon size={14} className="text-coal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-coal-200 line-clamp-2">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-coal-500">{formatRelativeTime(activity.createdAt)}</span>
          <span className="badge-neutral text-[10px]">{activity.entityType}</span>
        </div>
      </div>
    </div>
  );
}
