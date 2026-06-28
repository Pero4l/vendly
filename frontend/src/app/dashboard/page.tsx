'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { apiRequest, getUser } from '../../utils/api';
import {
  Bell, ShieldAlert, CheckCircle, Package, Truck, ShieldCheck, RefreshCw,
  BarChart2, TrendingUp, DollarSign, ShoppingBag, Store, Star, Clock,
  Users, Settings, ArrowRight, AlertTriangle, Wallet, Eye, ChevronRight,
  Award, Zap, Activity
} from 'lucide-react';
import Link from 'next/link';

// ─── STATUS META ──────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid:       { label: 'Paid',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  shipped:    { label: 'Shipped',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  delivered:  { label: 'Delivered',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  completed:  { label: 'Completed',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  disputed:   { label: 'Disputed',   cls: 'bg-rose-100 text-rose-600 border-rose-200' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
};

// ─── BUYER DASHBOARD ─────────────────────────────────────────
function BuyerDashboard({ profile, walletData }: { profile: any; walletData: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/orders').catch(() => ({ success: false, data: [] })),
      apiRequest('/notifications').catch(() => ({ success: false, data: [] })),
    ]).then(([oRes, nRes]) => {
      if (oRes.success) setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      if (nRes.success) setNotifications(nRes.data || []);
      setLoading(false);
    });
  }, []);

  const handleOpenDispute = async (orderId: string) => {
    const reason = disputeNotes[orderId] || 'Item not received or damaged.';
    try {
      await apiRequest('/disputes', { method: 'POST', body: JSON.stringify({ orderId, reason }) });
      const res = await apiRequest('/orders');
      if (res.success) setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) { alert(err.message); }
  };

  const stageOf = (status: string) => {
    if (['delivered', 'completed'].includes(status)) return 3;
    if (status === 'shipped') return 2;
    if (['paid', 'processing'].includes(status)) return 1;
    return 0;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Welcome */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Buyer Account</p>
          <h1 className="text-2xl font-black text-neutral-950">
            Welcome back, {profile?.fullName?.split(' ')[0] || profile?.username || 'Buyer'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Track your orders, escrow stages, and disputes here.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 min-w-[200px]">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <span className={`h-2 w-2 rounded-full ${walletData ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            Wallet
          </p>
          <p className="text-xs font-mono font-bold text-neutral-700 truncate">
            {walletData?.address ? `${walletData.address.slice(0, 14)}…${walletData.address.slice(-6)}` : 'Creating wallet…'}
          </p>
          {walletData?.balance !== undefined && (
            <p className="text-sm font-black text-neutral-900 mt-1">{Number(walletData.balance).toFixed(4)} CELO</p>
          )}
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'In Transit',   value: orders.filter(o => o.status === 'shipped').length,    icon: <Truck className="h-4 w-4 text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Delivered',    value: orders.filter(o => ['delivered','completed'].includes(o.status)).length, icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Disputes',     value: orders.filter(o => o.status === 'disputed').length,   icon: <ShieldAlert className="h-4 w-4 text-rose-500" />, bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-black text-neutral-900 leading-none">{s.value}</p>
              <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Orders */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" /> My Purchases
          </h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
              <Package className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
              <p className="text-sm font-bold text-neutral-600">No orders yet</p>
              <Link href="/marketplace" className="mt-4 inline-block rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white px-5 py-2.5 transition-colors">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const item = order.items?.[0];
                const img = item?.product?.images?.[0]?.url || item?.product?.images?.[0]?.imageUrl || '';
                const stage = stageOf(order.status);
                const meta = STATUS_META[order.status] || STATUS_META.pending;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 border-b border-neutral-100 px-5 py-3 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-mono text-neutral-400">{order.orderNumber || order.id?.slice(0, 12)}</p>
                        <p className="text-[11px] text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex gap-3">
                        {img && <img src={img} alt="" className="h-14 w-14 rounded-xl object-cover border border-neutral-100 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">{item?.product?.title || 'Product'}</p>
                          <p className="text-xs text-neutral-500">Qty: {item?.quantity} · {order.totalAmount} CELO</p>
                        </div>
                      </div>
                      {/* Escrow progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                          <span>Escrow Stage {stage}/3</span>
                          <span>{Math.round((stage / 3) * 100)}% released</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full transition-all" style={{ width: `${(stage / 3) * 100}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                          {['Paid (30%)', 'Shipped (20%)', 'Delivered (50%)'].map((l, i) => (
                            <div key={l} className={`py-1 rounded ${stage > i ? 'bg-amber-100 text-amber-800 font-bold' : 'text-neutral-400'}`}>{l}</div>
                          ))}
                        </div>
                      </div>
                      {/* Dispute */}
                      {!['delivered','completed','disputed','cancelled'].includes(order.status) && (
                        <div className="pt-2 border-t border-neutral-100 flex gap-2">
                          <input
                            placeholder="Reason for dispute…"
                            value={disputeNotes[order.id] || ''}
                            onChange={e => setDisputeNotes(p => ({ ...p, [order.id]: e.target.value }))}
                            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                          />
                          <button onClick={() => handleOpenDispute(order.id)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-bold text-white transition-colors">
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" /> Notifications
          </h2>
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {notifications.length === 0
              ? <p className="text-xs text-neutral-400 text-center py-8">No notifications yet.</p>
              : notifications.map((n: any) => (
                <div key={n.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 flex gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Bell className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-800 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
          <Link href="/marketplace" className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
            <ShoppingBag className="h-4 w-4" /> Browse Marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

// ─── SELLER DASHBOARD ─────────────────────────────────────────
function SellerDashboard({ profile }: { profile: any }) {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storeRes, orderRes] = await Promise.all([
          apiRequest('/stores/my-store').catch(() => null),
          apiRequest('/orders').catch(() => ({ success: false, data: [] })),
        ]);
        if (storeRes?.success) {
          setStore(storeRes.data);
          const pRes = await apiRequest(`/products?storeId=${storeRes.data.id}&limit=5`).catch(() => null);
          if (pRes?.success) setProducts(Array.isArray(pRes.data) ? pRes.data : pRes.data?.products || []);
        }
        if (orderRes.success) setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const totalRevenue = orders
    .filter(o => ['delivered', 'completed'].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
  const pendingFulfillment = orders.filter(o => ['paid', 'processing'].includes(o.status));

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Welcome */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Seller Account</p>
          <h1 className="text-2xl font-black text-neutral-950">
            {store?.name || profile?.fullName?.split(' ')[0] || 'Your Store'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Sales overview, order fulfillment, and store analytics.</p>
        </div>
        <Link href="/store" className="flex items-center gap-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 px-5 py-3 text-sm font-bold text-white transition-colors">
          <Store className="h-4 w-4" /> Manage Store <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: products.length || store?.totalProducts || 0, icon: <Package className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Total Orders',   value: orders.length,                            icon: <ShoppingBag className="h-4 w-4 text-violet-500" />, bg: 'bg-violet-50' },
          { label: 'Revenue (CELO)', value: totalRevenue.toFixed(3),                  icon: <DollarSign className="h-4 w-4 text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Store Rating',   value: store?.rating ? `${Number(store.rating).toFixed(1)}★` : '—', icon: <Star className="h-4 w-4 text-amber-500" />, bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-lg font-black text-neutral-900 leading-none">{s.value}</p>
              <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Orders needing action */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Needs Your Action
            {pendingFulfillment.length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5">{pendingFulfillment.length}</span>
            )}
          </h2>
          {pendingFulfillment.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-neutral-600">All caught up!</p>
              <p className="text-xs text-neutral-400 mt-1">No orders waiting for fulfillment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFulfillment.map((order: any) => {
                const item = order.items?.[0];
                const img = item?.product?.images?.[0]?.url || item?.product?.images?.[0]?.imageUrl || '';
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-amber-200 p-4 flex items-center gap-4">
                    {img && <img src={img} alt="" className="h-12 w-12 rounded-xl object-cover border border-neutral-100 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{item?.product?.title || 'Order'}</p>
                      <p className="text-xs text-neutral-500">{order.totalAmount} CELO · {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link href="/store" className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-white transition-colors shrink-0">
                      Fulfill
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent orders */}
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mt-6">
            <Activity className="h-4 w-4 text-neutral-500" /> Recent Orders
          </h2>
          {orders.slice(0, 5).map((order: any) => {
            const meta = STATUS_META[order.status] || STATUS_META.pending;
            const item = order.items?.[0];
            return (
              <div key={order.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate">{item?.product?.title || 'Order'}</p>
                  <p className="text-[10px] text-neutral-400">{order.orderNumber || order.id?.slice(0,12)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                  <p className="text-xs font-bold text-neutral-700">{order.totalAmount} CELO</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick links + top products */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">Quick Links</h2>
          <div className="space-y-2">
            {[
              { href: '/store', icon: <Store className="h-4 w-4" />, label: 'Seller Storefront', sub: 'Manage products & orders' },
              { href: '/wallet', icon: <Wallet className="h-4 w-4" />, label: 'My Wallet', sub: 'View CELO balance' },
              { href: '/profile', icon: <Settings className="h-4 w-4" />, label: 'Account Settings', sub: 'Profile & address' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 p-4 hover:border-amber-300 transition-colors group">
                <div className="h-9 w-9 rounded-xl bg-neutral-100 group-hover:bg-amber-100 flex items-center justify-center text-neutral-600 group-hover:text-amber-600 transition-colors shrink-0">{l.icon}</div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">{l.label}</p>
                  <p className="text-[10px] text-neutral-400">{l.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 ml-auto" />
              </Link>
            ))}
          </div>

          {products.length > 0 && (
            <>
              <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider mt-2">Your Products</h2>
              <div className="space-y-2">
                {products.slice(0, 4).map((p: any) => {
                  const img = p.images?.[0]?.url || p.images?.[0]?.imageUrl || '';
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl border border-neutral-200 p-3">
                      {img && <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover border border-neutral-100 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-neutral-500">{p.price} CELO · {p.quantity} in stock</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────
function AdminDashboard({ profile }: { profile: any }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/admin/analytics').catch(() => null),
      apiRequest('/admin/pending-stores?status=pending').catch(() => null),
    ]).then(([aRes, pRes]) => {
      if (aRes?.success) setAnalytics(aRes.data);
      if (pRes?.success) setPending(pRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Welcome */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Platform Administrator
          </p>
          <h1 className="text-2xl font-black text-neutral-950">Admin Overview</h1>
          <p className="text-xs text-neutral-500 mt-1">Platform health, pending approvals, and moderation queue.</p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 px-5 py-3 text-sm font-bold text-white transition-colors">
          <Settings className="h-4 w-4" /> Open Admin Console <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',    value: analytics?.totalUsers ?? '—',    icon: <Users className="h-4 w-4 text-blue-500" />,    bg: 'bg-blue-50',    urgent: false },
          { label: 'Active Stores',  value: analytics?.totalStores ?? '—',   icon: <Store className="h-4 w-4 text-emerald-500" />, bg: 'bg-emerald-50', urgent: false },
          { label: 'Total Orders',   value: analytics?.totalOrders ?? '—',   icon: <ShoppingBag className="h-4 w-4 text-violet-500" />, bg: 'bg-violet-50', urgent: false },
          { label: 'Pending Review', value: analytics?.pendingStores ?? '—', icon: <Clock className="h-4 w-4 text-amber-500" />,   bg: 'bg-amber-50',   urgent: (analytics?.pendingStores ?? 0) > 0 },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${s.urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'}`}>
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-black leading-none ${s.urgent ? 'text-amber-700' : 'text-neutral-900'}`}>{s.value}</p>
              <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending stores */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Stores Awaiting Approval
            {pending.length > 0 && <span className="rounded-full bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5">{pending.length}</span>}
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-neutral-600">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((s: any) => (
                <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    {s.logo?.url ? <img src={s.logo.url} alt="" className="h-full w-full object-cover rounded-xl" /> : <Store className="h-5 w-5 text-neutral-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900">{s.name}</p>
                    <p className="text-[11px] text-neutral-400">{s.ownerEmail} · Applied {new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link href="/admin" className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-white transition-colors shrink-0">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin quick actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">Admin Tools</h2>
          <div className="space-y-2">
            {[
              { href: '/admin', icon: <ShieldCheck className="h-4 w-4" />, label: 'Admin Console', sub: 'Full moderation panel', color: 'text-rose-600 bg-rose-50' },
              { href: '/admin', icon: <Store className="h-4 w-4" />, label: 'Store Approvals', sub: `${pending.length} pending`, color: 'text-amber-600 bg-amber-50' },
              { href: '/admin', icon: <ShieldAlert className="h-4 w-4" />, label: 'Dispute Center', sub: 'Resolve escrow disputes', color: 'text-violet-600 bg-violet-50' },
              { href: '/admin', icon: <Settings className="h-4 w-4" />, label: 'Platform Settings', sub: 'Fee & contract config', color: 'text-neutral-600 bg-neutral-100' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors group">
                <div className={`h-9 w-9 rounded-xl ${l.color} flex items-center justify-center shrink-0`}>{l.icon}</div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">{l.label}</p>
                  <p className="text-[10px] text-neutral-400">{l.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── MAIN DASHBOARD (role router) ────────────────────────────
export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/auth/profile').catch(() => ({ success: false })),
      apiRequest('/wallets/balance').catch(() => null),
    ]).then(([profRes, walRes]) => {
      if (profRes.success) setProfile(profRes.data);
      if (walRes?.success) setWalletData(walRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  const role = profile?.role || getUser()?.role || 'buyer';

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-neutral-900">
      <Header />
      {role === 'admin'  && <AdminDashboard profile={profile} />}
      {role === 'seller' && <SellerDashboard profile={profile} />}
      {(role === 'buyer' || !role) && <BuyerDashboard profile={profile} walletData={walletData} />}
    </div>
  );
}
