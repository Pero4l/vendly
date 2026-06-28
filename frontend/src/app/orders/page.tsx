'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Package, ArrowLeft, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, Clock, Truck, Search } from 'lucide-react';

const STATUS_TABS = ['All', 'pending', 'paid', 'shipped', 'delivered', 'disputed'];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200',   icon: <Clock className="h-3 w-3" /> },
  paid:      { label: 'Paid',      color: 'bg-blue-100 text-blue-700 border-blue-200',         icon: <ShieldCheck className="h-3 w-3" /> },
  processing:{ label: 'Processing',color: 'bg-indigo-100 text-indigo-700 border-indigo-200',   icon: <RefreshCw className="h-3 w-3" /> },
  shipped:   { label: 'Shipped',   color: 'bg-indigo-100 text-indigo-700 border-indigo-200',   icon: <Truck className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200',icon: <CheckCircle className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'bg-emerald-200 text-emerald-800 border-emerald-300',icon: <CheckCircle className="h-3 w-3" /> },
  disputed:  { label: 'Disputed',  color: 'bg-rose-100 text-rose-700 border-rose-200',         icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-neutral-100 text-neutral-500 border-neutral-200',icon: <AlertTriangle className="h-3 w-3" /> },
};

const MILESTONE_STAGES = [
  { pct: 30, label: 'Order Locked', key: 'paid' },
  { pct: 20, label: 'Shipped',      key: 'shipped' },
  { pct: 50, label: 'Delivered',    key: 'delivered' },
];

function stageIndex(status: string) {
  if (status === 'delivered' || status === 'completed') return 3;
  if (status === 'shipped')    return 2;
  if (status === 'paid' || status === 'processing') return 1;
  return 0;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const justOrdered = searchParams.get('success') === '1';
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiRequest('/orders')
      .then(res => {
        const data = res.success && Array.isArray(res.data) ? res.data : [];
        setOrders(data);
        setFiltered(data);
      })
      .catch(() => { setOrders([]); setFiltered([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = orders;
    if (activeTab !== 'All') result = result.filter(o => o.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        (o.orderNumber || o.id || '').toLowerCase().includes(q) ||
        o.items?.[0]?.product?.title?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [activeTab, search, orders]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        {/* Success banner after checkout */}
        {justOrdered && (
          <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Order placed successfully!</p>
              <p className="text-xs text-emerald-600">Your payment is locked in escrow. The seller has been notified.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-500" />
          </Link>
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            My Orders
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or product name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-4">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === tab ? 'bg-amber-500 text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
              {tab === 'All' ? 'All Orders' : STATUS_META[tab]?.label || tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(n => <div key={n} className="h-28 bg-white rounded-2xl border border-neutral-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center space-y-3">
            <Package className="h-12 w-12 text-neutral-200 mx-auto" />
            <h2 className="text-base font-bold text-neutral-700">No orders found</h2>
            <p className="text-sm text-neutral-400">
              {activeTab !== 'All' ? `No ${STATUS_META[activeTab]?.label} orders yet.` : 'Place your first order on the marketplace!'}
            </p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const meta = STATUS_META[order.status] || STATUS_META['pending'];
              const img = order.items?.[0]?.product?.images?.[0]?.url || order.items?.[0]?.product?.images?.[0]?.imageUrl || order.product?.images?.[0]?.url || order.product?.images?.[0]?.imageUrl || '';
              const stage = stageIndex(order.status);
              return (
                <Link href={`/track-order?id=${order.id}`} key={order.id}
                  className="block bg-white rounded-2xl border border-neutral-100 p-4 hover:border-amber-200 hover:shadow-sm transition-all">
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0">
                      {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 truncate">
                            {order.items?.[0]?.product?.title || order.product?.title || 'Order'}
                            {(order.items?.length || 0) > 1 ? ` +${(order.items?.length || 1) - 1} more` : ''}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">#{order.orderNumber || order.id.slice(0, 12)}</p>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      <p className="text-sm font-black text-amber-600 mt-1">{order.totalAmount} CELO</p>
                    </div>
                  </div>

                  {/* Milestone progress */}
                  {order.status !== 'PENDING' && order.status !== 'DISPUTED' && (
                    <div className="mt-3 pt-3 border-t border-neutral-50">
                      <div className="flex items-center gap-1">
                        {MILESTONE_STAGES.map((ms, i) => (
                          <React.Fragment key={ms.key}>
                            <div className="flex flex-col items-center">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black ${i < stage ? 'bg-emerald-500 text-white' : i === stage-1 ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                {i < stage ? '✓' : `${ms.pct}%`}
                              </div>
                              <span className="text-[9px] text-neutral-400 mt-0.5 whitespace-nowrap">{ms.label}</span>
                            </div>
                            {i < 2 && <div className={`flex-1 h-0.5 mb-3 ${i < stage - 1 ? 'bg-emerald-400' : 'bg-neutral-100'}`} />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
