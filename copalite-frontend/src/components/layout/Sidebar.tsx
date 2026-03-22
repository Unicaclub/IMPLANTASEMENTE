'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Database, Play, GitBranch,
  FileSearch, ListChecks, CheckSquare, Shield, Settings,
  LogOut, Boxes, Globe, Code2, Layers, MonitorSmartphone, Activity, Bot
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

interface SidebarProps {
  projectId?: string;
  projectName?: string;
}

export default function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'System Health', href: '/dashboard/system', icon: Activity },
    { label: 'Workspaces', href: '/workspaces', icon: Boxes },
  ];

  const projectNav = projectId ? [
    { label: 'Overview', href: `/projects/${projectId}`, icon: LayoutDashboard },
    { label: 'Sources', href: `/projects/${projectId}/sources`, icon: Database },
    { label: 'Runs', href: `/projects/${projectId}/runs`, icon: Play },
    { label: 'Orchestration', href: `/projects/${projectId}/orchestration`, icon: GitBranch },
    { divider: true, label: 'Registries' },
    { label: 'Modules', href: `/projects/${projectId}/registries?tab=modules`, icon: Layers },
    { label: 'Routes', href: `/projects/${projectId}/registries?tab=routes`, icon: Globe },
    { label: 'APIs', href: `/projects/${projectId}/registries?tab=apis`, icon: Code2 },
    { label: 'Schemas', href: `/projects/${projectId}/registries?tab=schemas`, icon: Database },
    { label: 'UI Screens', href: `/projects/${projectId}/registries?tab=ui`, icon: MonitorSmartphone },
    { divider: true, label: 'Action' },
    { label: 'Evidence', href: `/projects/${projectId}/evidence`, icon: FileSearch },
    { label: 'Backlog', href: `/projects/${projectId}/backlog`, icon: ListChecks },
    { label: 'Tasks', href: `/projects/${projectId}/tasks`, icon: CheckSquare },
    { divider: true, label: 'Intelligence' },
    { label: 'Agents', href: `/projects/${projectId}/agents`, icon: Bot },
  ] : [];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-coal-950 border-r border-coal-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-coal-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-coal-100">
            Copalite
          </span>
          <span className="badge-info text-[10px] ml-1">v1.1</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive(item.href)
                ? 'bg-emerald-600/15 text-emerald-400'
                : 'text-coal-400 hover:text-coal-200 hover:bg-coal-800/60'
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}

        {/* Project section */}
        {projectId && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-coal-500">
                Project
              </p>
              {projectName && (
                <p className="text-sm font-medium text-coal-200 mt-0.5 truncate">
                  {projectName}
                </p>
              )}
            </div>

            {projectNav.map((item: any, i) => {
              if (item.divider) {
                return (
                  <div key={`div-${i}`} className="pt-4 pb-1 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-coal-600">
                      {item.label}
                    </p>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive(item.href)
                      ? 'bg-emerald-600/15 text-emerald-400'
                      : 'text-coal-400 hover:text-coal-200 hover:bg-coal-800/60'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-coal-800/60 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-coal-500 hover:text-coal-300 hover:bg-coal-800/60 transition-all"
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={async () => {
            await api.logout();
            window.location.href = '/auth/login';
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-coal-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
