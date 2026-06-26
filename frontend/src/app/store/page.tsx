'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { Store, PlusCircle, ShoppingBag, CheckCircle, Package, Truck, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Coins, Sparkles, Inbox } from 'lucide-react';

export default function StoreManagement() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration Fields
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  
  // Product Creation Fields
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pQty, setPQty] = useState(1);
  const [pCatId, setPCatId] = useState('1'); 
  const [pImg, setPImg] = useState('');

  // Shipping details state
  const [carrier, setCarrier] = useState<Record<string, string>>({});
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [submittingShipment, setSubmittingShipment] = useState<Record<string, boolean>>({});

  const fetchStoreInfo = async () => {
    try {
      const res = await apiRequest('/stores/my-store');
      if (res.success && res.data) {
        setStore(res.data);
        await fetchProducts(res.data.id);
        await fetchStoreOrders();
      }
    } catch (err) {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (storeId: string) => {
    try {
      const res = await apiRequest(`/products?storeId=${storeId}`);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreOrders = async () => {
    try {
      // In mock DB, GET /orders/my-orders returns store-relevant orders when role is SELLER
      const res = await apiRequest('/orders/my-orders');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest('/stores', {
        method: 'POST',
        body: JSON.stringify({ name: storeName, description: storeDesc })
      });
      if (res.success) {
        setStore(res.data);
        alert('Store profile created! Awaiting platform approval (you can auto-approve using Admin Test Switcher).');
      }
    } catch (err: any) {
      alert(`Store registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          title: pTitle,
          description: pDesc,
          price: pPrice,
          quantity: pQty,
          categoryId: pCatId,
          images: pImg ? [pImg] : []
        })
      });

      if (res.success) {
        alert('Listing published successfully!');
        setPTitle('');
        setPDesc('');
        setPPrice('');
        setPQty(1);
        setPImg('');
        if (store) fetchProducts(store.id);
      }
    } catch (err: any) {
      alert(`Product creation failed: ${err.message}`);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    const shipCarrier = carrier[orderId] || 'FedEx Express';
    const shipTracking = tracking[orderId] || 'TRK-' + Math.random().toString().substr(2, 9).toUpperCase();
    
    setSubmittingShipment(prev => ({ ...prev, [orderId]: true }));

    try {
      // Direct simulation helper inside local storage mock db
      const dbStr = localStorage.getItem('vendly_mock_db');
      if (dbStr) {
        const db = JSON.parse(dbStr);
        const order = db.orders.find((o: any) => o.id === orderId);
        if (order) {
          order.status = 'SHIPPED';
          order.carrier = shipCarrier;
          order.trackingNumber = shipTracking;
          
          // Add system log alerts
          db.notifications.unshift({
            id: 'n' + (db.notifications.length + 1),
            userId: order.userId,
            message: `Seller dispatched order ${order.id} via ${shipCarrier} (Tracking: ${shipTracking}). 20% milestone released!`,
            createdAt: new Date().toISOString()
          });

          const sellerStore = db.stores.find((s: any) => s.id === order.storeId);
          if (sellerStore) {
            db.notifications.unshift({
              id: 'n' + (db.notifications.length + 1),
              userId: sellerStore.userId,
              message: `Fulfillment confirmed for order ${order.id}. 20% shipment payout processed.`,
              createdAt: new Date().toISOString()
            });
          }

          localStorage.setItem('vendly_mock_db', JSON.stringify(db));
        }
      }

      await new Promise(r => setTimeout(r, 1000));
      alert(`Fulfillment confirmed. Order ${orderId} status set to SHIPPED! 20% payout released.`);
      await fetchStoreOrders();
    } catch (err: any) {
      alert(`Shipment dispatch failed: ${err.message}`);
    } finally {
      setSubmittingShipment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-xs text-neutral-500 font-semibold">Loading storefront metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalStock = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + (parseFloat(p.price) * (p.quantity || 0)), 0).toFixed(2);
  const pendingOrdersCount = orders.filter(o => o.status === 'PAID').length;

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {!store ? (
          /* Store Registration flow */
          <section className="mx-auto max-w-md rounded-2xl border border-neutral-250 bg-neutral-50 p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <Store className="h-10 w-10 text-amber-500 mx-auto" />
              <h2 className="text-xl font-black text-neutral-900">Open Your Merchant Center</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Unlock seller tools, upload physical/digital goods, and receive protected escrow payments on Celo.
              </p>
            </div>

            <form onSubmit={handleRegisterStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Brand Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Celo Alpha Emporium"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Description</label>
                <textarea 
                  required 
                  placeholder="Describe your listings, warranty terms, and shipping guarantees..."
                  value={storeDesc}
                  onChange={e => setStoreDesc(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                />
              </div>

              <button 
                type="submit"
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Register Storefront
              </button>
            </form>
          </section>
        ) : (
          /* Main Merchant dashboard layout */
          <div className="space-y-8">
            
            {/* Header profile & alerts */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-neutral-950 flex items-center gap-2">
                  <Store className="h-6 w-6 text-amber-500" />
                  {store.name} Merchant Hub
                </h1>
                <p className="text-xs text-neutral-500">
                  Manage your on-chain store assets, publish inventory, and fulfill paid client orders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  store.isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <CheckCircle className="h-3.5 w-3.5" />
                  {store.isApproved ? 'Approved Merchant' : 'Awaiting Approval'}
                </span>
              </div>
            </div>

            {/* Seller Central Metrics Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Items Listed</span>
                <span className="text-2xl font-black text-neutral-900 block">{products.length} Products</span>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Catalog Stock</span>
                <span className="text-2xl font-black text-neutral-900 block">{totalStock} Units</span>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Assets Valuation</span>
                <span className="text-2xl font-black text-neutral-900 block">{totalValue} CELO</span>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5 bg-amber-500/10 border-amber-500/20 space-y-1.5">
                <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block">Pending Shipments</span>
                <span className="text-2xl font-black text-amber-800 block">{pendingOrdersCount} Fulfillments</span>
              </div>
            </section>

            {/* Split: Left Uploader | Right Catalog & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: Product Creator Form */}
              <div className="lg:col-span-4 border border-neutral-200 rounded-xl bg-white p-6 space-y-6">
                <h3 className="text-sm font-bold text-neutral-905 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="h-4.5 w-4.5 text-amber-500" />
                  List New Product
                </h3>

                <form onSubmit={handleCreateProduct} className="space-y-4 text-neutral-805">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ledger Hardware Key"
                      value={pTitle}
                      onChange={e => setPTitle(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                    <textarea 
                      required 
                      placeholder="Upload product details, specs, and redeem instructions..."
                      value={pDesc}
                      onChange={e => setPDesc(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Price (CELO)</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="1.5"
                        value={pPrice}
                        onChange={e => setPPrice(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Stock Qty</label>
                      <input 
                        type="number" 
                        required 
                        min={1}
                        value={pQty}
                        onChange={e => setPQty(parseInt(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Category Department</label>
                    <select 
                      value={pCatId}
                      onChange={e => setPCatId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-355 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="1">Electronics</option>
                      <option value="2">Digital Services</option>
                      <option value="3">Apparel</option>
                      <option value="4">Home & Kitchen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Display Image URL</label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/photo-..."
                      value={pImg}
                      onChange={e => setPImg(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-350 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!store.isApproved}
                    className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {!store.isApproved ? 'Awaiting Moderator Approval' : 'Publish to Marketplace'}
                  </button>
                </form>
              </div>

              {/* RIGHT: Inventory Lists & Order Fulfillment Section */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* 1. Order Shipment Fulfillment Panel */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="h-4.5 w-4.5 text-amber-500" />
                    Pending Buyer Shipments & Deliveries
                  </h3>

                  {orders.length === 0 || !orders.some(o => o.status === 'PAID') ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-450">
                      <Inbox className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                      <p className="text-xs font-bold text-neutral-600">No active pending orders requiring shipping.</p>
                      <p className="text-[10px] text-neutral-450 mt-0.5">When buyers purchase your items via escrow, they will appear here for logistics fulfillment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(o => o.status === 'PAID').map((order: any) => {
                        const item = order.items?.[0];
                        return (
                          <div key={order.id} className="border border-amber-300 rounded-xl bg-amber-50/20 p-5 space-y-4 shadow-xs">
                            
                            {/* Order mini-header */}
                            <div className="flex justify-between items-start border-b border-neutral-100 pb-2">
                              <div>
                                <span className="text-[10px] text-neutral-400 font-mono">ORDER: {order.id}</span>
                                <h4 className="text-xs font-bold text-neutral-800">Buyer: {order.user?.name} ({order.user?.email})</h4>
                              </div>
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded">
                                ESCROW LOCKED (30%)
                              </span>
                            </div>

                            {/* Item details */}
                            <div className="text-xs text-neutral-600">
                              <p>Item: <b>{item?.product?.title}</b> (x{item?.quantity})</p>
                              <p>Shipping Destination: <span className="font-mono text-neutral-800 bg-neutral-100 px-1 py-0.5 rounded">{order.shippingAddress}</span></p>
                            </div>

                            {/* Dispatch input */}
                            <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Confirm Parcel Dispatch</span>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Logistics Carrier (e.g. FedEx, DHL)" 
                                  value={carrier[order.id] || ''}
                                  onChange={e => setCarrier(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  className="flex-1 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:outline-none"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Tracking Code / Airbill" 
                                  value={tracking[order.id] || ''}
                                  onChange={e => setTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  className="flex-1 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:outline-none"
                                />
                              </div>

                              <button
                                onClick={() => handleShipOrder(order.id)}
                                disabled={submittingShipment[order.id]}
                                className="rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                <Package className="h-3.5 w-3.5" />
                                {submittingShipment[order.id] ? 'Updating...' : 'Ship Package & Release Stage 2 (20%)'}
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Active Store Inventory Catalog */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
                    Listed Store Catalog Inventory
                  </h3>

                  {products.length === 0 ? (
                    <div className="rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
                      <p className="text-xs font-semibold">No catalog items listed yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((p: any) => {
                        const img = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400';
                        return (
                          <div key={p.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
                            <div className="h-28 bg-neutral-100 relative">
                              <img src={img} alt={p.title} className="w-full h-full object-cover" />
                              <span className="absolute top-2 right-2 rounded bg-neutral-900/90 px-2 py-0.5 text-xs font-black text-amber-400">
                                {p.price} CELO
                              </span>
                            </div>
                            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                              <h4 className="font-extrabold text-xs text-neutral-900 line-clamp-1">{p.title}</h4>
                              
                              <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-2 border-t border-neutral-100">
                                <div>
                                  <span>Stock: </span>
                                  {p.quantity <= 3 ? (
                                    <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <AlertTriangle className="h-3 w-3" />
                                      Low! ({p.quantity})
                                    </span>
                                  ) : (
                                    <span className="font-bold text-neutral-700">{p.quantity} units</span>
                                  )}
                                </div>
                                <span className="font-mono text-neutral-400">ID: {p.id}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
