'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { apiRequest, getUser } from '../../utils/api';
import {
  ShieldCheck, Percent, CheckCircle, AlertTriangle, RefreshCw,
  XCircle, Coins, ShieldAlert, Store, Users, ShoppingBag,
  Clock, Check, X, BarChart2, Settings, Eye, Ban
} from 'lucide-react';
import Link from 'next/link';

type AdminTab = 'pending' | 'all-stores' | 'disputes' | 'settings';

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:  'bg-rose-100 text-rose-600 border-rose-200',
  suspended: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  inactive:  'bg-neutral-100 text-neutral-500 border-neutral-200',
};

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('pending');
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings state
  const [feePercentage, setFeePercentage] = useState('');
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes, disputesRes, analyticsRes] = await Promise.all([
        apiRequest('/admin/pending-stores?status=pending'),
        apiRequest('/admin/all-stores?status=active'),
        apiRequest('/admin/disputes').catch(() => ({ success: false, data: [] })),
        apiRequest('/admin/analytics')
      ]);
      if (pendingRes.success) setPendingStores(pendingRes.data);
      if (allRes.success) setAllStores(allRes.data);
      if (disputesRes.success) setDisputes(disputesRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
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
        setPendingStores(prev => prev.filter(s => s.id !== storeId));
        if (approve) {
          // move to all-stores list
          const approved = pendingStores.find(s => s.id === storeId);
          if (approved) setAllStores(prev => [{ ...approved, status: 'active' }, ...prev]);
        }
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (dispute: any) => {
    const refundPct = parseFloat(refundAmounts[dispute.id] || '0');
    if (isNaN(refundPct) || refundPct < 0 || refundPct > 100) {
      alert('Enter a refund percentage between 0 and 100.');
      return;
    }
    setActionLoading(dispute.id);
    try {
      await apiRequest(`/admin/disputes/${dispute.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ refundPercentage: refundPct })
      });
      setDisputes(prev => prev.filter(d => d.id !== dispute.id));
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPlatformFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(feePercentage);
    if (isNaN(pct) || pct < 0 || pct > 10) {
      alert('Fee must be between 0% and 10%.');
      return;
    }
    try {
      await apiRequest('/admin/set-fee', {
        method: 'POST',
        body: JSON.stringify({ feeBps: Math.round(pct * 100) })
      });
      setSettingsMsg(`Platform fee set to ${pct}%`);
      setFeePercentage('');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      setSettingsMsg(`Error: ${err.message}`);
    }
  };

  const TABS: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'pending',    label: 'Pending Stores', count: pendingStores.length },
    { id: 'all-stores', label: 'Active Stores',  count: allStores.length },
    { id: 'disputes',   label: 'Disputes',        count: disputes.length },
    { id: 'settings',   label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
          <p className="text-xs text-neutral-500 font-semibold">Loading admin console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-neutral-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-neutral-950 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
              Platform Admin Console
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">Manage stores, disputes, and platform settings</p>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Analytics strip */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users',    value: analytics.totalUsers,    icon: <Users className="h-4 w-4 text-blue-500" />,    bg: 'bg-blue-50' },
              { label: 'Active Stores',  value: analytics.totalStores,   icon: <Store className="h-4 w-4 text-emerald-500" />, bg: 'bg-emerald-50' },
              { label: 'Total Orders',   value: analytics.totalOrders,   icon: <ShoppingBag className="h-4 w-4 text-violet-500" />, bg: 'bg-violet-50' },
              { label: 'Pending Review', value: analytics.pendingStores, icon: <Clock className="h-4 w-4 text-amber-500" />,   bg: 'bg-amber-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>{stat.icon}</div>
                <div>
                  <p className="text-lg font-black text-neutral-900 leading-none">{stat.value ?? '—'}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-200 pb-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-white border border-b-white border-neutral-200 text-neutral-900 -mb-px'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${t.id === 'pending' || t.id === 'disputes' ? 'bg-rose-100 text-rose-600' : 'bg-neutral-100 text-neutral-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending Stores ── */}
        {tab === 'pending' && (
          <section className="space-y-3">
            {pendingStores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
                <p className="text-sm font-bold text-neutral-600">No stores waiting for review</p>
                <p className="text-xs text-neutral-400 mt-1">All applications have been processed.</p>
              </div>
            ) : (
              pendingStores.map(store => (
                <div key={store.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Logo */}
                  <div className="h-12 w-12 rounded-xl bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {store.logo?.url
                      ? <img src={store.logo.url} alt={store.name} className="h-full w-full object-cover" />
                      : <Store className="h-6 w-6 text-neutral-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-neutral-900">{store.name}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[store.status] || STATUS_BADGE.inactive}`}>
                        {store.status}
                      </span>
                    </div>
                    {store.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{store.description}</p>}
                    <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-neutral-400">
                      <span>Owner: <span className="text-neutral-600 font-semibold">{store.ownerName || '—'}</span></span>
                      <span>{store.ownerEmail}</span>
                      <span>Applied: {new Date(store.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveStore(store.id, true)}
                      disabled={actionLoading === store.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60"
                    >
                      {actionLoading === store.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveStore(store.id, false)}
                      disabled={actionLoading === store.id}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── All Active Stores ── */}
        {tab === 'all-stores' && (
          <section className="space-y-3">
            {allStores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
                <Store className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
                <p className="text-sm font-bold text-neutral-600">No active stores yet</p>
              </div>
            ) : (
              allStores.map(store => (
                <div key={store.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {store.logo?.url
                      ? <img src={store.logo.url} alt={store.name} className="h-full w-full object-cover" />
                      : <Store className="h-5 w-5 text-neutral-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-neutral-900">{store.name}</p>
                    <p className="text-[11px] text-neutral-400">{store.ownerEmail} · Active since {new Date(store.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE.active}`}>
                    active
                  </span>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Disputes ── */}
        {tab === 'disputes' && (
          <section className="space-y-4">
            {disputes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
                <p className="text-sm font-bold text-neutral-600">No active disputes</p>
                <p className="text-xs text-neutral-400 mt-1">All mediation cases have been resolved.</p>
              </div>
            ) : (
              disputes.map((dispute: any) => (
                <div key={dispute.id} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400">Case #{dispute.id?.slice(0, 8)}</span>
                      <h4 className="font-extrabold text-sm text-neutral-900 mt-0.5">{dispute.order?.totalAmount} CELO in escrow</h4>
                    </div>
                    <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1">
                      {dispute.status}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-neutral-50 rounded-xl p-3 space-y-1">
                      <p className="font-bold text-neutral-500">Buyer's complaint</p>
                      <p className="text-neutral-700 leading-relaxed">"{dispute.reason}"</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-3 space-y-1.5 text-neutral-600">
                      <p><span className="font-bold text-neutral-400">Buyer:</span> {dispute.order?.user?.email}</p>
                      <p><span className="font-bold text-neutral-400">Seller:</span> {dispute.order?.store?.name}</p>
                      <p><span className="font-bold text-neutral-400">Order:</span> {dispute.orderId?.slice(0, 12)}…</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 pt-2 border-t border-neutral-100 max-w-sm">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Refund to buyer (%)</label>
                      <input
                        type="number" min={0} max={100} placeholder="e.g. 70"
                        value={refundAmounts[dispute.id] || ''}
                        onChange={e => setRefundAmounts(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => handleResolveDispute(dispute)}
                      disabled={actionLoading === dispute.id}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-60 shrink-0"
                    >
                      {actionLoading === dispute.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                      Resolve & Disburse
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <section className="grid sm:grid-cols-2 gap-6">
            {/* Platform fee */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-500" /> Platform Fee
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Set the commission % deducted from each completed order. Max 10%.
              </p>
              {settingsMsg && (
                <div className={`rounded-xl p-3 text-xs font-semibold ${settingsMsg.startsWith('Error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {settingsMsg}
                </div>
              )}
              <form onSubmit={handleSetPlatformFee} className="space-y-3">
                <input
                  type="text" required placeholder="e.g. 2.5"
                  value={feePercentage}
                  onChange={e => setFeePercentage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="submit" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-white transition-colors">
                  Update Fee
                </button>
              </form>
            </div>

            {/* Withdraw fees */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" /> Withdraw Commissions
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Withdraw accumulated platform fees from the escrow smart contract to the admin wallet.
              </p>
              <button
                onClick={async () => {
                  try {
                    await apiRequest('/admin/withdraw-fees', { method: 'POST' });
                    alert('Withdrawal initiated successfully.');
                  } catch (err: any) {
                    alert(`Failed: ${err.message}`);
                  }
                }}
                className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                <Coins className="h-4 w-4 text-amber-400" /> Withdraw CELO Fees
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
