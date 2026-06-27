'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { ShieldCheck, Percent, Check, AlertCircle, RefreshCw, X, Coins, ShieldAlert } from 'lucide-react';

export default function AdminPanel() {

  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feePercentage, setFeePercentage] = useState('');
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const storesRes = await apiRequest('/admin/pending-stores');
      if (storesRes.success) setPendingStores(storesRes.data);

      const disputesRes = await apiRequest('/admin/disputes');
      if (disputesRes.success) setDisputes(disputesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveStore = async (storeId: string, approve: boolean) => {
    try {
      const res = await apiRequest('/admin/approve-store', {
        method: 'POST',
        body: JSON.stringify({ storeId, approve })
      });
      if (res.success) {
        alert(approve ? 'Store storefront approved successfully!' : 'Store storefront rejected.');
        fetchData();
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleResolveDispute = async (dispute: any) => {
    const refundPct = parseFloat(refundAmounts[dispute.id] || '0');
    if (isNaN(refundPct) || refundPct < 0 || refundPct > 100) {
      alert('Please enter a valid refund percentage between 0 and 100.');
      return;
    }
    try {
      await apiRequest(`/admin/disputes/${dispute.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ refundPercentage: refundPct })
      });
      alert(`Dispute resolved! ${refundPct}% refunded to Buyer, ${100 - refundPct}% released to Seller.`);
      fetchData();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    }
  };

  const handleSetPlatformFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(feePercentage);
    if (isNaN(pct) || pct < 0 || pct > 10) {
      alert('Fee percentage must be between 0% and 10%.');
      return;
    }
    try {
      await apiRequest('/admin/set-fee', {
        method: 'POST',
        body: JSON.stringify({ feeBps: Math.round(pct * 100) })
      });
      alert(`Platform fee set to ${pct}% successfully.`);
      setFeePercentage('');
    } catch (err: any) {
      alert(`Fee setup error: ${err.message}`);
    }
  };

  const handleWithdrawAccumulatedFees = async () => {
    try {
      await apiRequest('/admin/withdraw-fees', { method: 'POST' });
      alert('Fee withdrawal initiated successfully.');
    } catch (err: any) {
      alert(`Withdrawal failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-xs text-neutral-500 font-semibold">Loading admin panel dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Admin Title */}
        <section className="border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-black text-neutral-950 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-amber-500" />
            Platform Moderator Console
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Resolve buyer disputes, approve brand store requests, and configure Celo contract protocols.
          </p>
        </section>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Fee Configuration (Admin-Only) */}
          <div className="rounded-xl border border-neutral-250 bg-neutral-50 p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-950 flex items-center gap-2">
              <Percent className="h-4.5 w-4.5 text-amber-500" />
              Contract Platform Fees
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Adjust platform commission fees. Only the admin smart contract owner wallet can execute this transaction on Celo.
            </p>

            <form onSubmit={handleSetPlatformFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Fee Percentage (%)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 2.5"
                  value={feePercentage}
                  onChange={e => setFeePercentage(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Set Platform Fee
              </button>
            </form>

            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <span className="text-[10px] text-neutral-400 font-semibold block">Withdraw Commission Balance</span>
              <button 
                onClick={handleWithdrawAccumulatedFees}
                className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Coins className="h-4 w-4 text-amber-400" />
                Withdraw native CELO fees
              </button>
            </div>
          </div>

          {/* Store Approvals */}
          <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-950 uppercase tracking-wider">
              Pending Storefront Approvals ({pendingStores.length})
            </h3>
            
            {pendingStores.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-400">
                <ShieldCheck className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-600">All merchant storefronts approved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingStores.map((store: any) => (
                  <div key={store.id} className="rounded-lg bg-neutral-50 p-4 border border-neutral-200 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-neutral-905">{store.name}</h4>
                      <p className="text-[11px] text-neutral-500 leading-normal">{store.description}</p>
                      <span className="text-[10px] text-neutral-400 block font-mono">Owner email: {store.user?.email}</span>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleApproveStore(store.id, true)}
                        className="rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleApproveStore(store.id, false)}
                        className="rounded bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Dispute Resolution Center */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6 shadow-xs">
          <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            Smart Contract Dispute Mediation Desk ({disputes.length})
          </h2>

          {disputes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center text-neutral-400">
              <ShieldCheck className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-neutral-600">Mediation queue is clear. No active disputed escrows.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute: any) => (
                <div key={dispute.id} className="rounded-lg bg-neutral-50 p-5 border border-neutral-200 space-y-4">
                  
                  {/* Dispute Details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-200 pb-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-mono block">Dispute Case ID: {dispute.id}</span>
                      <h4 className="font-extrabold text-sm text-neutral-900">Total Escrow Funds: {dispute.order?.totalAmount} CELO</h4>
                    </div>
                    <span className="rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold px-2.5 py-1">
                      STATUS: {dispute.status}
                    </span>
                  </div>

                  {/* Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1">
                      <span className="text-neutral-500 font-bold block">Buyer Complaint Claim</span>
                      <p className="text-neutral-800 font-medium bg-white p-3 rounded-lg border border-neutral-200 leading-relaxed">
                        "{dispute.reason}"
                      </p>
                    </div>
                    <div className="space-y-2 text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200 flex flex-col justify-center">
                      <p className="text-[11px]"><span className="text-neutral-400 font-bold">Claimant (Buyer):</span> {dispute.order?.user?.name} ({dispute.order?.user?.email})</p>
                      <p className="text-[11px]"><span className="text-neutral-400 font-bold">Defendant (Seller):</span> {dispute.order?.store?.name}</p>
                      <p className="text-[11px]"><span className="text-neutral-400 font-bold">Associated Order ID:</span> {dispute.orderId}</p>
                    </div>
                  </div>

                  {/* Resolution Input */}
                  <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-end gap-3 max-w-md">
                    <div className="w-full">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Refund to Buyer Percentage (%)
                      </label>
                      <input 
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g. 70 (gives 70% to buyer and 30% to seller)"
                        value={refundAmounts[dispute.id] || ''}
                        onChange={e => setRefundAmounts(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => handleResolveDispute(dispute)}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer"
                    >
                      Resolve & Disburse Escrow
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
