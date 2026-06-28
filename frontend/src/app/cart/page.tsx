'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { getUser } from '../../utils/api';
import {
  ShoppingCart, Trash2, Plus, Minus, ShieldCheck, ArrowRight,
  ShoppingBag, MapPin, AlertTriangle, CheckCircle
} from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQty, totalItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [checkoutClicked, setCheckoutClicked] = useState(false);

  const handleCheckout = () => {
    setCheckoutClicked(true);
    const user = getUser();
    const addr = user?.address;
    if (addr?.line1 && addr?.city && addr?.country) {
      router.push('/checkout');
    }
  };

  const user = typeof window !== 'undefined' ? getUser() : null;
  const addr = user?.address;
  const hasAddress = !!(addr?.line1 && addr?.city && addr?.country);
  const showAddressWarning = checkoutClicked && !hasAddress;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-500" />
            Your Cart
            {totalItems > 0 && (
              <span className="text-sm font-bold text-neutral-400">
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-xs text-rose-500 hover:text-rose-700 font-bold">
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center space-y-4">
            <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto" />
            <h2 className="text-lg font-bold text-neutral-700">Your cart is empty</h2>
            <p className="text-sm text-neutral-400">Browse the marketplace and add products you love.</p>
            <Link href="/marketplace"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
              Browse Marketplace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart items */}
            <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 items-center">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id}`}>
                      <h3 className="text-sm font-bold text-neutral-900 truncate hover:text-amber-600 transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.storeName}</p>
                    <p className="text-sm font-black text-amber-600 mt-1">
                      {(parseFloat(item.price) * item.quantity).toFixed(4)} CELO
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors ml-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3">
              <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Order Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal ({totalItems} items)</span>
                <span className="font-bold">{totalPrice.toFixed(4)} CELO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Platform escrow fee</span>
                <span className="font-bold text-emerald-600">Included</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Shipping</span>
                <span className="font-bold text-emerald-600">Free</span>
              </div>
              <div className="border-t border-neutral-100 pt-3 flex justify-between">
                <span className="text-sm font-bold text-neutral-900">Total</span>
                <span className="text-lg font-black text-amber-600">{totalPrice.toFixed(4)} CELO</span>
              </div>
            </div>

            {/* Delivery address status */}
            {hasAddress ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800">Delivering to:</p>
                  <p className="text-xs text-emerald-700 truncate">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.country}
                  </p>
                </div>
                <Link href="/profile" className="text-xs font-bold text-emerald-700 hover:underline flex-shrink-0">
                  Edit
                </Link>
              </div>
            ) : (
              <div className={`flex items-start gap-3 rounded-xl p-3.5 border ${showAddressWarning ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                {showAddressWarning
                  ? <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  : <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`text-xs font-bold ${showAddressWarning ? 'text-rose-700' : 'text-amber-800'}`}>
                    {showAddressWarning ? 'Delivery address required' : 'No delivery address saved'}
                  </p>
                  <p className={`text-xs mt-0.5 ${showAddressWarning ? 'text-rose-600' : 'text-amber-700'}`}>
                    Add a delivery address in your profile before checking out.{' '}
                    <Link href="/profile" className="font-bold underline">Go to Profile →</Link>
                  </p>
                </div>
              </div>
            )}

            {/* Escrow trust badge */}
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-xl p-3.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-neutral-600 font-medium">
                Payment held in 3-stage escrow until you confirm delivery. Your funds are always protected.
              </p>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-4 rounded-xl transition-colors shadow-sm">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <Link href="/marketplace"
              className="flex items-center justify-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 py-2">
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
