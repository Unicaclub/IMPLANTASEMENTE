'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Database, Play, GitBranch,
  FileSearch, ListChecks, CheckSquare, Shield,
  LogOut, Boxes, Globe, Code2, Layers, MonitorSmartphone, Activity, Bot, Bell,
  Menu, X, GitCompare, ShieldAlert, History, BarChart2, ClipboardList,
  Crosshair, Monitor
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

interface SidebarProps {
  projectId?: string;
  projectName?: string;
}

export default function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Saude', href: '/admin/health', icon: ShieldAlert },
    { label: 'Notificacoes', href: '/notifications', icon: Bell },
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
    { label: 'Comparisons', href: `/projects/${projectId}/comparisons`, icon: GitCompare },
    { label: 'Backlog', href: `/projects/${projectId}/backlog`, icon: ListChecks },
    { label: 'Tasks', href: `/projects/${projectId}/tasks`, icon: CheckSquare },
    { label: 'Audits', href: `/projects/${projectId}/audits`, icon: ClipboardList },
    { label: 'Reports', href: `/projects/${projectId}/reports`, icon: BarChart2 },
    { divider: true, label: 'Browser' },
    { label: 'Targets', href: `/projects/${projectId}/targets`, icon: Crosshair },
    { label: 'Browser Runs', href: `/projects/${projectId}/browser-runs`, icon: Monitor },
    { label: 'Run Diff', href: `/projects/${projectId}/browser-runs/diff`, icon: GitCompare },
    { divider: true, label: 'Intelligence' },
    { label: 'Agents', href: `/projects/${projectId}/agents`, icon: Bot },
    { label: 'Atividade', href: `/projects/${projectId}/activity`, icon: History },
  ] : [];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-coal-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-coal-100">Copalite</span>
          <span className="badge-info text-[10px] ml-1">v2.2</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-coal-400 hover:text-coal-200">
          <X size={20} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
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

        {projectId && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-coal-500">Project</p>
              {projectName && <p className="text-sm font-medium text-coal-200 mt-0.5 truncate">{projectName}</p>}
            </div>
            {projectNav.map((item: any, i) => {
              if (item.divider) {
                return (
                  <div key={`div-${i}`} className="pt-4 pb-1 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-coal-600">{item.label}</p>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
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
        <button
          onClick={async () => { await api.logout(); window.location.href = '/auth/login'; }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-coal-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-coal-900 border border-coal-800 text-coal-300 hover:text-coal-100"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in */}
      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 w-[260px] bg-coal-950 border-r border-coal-800/60 flex flex-col z-50 transition-transform duration-300',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
