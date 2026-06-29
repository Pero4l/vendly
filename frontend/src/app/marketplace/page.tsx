'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { ShoppingBag, Search, Sparkles, Filter, ShieldCheck, ArrowRight, Star, RefreshCw, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';

const ELECTRONICS_IMG   = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=400';
const DIGITAL_IMG       = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400';
const FASHION_IMG       = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400';
const HOME_IMG          = 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&q=80&w=400';
const HEALTH_IMG        = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=400';
const SPORTS_IMG        = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400';
const BOOKS_IMG         = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400';
const ART_IMG           = 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=400';
const PHONES_IMG        = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400';
const LAPTOPS_IMG       = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=400';
const FURNITURE_IMG     = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400';
const KITCHEN_IMG       = 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&q=80&w=400';
const FALLBACK_IMG      = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=400';

// Keyword → image. Checked in order; first match wins.
const CAT_KEYWORD_MAP: Array<[string, string]> = [
  ['phone',       PHONES_IMG],
  ['tablet',      PHONES_IMG],
  ['laptop',      LAPTOPS_IMG],
  ['computer',    LAPTOPS_IMG],
  ['electronic',  ELECTRONICS_IMG],
  ['tech',        ELECTRONICS_IMG],
  ['gadget',      ELECTRONICS_IMG],
  ['digital',     DIGITAL_IMG],
  ['software',    DIGITAL_IMG],
  ['service',     DIGITAL_IMG],
  ['fashion',     FASHION_IMG],
  ['apparel',     FASHION_IMG],
  ['cloth',       FASHION_IMG],
  ['wear',        FASHION_IMG],
  ['men',         FASHION_IMG],
  ['women',       FASHION_IMG],
  ['kitchen',     KITCHEN_IMG],
  ['furniture',   FURNITURE_IMG],
  ['home',        HOME_IMG],
  ['living',      HOME_IMG],
  ['health',      HEALTH_IMG],
  ['beauty',      HEALTH_IMG],
  ['cosmetic',    HEALTH_IMG],
  ['wellness',    HEALTH_IMG],
  ['sport',       SPORTS_IMG],
  ['outdoor',     SPORTS_IMG],
  ['fitness',     SPORTS_IMG],
  ['book',        BOOKS_IMG],
  ['media',       BOOKS_IMG],
  ['music',       BOOKS_IMG],
  ['art',         ART_IMG],
  ['collect',     ART_IMG],
  ['craft',       ART_IMG],
];

const getCatImage = (name: string): string => {
  const lower = name.toLowerCase();
  const hit = CAT_KEYWORD_MAP.find(([kw]) => lower.includes(kw));
  return hit ? hit[1] : FALLBACK_IMG;
};

function MarketplaceContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const { addItem } = useCart();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read URL search params for instant header-homepage sync
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('categoryId') || '';
    const qStore = searchParams.get('storeId') || '';
    setSearch(qSearch);
    setDebouncedSearch(qSearch);
    setCategory(qCat);
    setStoreFilter(qStore);
  }, [searchParams]);

  // Debounce: only update debouncedSearch 350ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchProducts = async (overrideSearch?: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      const s = overrideSearch !== undefined ? overrideSearch : debouncedSearch;
      if (s) query.append('search', s);
      if (category) query.append('categoryId', category);
      if (storeFilter) query.append('storeId', storeFilter);
      if (minPrice) query.append('minPrice', minPrice);
      if (maxPrice) query.append('maxPrice', maxPrice);
      if (minRating) query.append('minRating', minRating);

      const res = await apiRequest(`/products?${query.toString()}`);
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load real categories from API once
  useEffect(() => {
    apiRequest('/categories').then(res => {
      if (res.success && res.data?.length) setCategories(res.data);
    }).catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem('vendly_favorites') || '[]');
      setFavorites(saved);
    } catch {}
  }, []);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('vendly_favorites', JSON.stringify(next));
  };

  const handleAddToCart = (product: any) => {
    const img = product.images?.[0]?.url || product.images?.[0]?.imageUrl || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || '';
    addItem({ id: product.id, title: product.title, price: String(product.price), image: img, storeId: product.storeId || '', storeName: product.store?.name || 'Vendly Store' });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  // Refetch when debounced search, category, or rating changes
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, category, storeFilter, minRating]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Cancel pending debounce and search immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncedSearch(search);
  };


  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      <Header />

      {/* 1. Large eBay/Amazon Style Hero Promotional Banner */}
      <section className="relative bg-neutral-900 overflow-hidden py-12 md:py-20 px-6 sm:px-12 lg:px-20 border-b border-neutral-200">
        {/* Background visual graphics */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-25 hidden md:block">
          <img 
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800" 
            alt="Web3 secure tech background" 
            className="w-full h-full object-cover grayscale brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl space-y-6 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            100% Secure Web3 Smart Contract Escrow
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white max-w-2xl leading-none">
            Secure, Safe & Verified <br />
            <span className="text-amber-500">Commerce on Celo</span>
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-neutral-400 leading-relaxed">
            Trade physical items and digital certificates with automatic buyer protection. Your CELO/cUSD is locked securely in a multi-stage release smart contract until delivery is audited.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="#catalog"
              className="rounded-lg bg-amber-500 hover:bg-amber-600 px-6 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              Browse Catalog
            </a>
            <Link 
              href="/store"
              className="rounded-lg border border-neutral-700 hover:border-neutral-500 px-6 py-3 text-sm font-bold text-neutral-300 transition-colors"
            >
              Open Merchant Store
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Department Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 pb-2 w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Departments</p>
          {category && (
            <button onClick={() => setCategory('')} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer">
              Clear ✕
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 w-20 flex-shrink-0 rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
            {categories.map((cat: any) => {
              const active = category === cat.id;
              const imgSrc = cat.image?.url || getCatImage(cat.name);
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(active ? '' : cat.id)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none
                    ${active ? 'ring-2 ring-amber-500 shadow-md' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                >
                  <div className="h-30 sm:h-16 relative">
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent" />
                    {active && (
                      <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-amber-500 flex items-center justify-center">
                        <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1">
                      <p className="text-white font-black text-[10px] leading-tight truncate drop-shadow-sm">{cat.name}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Main Browser Catalog container */}
      <main id="catalog" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col lg:flex-row gap-8 w-full">
        
        {/* Left Side Filter Panel */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-extrabold text-neutral-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Filter className="h-4 w-4 text-amber-500" />
                Filter Catalog
              </h3>
            </div>

            {/* Keyword Search inside Sidebar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Keywords</label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text"
                  placeholder="e.g. Ledger, Hoodie..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pl-9 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              </form>
            </div>

            {/* Department Selection list */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Departments</label>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => setCategory('')} 
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    !category ? 'bg-amber-500 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  All Departments
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                      category === cat.id ? 'bg-amber-500 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price bounds filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Price (CELO)</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-1/2 rounded-lg border border-neutral-350 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <input 
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-1/2 rounded-lg border border-neutral-350 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <button 
                onClick={() => fetchProducts()}
                className="w-full mt-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Apply Price Limit
              </button>
            </div>

            {/* Seller Reputation Rating Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Seller Rating</label>
              <div className="flex flex-col gap-1">
                {[
                  { val: '4.8', label: '4.8 Stars & Up' },
                  { val: '4.5', label: '4.5 Stars & Up' },
                  { val: '', label: 'All Ratings' }
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => setMinRating(r.val)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                      minRating === r.val ? 'bg-amber-100 text-amber-800 font-bold' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </aside>

        {/* Right side: Product Catalog Grid */}
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">
                {category ? categories.find(c => c.id === category)?.name : 'All Products'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Verified escrow protection active on all items</p>
            </div>
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
              {products.length} Items Available
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-xs text-neutral-500 font-medium">Retrieving verified listings...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-350 p-16 text-center text-neutral-500">
              <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-base font-bold text-neutral-700">No products found</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No active listings match your filters. Try clearing your search or adjusting the filters.
              </p>
              <button
                onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setMinRating(''); }}
                className="mt-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white px-4 py-2 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => {
                const img = product.images?.[0]?.url || product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400';
                const rating = product.rating ? parseFloat(product.rating) : null;
                const usdEstimate = (parseFloat(product.price) * 0.70).toFixed(2);

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative cursor-pointer"
                  >
                    {/* Top image wrapper */}
                    <div className="relative h-48 bg-neutral-100 overflow-hidden">
                      <img
                        src={img}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-black text-amber-400 tracking-wider">
                        {product.price} CELO
                      </span>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); }}
                        className="absolute top-3 left-3 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm transition-colors hover:bg-white">
                        <Heart className={`h-3.5 w-3.5 ${favorites.includes(product.id) ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'}`} />
                      </button>
                    </div>

                    {/* Content details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Store title & details */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                            Store: {product.store?.name}
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] bg-emerald-50 border border-emerald-200 rounded px-1 text-emerald-800 font-bold">
                            <ShieldCheck className="h-3 w-3" />
                            Escrow Protected
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-neutral-900 text-sm leading-snug group-hover:text-amber-500 transition-colors line-clamp-1">
                            {product.title}
                          </h3>
                          {product.quality && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${
                              product.quality === 'new'         ? 'bg-emerald-100 text-emerald-700' :
                              product.quality === 'neatly_used' ? 'bg-blue-100 text-blue-700' :
                                                                  'bg-neutral-100 text-neutral-600'
                            }`}>
                              {product.quality === 'new' ? 'New' : product.quality === 'neatly_used' ? 'Neatly Used' : 'Old Used'}
                            </span>
                          )}
                        </div>

                        {/* Rating stars — only shown if product has a real rating */}
                        {rating !== null && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`h-3 w-3 ${idx < Math.floor(rating) ? 'fill-current' : 'text-neutral-200'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-bold">{rating.toFixed(1)}</span>
                          </div>
                        )}

                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed pt-1">
                          {product.description}
                        </p>
                      </div>

                      {/* Bottom action block */}
                      <div className="space-y-2 pt-3 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-400 font-medium">Est. Price</span>
                            <span className="text-xs font-black text-neutral-700">${usdEstimate} USD</span>
                          </div>
                          <span className="rounded-lg bg-amber-500 group-hover:bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition-colors">
                            View Deal
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                          className={`w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors cursor-pointer ${addedToCart === product.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {addedToCart === product.id ? 'Added to Cart!' : 'Add to Cart'}
                        </button>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* 4. Escrow Process Educational Banner */}
      <section className="bg-neutral-50 border-t border-neutral-200 py-12 px-6 sm:px-12 lg:px-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-neutral-900">How Vendly Protected Escrow Works</h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Smart contracts shield both buyers and sellers, releasing funds upon delivery verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 text-left space-y-2">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">1</div>
              <h4 className="font-bold text-sm text-neutral-900">Funds Escrowed (30%)</h4>
              <p className="text-[11px] text-neutral-500">Buyer purchases item. Initial 30% payment is locked on-chain to verify liquidity and confirm the order to the merchant.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 text-left space-y-2">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">2</div>
              <h4 className="font-bold text-sm text-neutral-900">Shipment Release (20%)</h4>
              <p className="text-[11px] text-neutral-500">Seller ships products and inputs carrier tracking code. 20% milestone is released to fund logistics and handling.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 text-left space-y-2">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">3</div>
              <h4 className="font-bold text-sm text-neutral-900">Final Settlement (50%)</h4>
              <p className="text-[11px] text-neutral-500">Buyer confirms receipt or the courier delivery is verified. The final 50% is released, and feedback score accumulates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Vendly Escrow Marketplace. Built on Celo.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/buyer-protection" className="hover:underline">Buyer Protection</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-white text-neutral-900 justify-center items-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
