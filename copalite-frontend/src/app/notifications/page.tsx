'use client';

import { useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Info, AlertTriangle, XCircle, Loader2,
  RotateCw, Check
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pipeline_started:   { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  pipeline_completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  pipeline_failed:    { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  backlog_approved:   { icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  task_created:       { icon: Info, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info:               { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  success:            { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error:              { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceAndNotifications();
  }, []);

  async function loadWorkspaceAndNotifications() {
    try {
      const workspaces = await api.listWorkspaces();
      if (workspaces.length > 0) {
        const wsId = workspaces[0].id;
        setWorkspaceId(wsId);
        const notifs = await api.listNotifications(wsId);
        setNotifications(notifs);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    setMarkingRead(id);
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMarkingRead(null);
    }
  }

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Notifications"
          subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        />

        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); loadWorkspaceAndNotifications(); }} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Try again
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const isRead = !!notif.readAt;
                return (
                  <div
                    key={notif.id}
                    className={`card p-4 animate-fade-in transition-all ${
                      isRead ? 'opacity-60' : 'border-l-2 border-l-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
                        <cfg.icon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={`text-sm font-semibold ${isRead ? 'text-coal-400' : 'text-coal-100'}`}>
                            {notif.title}
                          </h3>
                          <span className={`badge text-[10px] ${cfg.bg} ${cfg.color}`}>
                            {notif.type.replace(/_/g, ' ')}
                          </span>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-coal-400">{notif.message}</p>
                        <span className="text-[11px] text-coal-500 mt-1 block">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          disabled={markingRead === notif.id}
                          className="btn-secondary py-1.5 px-2.5 text-xs gap-1 flex-shrink-0 disabled:opacity-50"
                        >
                          {markingRead === notif.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
