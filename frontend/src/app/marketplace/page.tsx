'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { ShoppingBag, Search, Sparkles, Filter, ShieldCheck, ArrowRight, Star, RefreshCw, AlertCircle, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';

function MarketplaceContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const { addItem } = useCart();

  // Read URL search params for instant header-homepage sync
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('categoryId') || '';
    setSearch(qSearch);
    setCategory(qCat);
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category) query.append('categoryId', category);
      if (minPrice) query.append('minPrice', minPrice);
      if (maxPrice) query.append('maxPrice', maxPrice);

      const res = await apiRequest(`/products?${query.toString()}`);
      if (res.success) {
        let items = res.data;
        // Client-side rating filter simulation if selected
        if (minRating) {
          const rLimit = parseFloat(minRating);
          items = items.filter((p: any) => {
            const pRating = p.id === 'p1' ? 4.9 : p.id === 'p2' ? 4.8 : p.id === 'p3' ? 4.7 : 4.5;
            return pRating >= rLimit;
          });
        }
        setProducts(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategories([
        { id: '1', name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400' },
        { id: '2', name: 'Digital Services', slug: 'digital-services', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400' },
        { id: '3', name: 'Apparel', slug: 'apparel', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400' },
        { id: '4', name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400' }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
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
    const img = product.images?.[0]?.imageUrl || product.images?.[0] || '';
    addItem({ id: product.id, title: product.title, price: String(product.price), image: img, storeId: product.storeId || '', storeName: product.store?.name || 'Vendly Store' });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  // Re-run search/fetch when categories, keyword, rating limits change
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [category, search, minRating]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const seedMockStoreAndProducts = async () => {
    setSeedLoading(true);
    try {
      const sellerEmail = 'seller@vendly.com';
      let loginRes;
      try {
        loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: sellerEmail, password: 'password123' })
        });
      } catch (err) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Bob Storefront',
            email: sellerEmail,
            password: 'password123',
            role: 'SELLER'
          })
        });
        loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: sellerEmail, password: 'password123' })
        });
      }

      const previousToken = localStorage.getItem('vendly_token');
      localStorage.setItem('vendly_token', loginRes.data.accessToken);

      let storeRes;
      try {
        storeRes = await apiRequest('/stores', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Celo Alpha Emporium',
            description: 'Premium Web3 physical goods and digital assets.'
          })
        });
      } catch (err) {
        storeRes = await apiRequest('/stores/my-store');
      }

      const storeId = storeRes.data.id;

      const adminEmail = 'admin@vendly.com';
      let adminLoginRes;
      try {
        adminLoginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
      } catch (err) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Chief Moderator',
            email: adminEmail,
            password: 'password123',
            role: 'ADMIN'
          })
        });
        adminLoginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
      }

      localStorage.setItem('vendly_token', adminLoginRes.data.accessToken);
      await apiRequest('/admin/approve-store', {
        method: 'POST',
        body: JSON.stringify({ storeId, approve: true })
      });

      localStorage.setItem('vendly_token', loginRes.data.accessToken);

      const mockCategory = categories[0] || { id: '1' };

      const p1 = {
        title: 'Premium Web3 Hardware Ledger',
        description: 'Secure, offline physical storage device supporting CELO, cUSD, and standard tokens.',
        price: '1.5',
        quantity: 10,
        categoryId: mockCategory.id,
        images: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400']
      };

      const p2 = {
        title: 'Celo NFT Artwork Collection',
        description: 'Limited edition high fidelity digital art minted directly on the Celo blockchain.',
        price: '0.5',
        quantity: 5,
        categoryId: mockCategory.id,
        images: ['https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400']
      };

      const p3 = {
        title: 'Sleek Cyber Hoodie (Special Edition)',
        description: 'Cotton-poly blend cyber-aesthetic apparel with embroidered physical QR tag.',
        price: '2.0',
        quantity: 20,
        categoryId: mockCategory.id,
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400']
      };

      await apiRequest('/products', { method: 'POST', body: JSON.stringify(p1) });
      await apiRequest('/products', { method: 'POST', body: JSON.stringify(p2) });
      await apiRequest('/products', { method: 'POST', body: JSON.stringify(p3) });

      if (previousToken) {
        localStorage.setItem('vendly_token', previousToken);
      } else {
        localStorage.removeItem('vendly_token');
      }

      await fetchProducts();
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
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

      {/* 2. Amazon-style Department Grid (4-box Cards) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat: any) => (
            <div 
              key={cat.id} 
              className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-neutral-900 text-base">{cat.name}</h3>
                <div className="h-32 rounded-lg overflow-hidden relative">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <button
                onClick={() => setCategory(cat.id)}
                className="mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
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
                onClick={fetchProducts}
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

          {/* Seeding block if empty database */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Demo Helper Panel
            </h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              If the database contains no listings yet, click below to automatically seed mock store profiles, category tokens, and verified product listings.
            </p>
            <button 
              onClick={seedMockStoreAndProducts}
              disabled={seedLoading}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {seedLoading ? 'Seeding Database...' : 'Seed Mock Products'}
            </button>
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
                No active listings match your filters. Try clearing your search keyword or seed mock products.
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
                const img = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400';
                
                // Simulate reviews score and USD estimation
                const mockRating = product.id === 'p1' ? 4.9 : product.id === 'p2' ? 4.8 : product.id === 'p3' ? 4.7 : 4.5;
                const mockSales = product.id === 'p1' ? 42 : product.id === 'p2' ? 18 : product.id === 'p3' ? 64 : 12;
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

                        <h3 className="font-extrabold text-neutral-900 text-sm leading-snug group-hover:text-amber-500 transition-colors line-clamp-1">
                          {product.title}
                        </h3>

                        {/* Rating stars */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star 
                                key={idx} 
                                className={`h-3 w-3 ${idx < Math.floor(mockRating) ? 'fill-current' : 'text-neutral-200'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-bold">({mockRating} / {mockSales} sales)</span>
                        </div>

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
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Escrow Audits</a>
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
