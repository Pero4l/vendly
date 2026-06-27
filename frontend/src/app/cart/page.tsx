'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQty, totalItems, totalPrice, clearCart } = useCart();

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
            {totalItems > 0 && <span className="text-sm font-bold text-neutral-400">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>}
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
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
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
                    <h3 className="text-sm font-bold text-neutral-900 truncate">{item.title}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.storeName}</p>
                    <p className="text-sm font-black text-amber-600 mt-1">
                      {(parseFloat(item.price) * item.quantity).toFixed(4)} CELO
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeItem(item.id)}
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
              <div className="border-t border-neutral-100 pt-3 flex justify-between">
                <span className="text-sm font-bold text-neutral-900">Total</span>
                <span className="text-lg font-black text-amber-600">{totalPrice.toFixed(4)} CELO</span>
              </div>
            </div>

            {/* Escrow trust badge */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                All payments are held in secure escrow until you confirm delivery. Your money is safe.
              </p>
            </div>

            {/* Note: checkout each item individually from product page */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700">
              <strong>How to checkout:</strong> Visit each product page and click "Buy Now" to place individual escrow-protected orders. Each order is secured separately.
            </div>

            <Link href="/marketplace" className="flex items-center justify-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-700 py-2">
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
