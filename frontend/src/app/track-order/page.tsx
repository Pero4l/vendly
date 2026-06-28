'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { useSearchParams } from 'next/navigation';
import { Package, Search, ArrowLeft, ShieldCheck, Truck, CheckCircle, Clock, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

const MOCK_ORDERS = [
  { id: 'ord_001', status: 'SHIPPED', totalAmount: '1.5', createdAt: new Date(Date.now()-86400000*2).toISOString(), updatedAt: new Date(Date.now()-86400000).toISOString(), product: { title: 'Premium Web3 Hardware Ledger', description: 'Secure hardware wallet', images: [{ imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=300' }] }, seller: { fullName: 'Celo Alpha Emporium' } },
  { id: 'ord_002', status: 'PAID', totalAmount: '0.5', createdAt: new Date(Date.now()-86400000).toISOString(), updatedAt: new Date(Date.now()-3600000).toISOString(), product: { title: 'Celo NFT Artwork Collection', images: [] }, seller: { fullName: 'Digital Art Studio' } },
  { id: 'ord_003', status: 'DELIVERED', totalAmount: '2.0', createdAt: new Date(Date.now()-86400000*5).toISOString(), updatedAt: new Date(Date.now()-86400000*2).toISOString(), product: { title: 'Sleek Cyber Hoodie (Special Edition)', images: [] }, seller: { fullName: 'Celo Alpha Emporium' } },
];

const TIMELINE: Record<string, { icon: React.ReactNode; label: string; desc: string; color: string }[]> = {
  PENDING:   [{ icon: <Clock className="h-4 w-4" />,       label: 'Order Placed',          desc: 'Awaiting seller confirmation and payment processing.',     color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }],
  PAID:      [{ icon: <ShieldCheck className="h-4 w-4" />, label: 'Order Locked in Escrow',desc: 'Payment held securely. 30% released to seller for dispatch.', color: 'text-blue-600 bg-blue-50 border-blue-200' }],
  SHIPPED:   [{ icon: <Truck className="h-4 w-4" />,       label: 'Dispatched',            desc: 'Seller has shipped the item. 20% more released to seller.', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }],
  DELIVERED: [{ icon: <CheckCircle className="h-4 w-4" />, label: 'Delivered',             desc: 'Item delivered. Final 50% released to seller. Completed!',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }],
  DISPUTED:  [{ icon: <AlertTriangle className="h-4 w-4" />,label: 'Dispute Opened',       desc: 'Funds frozen. Support team reviewing the case.',            color: 'text-rose-600 bg-rose-50 border-rose-200' }],
};

const ALL_STEPS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];

function stepsCompleted(status: string) {
  const idx = ALL_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx + 1;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [search, setSearch] = useState(initialId);
  const [order, setOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/orders')
      .then(res => {
        const data = res.success && Array.isArray(res.data) && res.data.length ? res.data : MOCK_ORDERS;
        setOrders(data);
        if (initialId) {
          const found = data.find((o: any) => o.id === initialId);
          if (found) setOrder(found);
        }
      })
      .catch(() => {
        setOrders(MOCK_ORDERS);
        if (initialId) {
          const found = MOCK_ORDERS.find(o => o.id === initialId);
          if (found) setOrder(found);
        }
      })
      .finally(() => setListLoading(false));
  }, [initialId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const found = orders.find(o => o.id === search.trim() || o.id.includes(search.trim()));
    if (found) {
      setOrder(found);
    } else {
      setOrder(null);
      setError('No order found with that ID. Check your order ID and try again.');
    }
  };

  const steps = order ? stepsCompleted(order.status) : 0;
  const timeline = order ? TIMELINE[order.status] || [] : [];
  const img = order?.product?.images?.[0]?.imageUrl || order?.product?.images?.[0] || '';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/orders" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-neutral-500" />
        </Link>
        <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-500" />
          Track Order
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Enter your Order ID..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <button type="submit" disabled={loading}
          className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
          Track
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-600 font-medium">{error}</div>
      )}

      {order ? (
        <div className="space-y-4">
          {/* Order card */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0">
                {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center"><Package className="h-6 w-6 text-amber-400" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-neutral-900 truncate">{order.product?.title || 'Product'}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Order ID: #{order.id.slice(0, 16)}</p>
                <p className="text-sm font-black text-amber-600 mt-1">{order.totalAmount} CELO</p>
              </div>
            </div>

            {/* Seller */}
            {order.seller && (
              <div className="mt-3 pt-3 border-t border-neutral-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Seller</p>
                  <p className="text-xs font-bold text-neutral-700">{order.seller.fullName || order.seller.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Ordered</p>
                  <p className="text-xs font-bold text-neutral-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step progress */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-wider mb-4">Escrow Milestone Progress</h2>
            <div className="relative flex items-start">
              <div className="absolute left-[14px] top-6 bottom-0 w-0.5 bg-neutral-100" />
              <div className="w-full space-y-6 relative">
                {ALL_STEPS.map((step, i) => {
                  const done = i < steps;
                  const current = i === steps - 1 && order.status !== 'DELIVERED';
                  const pcts = [30, 30, 20, 50];
                  const labels = ['Order Placed', 'Payment Locked', 'Shipped', 'Delivered'];
                  const descs = [
                    'Your order has been received by the seller.',
                    `30% (${(parseFloat(order.totalAmount)*0.3).toFixed(4)} CELO) released to seller for dispatch prep.`,
                    `20% more (${(parseFloat(order.totalAmount)*0.2).toFixed(4)} CELO) released. Item in transit.`,
                    `Final 50% (${(parseFloat(order.totalAmount)*0.5).toFixed(4)} CELO) released. Order complete!`,
                  ];
                  return (
                    <div key={step} className="flex gap-4 items-start">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 font-black text-xs border-2 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : current ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-neutral-200 text-neutral-300'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className={`text-sm font-bold ${done ? 'text-neutral-900' : current ? 'text-amber-700' : 'text-neutral-400'}`}>{labels[i]}</p>
                        <p className={`text-xs mt-0.5 ${done || current ? 'text-neutral-500' : 'text-neutral-300'}`}>{descs[i]}</p>
                        {done && pcts[i] > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> {pcts[i]}% released
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {order.status === 'DISPUTED' && (
                  <div className="flex gap-4 items-start">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 bg-rose-500 border-2 border-rose-500 text-white">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-700">Dispute Opened</p>
                      <p className="text-xs text-rose-500 mt-0.5">Funds are frozen. Support team is reviewing your case. Expect resolution in 48–72 hours.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/support" className="flex-1 text-center py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
              Contact Support
            </Link>
            {order.status === 'DELIVERED' ? null : (
              <Link href="/dashboard" className="flex-1 text-center py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors">
                Manage Order
              </Link>
            )}
          </div>
        </div>
      ) : !listLoading && orders.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Your Recent Orders</p>
          {orders.slice(0, 5).map(o => {
            const img = o.product?.images?.[0]?.imageUrl || o.product?.images?.[0] || '';
            const meta: Record<string,string> = { PENDING: 'Pending', PAID: 'Paid', SHIPPED: 'Shipped', DELIVERED: 'Delivered', DISPUTED: 'Disputed' };
            const color: Record<string,string> = { PENDING: 'text-yellow-600', PAID: 'text-blue-600', SHIPPED: 'text-indigo-600', DELIVERED: 'text-emerald-600', DISPUTED: 'text-rose-600' };
            return (
              <button key={o.id} onClick={() => { setOrder(o); setSearch(o.id); }}
                className="w-full flex items-center gap-4 bg-white rounded-2xl border border-neutral-100 p-4 hover:border-amber-200 transition-all text-left">
                <div className="h-12 w-12 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 truncate">{o.product?.title || 'Product'}</p>
                  <p className="text-[11px] text-neutral-400">#{o.id.slice(0, 12)}</p>
                </div>
                <span className={`text-xs font-bold ${color[o.status] || 'text-neutral-500'}`}>{meta[o.status] || o.status}</span>
              </button>
            );
          })}
        </div>
      ) : !listLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center space-y-3">
          <Package className="h-12 w-12 text-neutral-200 mx-auto" />
          <p className="text-base font-bold text-neutral-700">No orders yet</p>
          <Link href="/marketplace" className="inline-flex items-center bg-amber-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>
      <Suspense fallback={<div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-amber-500" /></div>}>
        <TrackContent />
      </Suspense>
    </div>
  );
}
