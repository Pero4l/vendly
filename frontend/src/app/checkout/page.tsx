'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { apiRequest, getUser } from '../../utils/api';
import {
  ShieldCheck, MapPin, Edit2, CheckCircle, AlertTriangle,
  ArrowLeft, RefreshCw, Package, Lock
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState(false);

  // Inline address edit state
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('');

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    if (u.address) {
      setAddress(u.address);
      populateEditFields(u.address);
    }
  }, []);

  const populateEditFields = (addr: any) => {
    setAddrFullName(addr.fullName || '');
    setAddrPhone(addr.phone || '');
    setAddrLine1(addr.line1 || '');
    setAddrLine2(addr.line2 || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || '');
    setAddrZip(addr.zip || '');
    setAddrCountry(addr.country || '');
  };

  const applyAddressEdit = () => {
    const updated = {
      fullName: addrFullName, phone: addrPhone,
      line1: addrLine1, line2: addrLine2,
      city: addrCity, state: addrState,
      zip: addrZip, country: addrCountry
    };
    setAddress(updated);
    setEditingAddress(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="hidden md:block"><Header /></div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <Package className="h-12 w-12 text-neutral-300" />
          <p className="text-sm font-bold text-neutral-600">Your cart is empty</p>
          <Link href="/marketplace"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const hasAddress = !!(address?.line1 && address?.city && address?.country);

  const handlePlaceOrder = async () => {
    if (!hasAddress) { setError('Please add a delivery address before placing your order.'); return; }
    setPlacing(true); setError('');

    try {
      setStage('Creating your order...');
      const orderRes = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
          shippingAddress: address
        })
      });

      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to place order');

      const orderId = orderRes.data.id;

      // Clear cart immediately — the order exists, no reason to keep it
      clearCart();

      setStage('Locking payment in escrow...');

      await apiRequest('/orders/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ orderId, txHash: null })
      });

      setStage('Order placed! Redirecting...');
      setTimeout(() => router.push('/orders?success=1'), 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setPlacing(false);
      setStage('');
    }
  };

  const addrLine = address
    ? [address.line1, address.line2, address.city, address.state, address.zip, address.country].filter(Boolean).join(', ')
    : '';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>

        <h1 className="text-xl font-black text-neutral-900 mb-6">Checkout</h1>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* ── Delivery Address ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" /> Delivery Address
              </h2>
              {!editingAddress && (
                <button onClick={() => { setEditingAddress(true); if (address) populateEditFields(address); }}
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                  <Edit2 className="h-3 w-3" /> {address ? 'Edit' : 'Add Address'}
                </button>
              )}
            </div>

            {editingAddress ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input value={addrFullName} onChange={e => setAddrFullName(e.target.value)} placeholder="Name on package"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Phone</label>
                    <input value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="+1 555 000 0000"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Street Address *</label>
                    <input required value={addrLine1} onChange={e => setAddrLine1(e.target.value)} placeholder="123 Main Street"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Apt, Suite, etc.</label>
                    <input value={addrLine2} onChange={e => setAddrLine2(e.target.value)} placeholder="Optional"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">City *</label>
                    <input required value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="New York"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">State</label>
                    <input value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="New York"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">ZIP / Postal</label>
                    <input value={addrZip} onChange={e => setAddrZip(e.target.value)} placeholder="10001"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Country *</label>
                    <input required value={addrCountry} onChange={e => setAddrCountry(e.target.value)} placeholder="United States"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={applyAddressEdit}
                    disabled={!addrLine1 || !addrCity || !addrCountry}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                    Use This Address
                  </button>
                  <button onClick={() => setEditingAddress(false)}
                    className="px-4 border border-neutral-200 text-xs font-bold text-neutral-600 rounded-lg hover:bg-neutral-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : hasAddress ? (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  {address.fullName && <p className="text-sm font-bold text-neutral-900">{address.fullName}</p>}
                  {address.phone && <p className="text-xs text-neutral-400">{address.phone}</p>}
                  <p className="text-sm text-neutral-600 mt-0.5">{addrLine}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  No delivery address found.{' '}
                  <button onClick={() => setEditingAddress(true)} className="font-bold underline">Add one now</button>
                  {' '}or go to{' '}
                  <Link href="/profile" className="font-bold underline">Profile</Link>.
                </p>
              </div>
            )}
          </div>

          {/* ── Order Items ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="text-sm font-bold text-neutral-700 mb-4">
              {items.length} Item{items.length > 1 ? 's' : ''} in Your Order
            </h2>
            <div className="divide-y divide-neutral-50">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0 items-center">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{item.title}</p>
                    <p className="text-xs text-neutral-400">{item.storeName} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-black text-amber-600 flex-shrink-0">
                    {(parseFloat(item.price) * item.quantity).toFixed(4)} CELO
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3">
            <h2 className="text-sm font-bold text-neutral-700">Payment Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-bold">{totalPrice.toFixed(4)} CELO</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Escrow protection fee</span>
              <span className="font-bold text-emerald-600">Included</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="font-bold text-emerald-600">Free</span>
            </div>
            <div className="border-t border-neutral-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-neutral-900">Total</span>
              <div className="text-right">
                <span className="text-xl font-black text-amber-600">{totalPrice.toFixed(4)} CELO</span>
                <p className="text-[10px] text-neutral-400">≈ ${(totalPrice * 0.70).toFixed(2)} USD</p>
              </div>
            </div>
          </div>

          {/* ── Escrow explanation ── */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-black text-emerald-800">3-Stage Escrow Protection</h3>
            </div>
            <div className="space-y-1 pl-6">
              {[
                ['30%', 'Released when seller begins processing your order'],
                ['20%', 'Released when seller confirms shipment'],
                ['50%', 'Released when you confirm delivery'],
              ].map(([pct, desc]) => (
                <div key={pct} className="flex items-baseline gap-2">
                  <span className="text-xs font-black text-emerald-700 w-8 flex-shrink-0">{pct}</span>
                  <span className="text-xs text-emerald-700">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Place Order button ── */}
          {placing ? (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 text-center space-y-3">
              <RefreshCw className="h-7 w-7 animate-spin text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-neutral-700">{stage}</p>
              <p className="text-xs text-neutral-400">Do not close or refresh this page.</p>
            </div>
          ) : (
            <button onClick={handlePlaceOrder} disabled={!hasAddress}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-4 rounded-xl transition-colors shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Place Order &amp; Pay in Escrow
            </button>
          )}

          {!hasAddress && !placing && (
            <p className="text-center text-xs text-neutral-400">
              A delivery address is required before placing an order.{' '}
              <button onClick={() => setEditingAddress(true)} className="font-bold text-amber-600 hover:underline">Add address ↑</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
