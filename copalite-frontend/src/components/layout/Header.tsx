'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-coal-800/60 bg-coal-950/80 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-coal-50 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-coal-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="p-2 rounded-lg text-coal-500 hover:text-coal-300 hover:bg-coal-800/60 transition-all">
          <Search size={18} />
        </button>
        <Link href="/notifications" className="p-2 rounded-lg text-coal-500 hover:text-coal-300 hover:bg-coal-800/60 transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold ml-2">
          A
        </div>
      </div>
    </header>
  );
}
