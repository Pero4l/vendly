'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { Bell, ArrowLeft, ShieldCheck, Package, Wallet, AlertTriangle, CheckCircle, Info } from 'lucide-react';

function NotifIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4';
  if (type === 'order') return <Package className={cls} />;
  if (type === 'wallet') return <Wallet className={cls} />;
  if (type === 'dispute') return <AlertTriangle className={cls} />;
  if (type === 'escrow') return <ShieldCheck className={cls} />;
  if (type === 'success') return <CheckCircle className={cls} />;
  return <Info className={cls} />;
}

function iconColor(type: string) {
  if (type === 'dispute') return 'bg-rose-100 text-rose-600';
  if (type === 'wallet') return 'bg-emerald-100 text-emerald-600';
  if (type === 'order') return 'bg-blue-100 text-blue-600';
  if (type === 'escrow') return 'bg-emerald-100 text-emerald-600';
  if (type === 'success') return 'bg-emerald-100 text-emerald-600';
  return 'bg-amber-100 text-amber-600';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'order', title: 'Order Placed', message: 'Your order has been placed and is awaiting seller confirmation.', createdAt: new Date(Date.now() - 300000).toISOString(), read: false },
  { id: '2', type: 'escrow', title: 'Escrow Funded', message: 'Milestone 1 (30%) has been released to the seller.', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
  { id: '3', type: 'wallet', title: 'Wallet Created', message: 'Your custodial wallet is ready. Fund it to start trading.', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiRequest('/notifications')
      .then(res => {
        if (res.success && res.data?.length) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n: any) => !n.read).length);
        } else {
          setNotifications(MOCK_NOTIFICATIONS);
          setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.read).length);
        }
      })
      .catch(() => {
        setNotifications(MOCK_NOTIFICATIONS);
        setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.read).length);
      })
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await apiRequest('/notifications/read-all', { method: 'POST' }); } catch {}
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-neutral-500" />
            </Link>
            <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-bold">{unreadCount}</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-amber-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-neutral-100 p-4 animate-pulse flex gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center space-y-3">
            <Bell className="h-12 w-12 text-neutral-200 mx-auto" />
            <h2 className="text-lg font-bold text-neutral-700">All caught up!</h2>
            <p className="text-sm text-neutral-400">No notifications yet. We'll let you know when something happens.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div key={notif.id}
                className={`bg-white rounded-2xl border p-4 flex gap-3 transition-all ${notif.read ? 'border-neutral-100' : 'border-amber-200 bg-amber-50'}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor(notif.type)}`}>
                  <NotifIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold ${notif.read ? 'text-neutral-700' : 'text-neutral-900'}`}>{notif.title}</p>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.read && <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
