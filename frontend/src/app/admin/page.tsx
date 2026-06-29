'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { apiRequest, getUser } from '../../utils/api';
import {
  ShieldCheck, Percent, RefreshCw, Coins, ShieldAlert,
  Store, Users, ShoppingBag, Clock, Check, X, Zap,
  Wallet, Ban, CheckCircle, AlertCircle, TrendingUp,
  Package, Eye, ChevronRight, Circle
} from 'lucide-react';

type AdminTab = 'overview' | 'pending' | 'stores' | 'users' | 'orders' | 'disputes' | 'settings';

const ROLE_BADGE: Record<string, string> = {
  admin:  'bg-violet-100 text-violet-700 border-violet-200',
  seller: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  buyer:  'bg-blue-100 text-blue-700 border-blue-200',
};
const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:  'bg-rose-100 text-rose-600 border-rose-200',
  suspended: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  disputed:  'bg-rose-100 text-rose-600 border-rose-200',
  cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab]                 = useState<AdminTab>('overview');
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [allStores, setAllStores]     = useState<any[]>([]);
  const [disputes, setDisputes]       = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [orders, setOrders]           = useState<any[]>([]);
  const [analytics, setAnalytics]     = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [feeInput, setFeeInput]       = useState('');
  const [airdropStatus, setAirdropStatus] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') router.replace('/dashboard');
  }, [router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes, disputesRes, analyticsRes, usersRes, ordersRes] = await Promise.all([
        apiRequest('/admin/pending-stores?status=pending'),
        apiRequest('/admin/all-stores?status=active'),
        apiRequest('/admin/disputes').catch(() => ({ success: false, data: [] })),
        apiRequest('/admin/analytics'),
        apiRequest('/admin/users'),
        apiRequest('/admin/orders')
      ]);
      if (pendingRes.success)   setPendingStores(pendingRes.data);
      if (allRes.success)       setAllStores(allRes.data);
      if (disputesRes.success)  setDisputes(disputesRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (usersRes.success)     setUsers(usersRes.data);
      if (ordersRes.success)    setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApproveStore = async (storeId: string, approve: boolean) => {
    setActionLoading(storeId);
    try {
      const res = await apiRequest('/admin/approve-store', {
        method: 'POST',
        body: JSON.stringify({ storeId, approve })
      });
      if (res.success) {
        showToast(`Store ${approve ? 'approved' : 'rejected'} successfully`);
        setPendingStores(prev => prev.filter(s => s.id !== storeId));
        if (approve) {
          const approved = pendingStores.find(s => s.id === storeId);
          if (approved) setAllStores(prev => [{ ...approved, status: 'active' }, ...prev]);
        }
      } else {
        showToast(res.message || 'Action failed', false);
      }
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    setActionLoading(userId + '-suspend');
    try {
      const res = await apiRequest('/admin/suspend-user', {
        method: 'POST',
        body: JSON.stringify({ userId, suspend })
      });
      if (res.success) {
        showToast(`User ${suspend ? 'suspended' : 'reactivated'} successfully`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: suspend ? 'suspended' : 'active' } : u));
      } else {
        showToast(res.message || 'Failed', false);
      }
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAirdrop = async (userId: string) => {
    setActionLoading(userId + '-airdrop');
    try {
      const res = await apiRequest('/admin/airdrop', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      if (res.success) {
        const r = res.data.results as Record<string, { success: boolean; error?: string }>;
        const failed = Object.entries(r).filter(([, v]) => !v.success).map(([t]) => t);
        const status = failed.length === 0
          ? { ok: true,  msg: '✓ 100 CELO · cUSD · USDC · USDT sent' }
          : { ok: false, msg: `Partial — failed: ${failed.join(', ')}` };
        setAirdropStatus(prev => ({ ...prev, [userId]: status }));
        showToast(status.msg, status.ok);
      } else {
        showToast(res.message || 'Airdrop failed', false);
      }
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setActionLoading(null);
      setTimeout(() => setAirdropStatus(prev => { const n = { ...prev }; delete n[userId]; return n; }), 8000);
    }
  };

  const handleSetFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(feeInput);
    if (isNaN(pct) || pct < 0 || pct > 10) return showToast('Fee must be between 0% and 10%', false);
    try {
      const res = await apiRequest('/admin/set-fee', {
        method: 'POST',
        body: JSON.stringify({ feeBps: Math.round(pct * 100) })
      });
      if (res.success) { showToast(`Platform fee set to ${pct}%`); setFeeInput(''); }
      else showToast(res.message || 'Failed', false);
    } catch (err: any) { showToast(err.message, false); }
  };

  const handleResolveDispute = async (dispute: any) => {
    const refundPct = parseFloat(refundAmounts[dispute.id] || '0');
    if (isNaN(refundPct) || refundPct < 0 || refundPct > 100) return showToast('Enter 0–100%', false);
    setActionLoading(dispute.id);
    try {
      await apiRequest(`/admin/disputes/${dispute.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ refundPercentage: refundPct })
      });
      showToast('Dispute resolved successfully');
      setDisputes(prev => prev.filter(d => d.id !== dispute.id));
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
        <p className="text-xs text-neutral-500 font-semibold">Loading admin console...</p>
      </div>
    </div>
  );

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',        icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: 'pending',   label: 'Pending',          icon: <Clock className="h-3.5 w-3.5" />,     badge: pendingStores.length },
    { id: 'stores',    label: 'Stores',           icon: <Store className="h-3.5 w-3.5" />,     badge: allStores.length },
    { id: 'users',     label: 'Users',            icon: <Users className="h-3.5 w-3.5" />,     badge: users.length },
    { id: 'orders',    label: 'Orders',           icon: <ShoppingBag className="h-3.5 w-3.5" />, badge: orders.length },
    { id: 'disputes',  label: 'Disputes',         icon: <ShieldAlert className="h-3.5 w-3.5" />, badge: disputes.length },
    { id: 'settings',  label: 'Settings',         icon: <Percent className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-xl border transition-all ${
          toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-neutral-950 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" /> Admin Console
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">Vendly Platform Management · Celo Sepolia</p>
          </div>
          <button onClick={fetchAll}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-600 transition-colors shadow-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-0 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? 'bg-white border border-b-white border-neutral-200 text-neutral-900 -mb-px'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}>
              {t.icon} {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                  t.id === 'pending' || t.id === 'disputes' ? 'bg-rose-500 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <section className="space-y-6">
            {/* Stat cards — clickable */}
            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Users',    value: analytics.totalUsers,    icon: <Users className="h-4 w-4" />,        color: 'text-blue-600 bg-blue-50',    tab: 'users' as AdminTab },
                  { label: 'Active Stores',  value: analytics.totalStores,   icon: <Store className="h-4 w-4" />,        color: 'text-emerald-600 bg-emerald-50', tab: 'stores' as AdminTab },
                  { label: 'Total Orders',   value: analytics.totalOrders,   icon: <ShoppingBag className="h-4 w-4" />, color: 'text-violet-600 bg-violet-50', tab: 'orders' as AdminTab },
                  { label: 'Pending Review', value: analytics.pendingStores, icon: <Clock className="h-4 w-4" />,        color: 'text-amber-600 bg-amber-50',   tab: 'pending' as AdminTab },
                  { label: 'Disputes',       value: analytics.totalDisputes ?? disputes.length, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50', tab: 'disputes' as AdminTab },
                  { label: 'Revenue (CELO)', value: Number(analytics.revenue || 0).toFixed(2), icon: <Coins className="h-4 w-4" />, color: 'text-neutral-600 bg-neutral-100', tab: null },
                ].map(stat => (
                  <button key={stat.label}
                    onClick={() => stat.tab && setTab(stat.tab)}
                    className={`bg-white rounded-2xl border border-neutral-200 p-4 text-left transition-all shadow-xs ${stat.tab ? 'hover:border-amber-300 hover:shadow-md cursor-pointer' : 'cursor-default'}`}>
                    <div className={`h-8 w-8 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>{stat.icon}</div>
                    <p className="text-xl font-black text-neutral-900 leading-none">{stat.value ?? '—'}</p>
                    <p className="text-[10px] text-neutral-400 font-semibold mt-1 leading-tight">{stat.label}</p>
                    {stat.tab && <ChevronRight className="h-3 w-3 text-neutral-300 mt-2" />}
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              {pendingStores.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-amber-900">Stores Awaiting Approval</h3>
                    <span className="rounded-full bg-amber-500 text-white text-[10px] font-black px-2 py-0.5">{pendingStores.length}</span>
                  </div>
                  <p className="text-xs text-amber-700">New seller applications need your review before they can list products.</p>
                  <button onClick={() => setTab('pending')}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors">
                    Review now <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {disputes.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-rose-900">Open Disputes</h3>
                    <span className="rounded-full bg-rose-500 text-white text-[10px] font-black px-2 py-0.5">{disputes.length}</span>
                  </div>
                  <p className="text-xs text-rose-700">Active escrow disputes require manual resolution to release or refund funds.</p>
                  <button onClick={() => setTab('disputes')}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 transition-colors">
                    Resolve now <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {pendingStores.length === 0 && disputes.length === 0 && (
                <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">All clear — no pending actions</p>
                  <p className="text-xs text-emerald-600 mt-1">No stores awaiting review and no open disputes.</p>
                </div>
              )}
            </div>

            {/* Recent orders preview */}
            {orders.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-neutral-900 flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" /> Recent Orders
                  </h3>
                  <button onClick={() => setTab('orders')} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-neutral-50">
                  {orders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-800 truncate">{o.buyer?.fullName || o.buyer?.email}</p>
                        <p className="text-[10px] text-neutral-400">{o.storeName} · {new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-neutral-700">{o.totalAmount} CELO</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_BADGE[o.status] || STATUS_BADGE.cancelled}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Pending Stores ── */}
        {tab === 'pending' && (
          <section className="space-y-3">
            {pendingStores.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="h-10 w-10 text-emerald-400" />}
                title="No stores awaiting review" sub="All applications have been processed." />
            ) : pendingStores.map(store => (
              <div key={store.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {store.logo?.url ? <img src={store.logo.url} alt={store.name} className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-neutral-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-neutral-900">{store.name}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE.pending}`}>pending</span>
                  </div>
                  {store.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{store.description}</p>}
                  <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-neutral-400">
                    <span>Owner: <span className="text-neutral-600 font-semibold">{store.ownerName || '—'}</span></span>
                    <span>{store.ownerEmail}</span>
                    <span>Applied {new Date(store.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveStore(store.id, true)} disabled={actionLoading === store.id}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 cursor-pointer">
                    {actionLoading === store.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                  </button>
                  <button onClick={() => handleApproveStore(store.id, false)} disabled={actionLoading === store.id}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 cursor-pointer">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── All Stores ── */}
        {tab === 'stores' && (
          <section className="space-y-3">
            {allStores.length === 0 ? (
              <EmptyState icon={<Store className="h-10 w-10 text-neutral-300" />} title="No active stores" sub="Approve pending stores to see them here." />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-neutral-100">
                  {allStores.map(store => (
                    <div key={store.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {store.logo?.url ? <img src={store.logo.url} alt={store.name} className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-neutral-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-neutral-900">{store.name}</p>
                        <p className="text-[11px] text-neutral-400">{store.ownerEmail} · Since {new Date(store.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE.active}`}>active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <section className="space-y-3">
            <p className="text-xs text-neutral-500">{users.length} registered users · <strong>Airdrop</strong> sends 100 CELO, cUSD, USDC, and USDT to the user's custodial wallet.</p>
            {users.length === 0 ? (
              <EmptyState icon={<Users className="h-10 w-10 text-neutral-300" />} title="No users yet" sub="" />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-neutral-100">
                  {users.map((user: any) => (
                    <div key={user.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-sm font-black text-amber-700">
                        {(user.fullName || user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-neutral-900">{user.fullName || user.username}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_BADGE[user.role] || ROLE_BADGE.buyer}`}>{user.role}</span>
                          {user.status === 'suspended' && (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 border-rose-200">suspended</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400">{user.email} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        {user.walletAddress
                          ? <p className="text-[10px] font-mono text-neutral-400 truncate max-w-xs"><Wallet className="inline h-2.5 w-2.5 mr-0.5" />{user.walletAddress}</p>
                          : <p className="text-[10px] text-neutral-300 italic">No wallet yet</p>
                        }
                        {airdropStatus[user.id] && (
                          <p className={`text-[10px] font-bold ${airdropStatus[user.id].ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {airdropStatus[user.id].msg}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleAirdrop(user.id)}
                          disabled={actionLoading === user.id + '-airdrop' || !user.walletAddress}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer">
                          {actionLoading === user.id + '-airdrop' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                          Airdrop
                        </button>
                        <button onClick={() => handleSuspendUser(user.id, user.status !== 'suspended')}
                          disabled={actionLoading === user.id + '-suspend' || user.role === 'admin'}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer ${
                            user.status === 'suspended'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                              : 'bg-neutral-100 hover:bg-rose-100 text-neutral-600 hover:text-rose-700'
                          }`}>
                          {actionLoading === user.id + '-suspend' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : user.status === 'suspended' ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <section className="space-y-3">
            {orders.length === 0 ? (
              <EmptyState icon={<ShoppingBag className="h-10 w-10 text-neutral-300" />} title="No orders yet" sub="Orders will appear here once buyers start purchasing." />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-500">{orders.length} total orders</p>
                </div>
                <div className="divide-y divide-neutral-100">
                  {orders.map((o: any) => (
                    <div key={o.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-neutral-900">{o.storeName || 'Unknown store'}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[o.status] || STATUS_BADGE.cancelled}`}>{o.status}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">Buyer: {o.buyer?.fullName || o.buyer?.email || '—'} · {new Date(o.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] font-mono text-neutral-300">{o.id}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-black text-neutral-900">{o.totalAmount} CELO</p>
                          {o.escrow && (
                            <p className="text-[10px] text-neutral-400">Stage {o.escrow.stage}/3 · {o.escrow.status}</p>
                          )}
                        </div>
                        {o.escrow && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status) && (
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map(stage => (
                              <button key={stage}
                                disabled={!o.escrow || o.escrow.stage !== stage - 1 || actionLoading === o.id + '-stage' + stage}
                                onClick={async () => {
                                  setActionLoading(o.id + '-stage' + stage);
                                  try {
                                    const res = await apiRequest('/admin/release-escrow', { method: 'POST', body: JSON.stringify({ orderId: o.id, stage }) });
                                    if (res.success) { showToast(`Stage ${stage} released`); fetchAll(); }
                                    else showToast(res.message || 'Failed', false);
                                  } catch (e: any) { showToast(e.message, false); }
                                  finally { setActionLoading(null); }
                                }}
                                className="rounded-lg bg-neutral-900 hover:bg-neutral-700 disabled:opacity-30 text-white text-[10px] font-bold px-2 py-1 transition-colors cursor-pointer">
                                S{stage}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Disputes ── */}
        {tab === 'disputes' && (
          <section className="space-y-4">
            {disputes.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="h-10 w-10 text-emerald-400" />}
                title="No active disputes" sub="All mediation cases have been resolved." />
            ) : disputes.map((dispute: any) => (
              <div key={dispute.id} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400">Case #{dispute.id?.slice(0, 8)}</span>
                    <h4 className="font-extrabold text-sm text-neutral-900 mt-0.5">{dispute.order?.totalAmount} CELO in escrow</h4>
                  </div>
                  <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1">{dispute.status}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-neutral-50 rounded-xl p-3 space-y-1">
                    <p className="font-bold text-neutral-500">Buyer's complaint</p>
                    <p className="text-neutral-700 leading-relaxed">"{dispute.reason}"</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 space-y-1.5 text-neutral-600">
                    <p><span className="font-bold text-neutral-400">Buyer:</span> {dispute.order?.buyer?.email || dispute.order?.buyer?.fullName || '—'}</p>
                    <p><span className="font-bold text-neutral-400">Order #:</span> {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</p>
                    <p><span className="font-bold text-neutral-400">Order:</span> {dispute.orderId?.slice(0, 12)}…</p>
                  </div>
                </div>
                <div className="flex items-end gap-3 pt-2 border-t border-neutral-100 max-w-sm">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Refund to buyer (%)</label>
                    <input type="number" min={0} max={100} placeholder="e.g. 70"
                      value={refundAmounts[dispute.id] || ''}
                      onChange={e => setRefundAmounts(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <button onClick={() => handleResolveDispute(dispute)} disabled={actionLoading === dispute.id}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-60 shrink-0 cursor-pointer">
                    {actionLoading === dispute.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <section className="grid sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-500" /> Platform Fee
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">Commission deducted from each completed order. Enter a percentage (max 10%). E.g. entering "2.5" sets 2.5%.</p>
              <form onSubmit={handleSetFee} className="space-y-3">
                <div className="relative">
                  <input type="number" required min="0" max="10" step="0.1" placeholder="e.g. 2.5"
                    value={feeInput} onChange={e => setFeeInput(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <span className="absolute right-3 top-3.5 text-sm font-bold text-neutral-400">%</span>
                </div>
                <button type="submit"
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-white transition-colors cursor-pointer">
                  Update Fee
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" /> Testnet Faucet
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Go to the <strong>Users</strong> tab and click <strong>Airdrop</strong> next to any user to send them 100 of each test token (CELO · cUSD · USDC · USDT).
              </p>
              <button onClick={() => setTab('users')}
                className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Zap className="h-4 w-4 text-amber-400" /> Go to Users
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-bold text-neutral-600">{title}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}
