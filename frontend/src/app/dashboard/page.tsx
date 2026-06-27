'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { Bell, Wallet, ShieldAlert, CheckCircle, Package, Truck, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const ESCROW_ABI = [
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "releaseThirtyPercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "releaseTwentyPercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "releaseFinalFiftyPercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "openDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "escrows",
    "outputs": [
      { "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
      { "internalType": "address", "name": "buyer", "type": "address" },
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "internalType": "uint256", "name": "totalAmount", "type": "uint256" },
      { "internalType": "uint8", "name": "stage", "type": "uint8" },
      { "internalType": "bool", "name": "isDisputed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [escrowStates, setEscrowStates] = useState<Record<string, any>>({});
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});

  const fetchProfile = async () => {
    try {
      const res = await apiRequest('/auth/profile');
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiRequest('/orders/my-orders');
      if (res.success) {
        setOrders(res.data);
        res.data.forEach((order: any) => {
          fetchEscrowStateFromChain(order.id, res.data);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEscrowStateFromChain = async (orderId: string, currentOrders: any[]) => {
    try {
      const orderIdBytes = ethers.id(orderId);
      const provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org');
      const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const escrowRecord = await contract.escrows(orderIdBytes);
      
      setEscrowStates(prev => ({
        ...prev,
        [orderId]: {
          stage: escrowRecord.stage,
          isDisputed: escrowRecord.isDisputed,
          totalAmount: ethers.formatEther(escrowRecord.totalAmount),
          isSimulated: false
        }
      }));
    } catch (err) {
      // Fallback simulation: local storage mock mode
      const order = currentOrders.find(o => o.id === orderId);
      if (order) {
        let simulatedStage = 0;
        if (order.status === 'PAID') simulatedStage = 1;
        if (order.status === 'SHIPPED') simulatedStage = 2;
        if (order.status === 'DELIVERED') simulatedStage = 3;

        setEscrowStates(prev => ({
          ...prev,
          [orderId]: {
            stage: simulatedStage,
            isDisputed: order.status === 'DISPUTED',
            totalAmount: order.totalAmount,
            isSimulated: true
          }
        }));
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest('/notifications');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      await fetchOrders();
      await fetchNotifications();
      setLoading(false);
    };
    init();
  }, []);

  const handleEscrowRelease = async (orderId: string, stageToRelease: number) => {
    const isSimulated = escrowStates[orderId]?.isSimulated;

    try {
      if (isSimulated) {
        const nextStatus = stageToRelease === 2 ? 'SHIPPED' : 'DELIVERED';
        
        // Update mock database directly
        const dbStr = localStorage.getItem('vendly_mock_db');
        if (dbStr) {
          const db = JSON.parse(dbStr);
          const order = db.orders.find((o: any) => o.id === orderId);
          if (order) {
            order.status = nextStatus;
            
            // Add notification
            db.notifications.unshift({
              id: 'n' + (db.notifications.length + 1),
              userId: order.userId,
              message: `Milestone Stage ${stageToRelease} release confirmed (Sandbox). Status: ${nextStatus}.`,
              createdAt: new Date().toISOString()
            });

            // If stage 2 release, notify seller
            const store = db.stores.find((s: any) => s.id === order.storeId);
            if (store) {
              db.notifications.unshift({
                id: 'n' + (db.notifications.length + 1),
                userId: store.userId,
                message: `Buyer approved Milestone ${stageToRelease} release on order ${order.id}. Payout processed.`,
                createdAt: new Date().toISOString()
              });
            }

            localStorage.setItem('vendly_mock_db', JSON.stringify(db));
          }
        }
        
        alert(`Sandbox Mode: Milestone Stage ${stageToRelease} release simulated successfully!`);
        await fetchOrders();
        await fetchNotifications();
        return;
      }

      // Web3 Chain Release
      const orderIdBytes = ethers.id(orderId);
      let functionName = 'releaseThirtyPercent';
      if (stageToRelease === 2) functionName = 'releaseTwentyPercent';
      if (stageToRelease === 3) functionName = 'releaseFinalFiftyPercent';

      writeContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName,
        args: [orderIdBytes as `0x${string}`]
      });

      setTimeout(() => {
        fetchOrders();
      }, 4000);
    } catch (err: any) {
      alert(`Escrow release transaction failed: ${err.message}`);
    }
  };

  const handleOpenDispute = async (orderId: string) => {
    const reason = disputeNotes[orderId] || 'Items not received or damaged.';
    const isSimulated = escrowStates[orderId]?.isSimulated;

    try {
      // 1. Backend dispute registration
      const disputeRes = await apiRequest('/disputes', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason })
      });

      if (!disputeRes.success) {
        alert(`Failed creating dispute: ${disputeRes.message}`);
        return;
      }

      // 2. Onchain dispute registration if real Web3
      if (!isSimulated) {
        const orderIdBytes = ethers.id(orderId);
        writeContract({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'openDispute',
          args: [orderIdBytes as `0x${string}`]
        });
      } else {
        alert('Sandbox Mode: Dispute opened and escrow locked.');
      }

      setTimeout(() => {
        fetchOrders();
        fetchNotifications();
      }, 2000);
    } catch (err: any) {
      alert(`Dispute registration error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-xs text-neutral-500 font-semibold">Loading user account dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-neutral-950">Welcome Back, {profile?.name || 'User'}</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Account role: <span className="text-amber-600 font-bold">{profile?.role}</span> | Manage your buying escrows, dispute cases, and delivery milestones.
            </p>
          </div>

          {/* Web3 Wallet Info */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              Wallet Status
            </h3>
            <p className="text-xs font-mono font-bold text-neutral-700">
              {isConnected ? `${address?.substring(0, 16)}...${address?.substring(address.length - 8)}` : 'Wallet Disconnected'}
            </p>
          </div>
        </section>

        {/* Dashboard Grid split into Orders and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Escrow Orders */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-neutral-905 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              My Purchases & Smart Escrows
            </h2>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
                <Package className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
                <p className="text-sm font-bold text-neutral-700">No purchases found</p>
                <p className="text-xs text-neutral-500 mt-1">
                  You haven't placed any escrow orders yet. Go back to the marketplace to purchase your first product!
                </p>
                <Link
                  href="/marketplace"
                  className="mt-4 inline-block rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white px-4 py-2 transition-colors"
                >
                  Shop Listings
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order: any) => {
                  const chainState = escrowStates[order.id];
                  const item = order.items?.[0];
                  const imageUrl = item?.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=200';

                  return (
                    <div key={order.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
                      
                      {/* Order Title Box */}
                      <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex flex-wrap justify-between items-center gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400 font-mono block">Order ID: {order.id}</span>
                          <span className="text-xs text-neutral-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {chainState?.isSimulated && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300">
                              SANDBOX MOCK
                            </span>
                          )}
                          <span className={`rounded px-2 py-1 text-xs font-black tracking-wide uppercase ${
                            order.status === 'PAID' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            order.status === 'SHIPPED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            order.status === 'DISPUTED' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="p-6 space-y-6">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 bg-neutral-100 rounded border border-neutral-200 overflow-hidden shrink-0">
                            <img src={imageUrl} alt="Product image" className="h-full w-full object-cover" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-neutral-900 line-clamp-1">{item?.product?.title}</h4>
                            <p className="text-xs text-neutral-500">Quantity: {item?.quantity} | Price per unit: {item?.price} CELO</p>
                            <p className="text-xs font-bold text-neutral-700">Total Charged: {order.totalAmount} CELO</p>
                          </div>
                        </div>

                        {/* On-chain State Overlay */}
                        {chainState && (
                          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                Escrow Release Milestones
                              </span>
                              <span className="text-amber-600">Stage {chainState.stage} of 3 Release</span>
                            </div>

                            {/* Progress Line */}
                            <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden relative">
                              <div 
                                className="bg-amber-500 h-full transition-all duration-300"
                                style={{ width: `${(chainState.stage / 3) * 100}%` }}
                              />
                            </div>

                            {/* Stages description visual */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className={`p-1.5 rounded ${chainState.stage >= 1 ? 'bg-amber-100 text-amber-900 font-bold' : 'text-neutral-400'}`}>
                                Stage 1: Paid (30%)
                              </div>
                              <div className={`p-1.5 rounded ${chainState.stage >= 2 ? 'bg-amber-100 text-amber-900 font-bold' : 'text-neutral-400'}`}>
                                Stage 2: Shipped (20%)
                              </div>
                              <div className={`p-1.5 rounded ${chainState.stage >= 3 ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-neutral-400'}`}>
                                Stage 3: Delivered (50%)
                              </div>
                            </div>

                            {/* Disputed state indicator */}
                            {chainState.isDisputed && (
                              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
                                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                                <span><b>Escrow Dispute Filed:</b> Smart contract release triggers are currently frozen pending review by platform moderators.</span>
                              </div>
                            )}

                            {/* Buyer specific release controls */}
                            {profile?.role === 'BUYER' && !chainState.isDisputed && (
                              <div className="pt-2 flex flex-wrap gap-2">
                                {chainState.stage === 1 && (
                                  <button 
                                    onClick={() => handleEscrowRelease(order.id, 2)}
                                    className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                                  >
                                    Release Milestone 2 (20% for dispatch)
                                  </button>
                                )}
                                {chainState.stage === 2 && (
                                  <button 
                                    onClick={() => handleEscrowRelease(order.id, 3)}
                                    className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                                  >
                                    Release Milestone 3 (50% final release)
                                  </button>
                                )}
                                {chainState.stage === 3 && (
                                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Order fully settled on-chain. Thank you!
                                  </div>
                                )}
                              </div>
                            )}

                            {/* If seller is viewing this page */}
                            {profile?.role === 'SELLER' && (
                              <div className="text-xs text-neutral-500 font-semibold italic">
                                {chainState.stage === 1 && "Awaiting shipment carrier verification to trigger Stage 2 release."}
                                {chainState.stage === 2 && "Awaiting buyer delivery confirmation to trigger Stage 3 release."}
                                {chainState.stage === 3 && "Escrow payout fully released."}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dispute filing block */}
                        {profile?.role === 'BUYER' && order.status !== 'DELIVERED' && order.status !== 'DISPUTED' && (
                          <div className="pt-4 border-t border-neutral-100 space-y-2">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">File Protection Dispute</label>
                            <p className="text-[10px] text-neutral-400">
                              Did the seller stop responding? File a dispute to instantly freeze escrow releases.
                            </p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="State reason (e.g. tracking code is fake, product arrived damaged...)" 
                                value={disputeNotes[order.id] || ''}
                                onChange={e => setDisputeNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                className="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <button
                                onClick={() => handleOpenDispute(order.id)}
                                className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                              >
                                Submit Case
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Notifications Feed */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Security Audit Feed
            </h2>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-450 text-center py-10">No recent security alerts.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((notif: any) => (
                    <div key={notif.id} className="rounded-lg bg-white p-3 border border-neutral-200 flex items-start gap-2.5 hover:shadow-xs transition-shadow">
                      <div className="rounded-lg bg-amber-100 p-2 text-amber-700 shrink-0">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800 leading-tight">{notif.message}</p>
                        <span className="text-[9px] text-neutral-400 block font-semibold">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
