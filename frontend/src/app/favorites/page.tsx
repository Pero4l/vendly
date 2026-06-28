'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { Heart, ArrowLeft, ShoppingBag, Star, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vendly_favorites') || '[]');
      setFavorites(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (favorites.length === 0) { setLoading(false); return; }
    apiRequest('/products')
      .then(res => {
        if (res.success) {
          setProducts(res.data.filter((p: any) => favorites.includes(p.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favorites]);

  const removeFavorite = (id: string) => {
    const next = favorites.filter(f => f !== id);
    setFavorites(next);
    setProducts(prev => prev.filter(p => p.id !== id));
    localStorage.setItem('vendly_favorites', JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-500" />
          </Link>
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
            Favorites
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse">
                <div className="h-36 bg-neutral-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center space-y-4">
            <Heart className="h-12 w-12 text-neutral-200 mx-auto" />
            <h2 className="text-lg font-bold text-neutral-700">No favorites yet</h2>
            <p className="text-sm text-neutral-400">Tap the heart icon on any product to save it here.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden group">
                <div className="relative">
                  <Link href={`/products/${product.id}`}>
                    <div className="h-36 overflow-hidden bg-neutral-100">
                      {product.images?.[0] ? (
                        <img src={product.images[0]?.url || product.images[0]?.imageUrl || (typeof product.images[0] === 'string' ? product.images[0] : '')} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-amber-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <button onClick={() => removeFavorite(product.id)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white shadow flex items-center justify-center">
                    <Heart className="h-3.5 w-3.5 text-rose-500" fill="currentColor" />
                  </button>
                </div>
                <div className="p-3">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-xs font-bold text-neutral-900 line-clamp-2 mb-1 hover:text-amber-600">{product.title}</h3>
                  </Link>
                  <p className="text-xs font-black text-amber-600">{product.price} CELO</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-medium">Escrow</span>
                  </div>
                  <button
                    onClick={() => addItem({ id: product.id, title: product.title, price: product.price, image: product.images?.[0]?.url || product.images?.[0]?.imageUrl || (typeof product.images?.[0] === 'string' ? product.images[0] : ''), storeId: product.storeId || '', storeName: product.store?.displayName || product.store?.name || 'Vendly Store' })}
                    className="w-full mt-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
