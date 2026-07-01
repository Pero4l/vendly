/**
 * Header.tsx — Desktop Navigation Header
 * ─────────────────────────────────────────────────────────────────
 * Full Amazon-style header rendered ONLY on desktop (md+).
 * On mobile, see:  MobileTopBar.tsx  (top bar)
 *                  BottomNav.tsx     (bottom tab bar)
 *
 * Contains:
 *  - Thin top utility/announcement banner with role switcher
 *  - Logo, full category search, wallet connect, sign-in/out
 *  - Sub-navigation category bar
 *  - Auth modal (sign-in + registration)
 * ─────────────────────────────────────────────────────────────────
 */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, saveToken, saveUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ShieldAlert, Store, User, LogOut, KeyRound, Search, ChevronDown, HelpCircle, Lock, Menu, Bell, ShoppingCart, X, Package, Wallet, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { useCart } from '../context/CartContext';

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user: currentUser, refreshProfile, logout: authLogout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const { totalItems } = useCart();

  // Search States inside Header
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerCategory, setHeaderCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ stores: any[]; products: any[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiRequest('/categories').then(res => {
      if (res.success && res.data?.length) setCategories(res.data);
    }).catch(() => {});
  }, []);

  const openNotifDropdown = async () => {
    setShowNotifDropdown(v => !v);
    if (!notifications.length) {
      setNotifLoading(true);
      try {
        const res = await apiRequest('/notifications');
        setNotifications(res.success && res.data?.length ? res.data.slice(0, 5) : []);
      } catch { setNotifications([]); }
      finally { setNotifLoading(false); }
    }
  };

  // No per-navigation profile fetch — AuthContext handles it globally

  // Sync header search inputs when URL changes
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('categoryId') || '';
    setHeaderSearch(qSearch);
    setHeaderCategory(qCat);
  }, [searchParams]);

  // Live search: debounce 350ms then query both stores + products
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!headerSearch.trim()) { setSearchResults(null); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [prodRes, storeRes] = await Promise.all([
          apiRequest(`/products?search=${encodeURIComponent(headerSearch)}&limit=4`),
          apiRequest(`/stores?search=${encodeURIComponent(headerSearch)}`)
        ]);
        setSearchResults({
          products: prodRes.success ? (prodRes.data || []).slice(0, 4) : [],
          stores: storeRes.success ? (storeRes.data || []).slice(0, 3) : []
        });
      } catch { setSearchResults(null); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [headerSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchResults(null);
    const query = new URLSearchParams();
    if (headerSearch) query.append('search', headerSearch);
    if (headerCategory) query.append('categoryId', headerCategory);
    router.push(`/marketplace?${query.toString()}`);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ fullName, username, email, password })
        });
        if (res.success) {
          setRegisterSuccess(true);
        }
      } else {
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password })
        });
        if (!loginRes.success) throw new Error(loginRes.message || 'Login failed');
        saveToken(loginRes.data.accessToken);
        if (loginRes.data.user) saveUser(loginRes.data.user);
        await refreshProfile();
        setShowAuthModal(false);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch {}
    authLogout();
  };


  return (
    /*
     * hidden md:block — this entire header is hidden on mobile screens.
     * On mobile, MobileTopBar (top) + BottomNav (bottom) handle navigation.
     * On desktop (md+), this full Amazon-style header is shown.
     */
    <header className="hidden md:block sticky top-0 z-50 w-full bg-white border-b border-neutral-200">

      {/* 1. Thin Top Utility Banner */}
      {/* <div className="w-full bg-neutral-900 py-1.5 px-4 text-white text-[11px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Lock className="h-3 w-3" />
              100% Secure Web3 Escrow Payments
            </span>
            <span className="hidden md:inline text-neutral-400">|</span>
            <span className="hidden md:inline text-neutral-300">
              Funds disbursed incrementally: 30% / 20% / 50%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-neutral-400 font-medium">Test Switcher:</span>
            <div className="flex items-center gap-1 bg-neutral-800 rounded-md p-0.5 border border-neutral-700">
              <button
                onClick={() => quickSignIn('BUYER')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'buyer' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Buyer
              </button>
              <button
                onClick={() => quickSignIn('SELLER')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'seller' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Seller
              </button>
              <button
                onClick={() => quickSignIn('ADMIN')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'admin' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* 2. Main High-Visibility Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">

          {/* Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-neutral-900 group-hover:text-amber-500 transition-colors">
                VENDLY
              </span>
              <div className="flex flex-col">
                <span className="bg-amber-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-800 tracking-wider">
                  ESCROW MARKET
                </span>
              </div>
            </Link>

            {/* Mobile Account trigger */}
            <div className="flex items-center gap-2 md:hidden">
              {!currentUser && (
                <button
                  onClick={() => { setIsRegister(false); setShowAuthModal(true); }}
                  className="text-xs font-bold text-neutral-600 border border-neutral-300 rounded-lg px-3 py-1.5"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Large Amazon-Style Search Form */}
          <div className="flex-1 w-full max-w-2xl relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center border-2 border-neutral-350 hover:border-amber-500 focus-within:border-amber-500 rounded-lg overflow-hidden transition-colors"
            >
              <div className="relative bg-neutral-100 border-r border-neutral-350">
                <select
                  value={headerCategory}
                  onChange={e => setHeaderCategory(e.target.value)}
                  className="h-10 px-3 bg-neutral-100 text-neutral-700 text-xs font-semibold focus:outline-none appearance-none pr-8 cursor-pointer rounded-l-md"
                >
                  <option value="">All Departments</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3.5 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
              </div>

              <input
                type="text"
                placeholder="Search products, stores, categories..."
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
                onBlur={() => setTimeout(() => setSearchResults(null), 200)}
                className="flex-1 h-10 px-4 text-sm text-neutral-900 bg-white placeholder-neutral-400 focus:outline-none"
              />

              <button
                type="submit"
                className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Live search dropdown */}
            {searchResults && (searchResults.stores.length > 0 || searchResults.products.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                {searchResults.stores.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Stores</p>
                    {searchResults.stores.map((s: any) => (
                      <Link key={s.id} href={`/marketplace?storeId=${s.id}`}
                        onClick={() => { setSearchResults(null); setHeaderSearch(''); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-black text-amber-700 shrink-0">
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">{s.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{s.description || 'Verified Vendly Store'}</p>
                        </div>
                        <Store className="h-3.5 w-3.5 text-neutral-300 ml-auto shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div className={searchResults.stores.length > 0 ? 'border-t border-neutral-100' : ''}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Products</p>
                    {searchResults.products.map((p: any) => {
                      const img = p.images?.[0]?.url || p.images?.[0]?.imageUrl || '';
                      return (
                        <Link key={p.id} href={`/products/${p.id}`}
                          onClick={() => { setSearchResults(null); setHeaderSearch(''); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                            {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-amber-100" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-neutral-900 truncate">{p.title}</p>
                            <p className="text-[10px] text-neutral-400">{p.price} CELO</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <div className="border-t border-neutral-100 px-4 py-2.5">
                  <button onClick={handleSearchSubmit as any}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                    See all results for &ldquo;{headerSearch}&rdquo; →
                  </button>
                </div>
              </div>
            )}
            {searchLoading && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl px-4 py-3">
                <p className="text-xs text-neutral-400">Searching...</p>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4">

            {/* Wallet Connect */}
            {/* <ConnectButton showBalance={false} /> */}

            {/* Profile Dropdown or Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    Hello, {currentUser.fullName ? currentUser.fullName.split(' ')[0] : currentUser.username || 'User'}
                  </span>
                  <Link
                    href="/profile"
                    className="text-xs font-bold text-neutral-800 hover:text-amber-500 flex items-center gap-0.5"
                  >
                    My Account
                    <ChevronDown className="h-3 w-3" />
                  </Link>
                </div>

                <div className="h-8 w-px bg-neutral-200" />

                {/* Cart */}
                <Link href="/cart" className="relative p-2 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-amber-500 transition-colors" title="Cart">
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* Notification bell + dropdown */}
                <div className="relative">
                  <button onClick={openNotifDropdown}
                    className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-amber-500 transition-colors relative"
                    title="Notifications">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full" />
                  </button>

                  {showNotifDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                      <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                          <span className="text-sm font-bold text-neutral-900">Notifications</span>
                          <button onClick={() => setShowNotifDropdown(false)} className="p-1 rounded-full hover:bg-neutral-100">
                            <X className="h-3.5 w-3.5 text-neutral-400" />
                          </button>
                        </div>
                        <div className="divide-y divide-neutral-50 max-h-72 overflow-y-auto">
                          {notifLoading ? (
                            <div className="p-6 text-center text-xs text-neutral-400">Loading...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-neutral-400">No notifications yet</div>
                          ) : notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? 'bg-amber-50' : ''}`}>
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'order' ? 'bg-blue-100 text-blue-600' : n.type === 'escrow' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {n.type === 'order' ? <Package className="h-3.5 w-3.5" /> : n.type === 'wallet' ? <Wallet className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-800">{n.title}</p>
                                <p className="text-[11px] text-neutral-500 truncate">{n.message}</p>
                              </div>
                              {!n.read && <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1" />}
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2 border-t border-neutral-100">
                          <Link href="/notifications" onClick={() => setShowNotifDropdown(false)}
                            className="text-xs font-bold text-amber-600 hover:underline">
                            View all notifications →
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-neutral-100 rounded-full text-red-700 hover:text-neutral-900 transition-colors"
                  title="Logout Account"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsRegister(false); setShowAuthModal(true); }}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Departments Bar */}
      <div className="w-full bg-neutral-900 border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-stretch justify-between">

          {/* Left: All Departments dropdown + inline category pills */}
          <div className="flex items-stretch min-w-0 flex-1">
            {/* All Departments button with hover dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 h-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-colors cursor-pointer whitespace-nowrap">
                <Menu className="h-3.5 w-3.5" />
                All Departments
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
              {/* Dropdown panel */}
              <div className="absolute left-0 top-full z-50 w-56 bg-white border border-neutral-200 shadow-2xl rounded-b-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                <Link
                  href="/marketplace"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-neutral-100"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                  All Products
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/marketplace?categoryId=${cat.id}`}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-600 hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-neutral-50 last:border-0"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/marketplace?search=Special"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border-t border-neutral-100"
                >
                  🔥 Today&apos;s Hot Deals
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-neutral-700 mx-1 my-2" />

            {/* Inline category links */}
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-2 min-w-0">
              <Link
                href="/marketplace"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${pathname === '/marketplace' && !searchParams.get('categoryId') ? 'bg-amber-500 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
              >
                Marketplace
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/marketplace?categoryId=${cat.id}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${searchParams.get('categoryId') === cat.id ? 'bg-amber-500 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/marketplace?search=Special"
                className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-400 hover:bg-neutral-800 hover:text-rose-300 whitespace-nowrap transition-colors"
              >
                🔥 Hot Deals
              </Link>
            </div>
          </div>

          {/* Right: user-contextual links */}
          <div className="hidden lg:flex items-center gap-1 text-neutral-400 text-xs font-semibold shrink-0 pl-4">
            {currentUser && (
              <>
                <Link href="/dashboard" className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-neutral-800 hover:text-white ${pathname === '/dashboard' ? 'text-amber-400 font-bold' : ''}`}>
                  Dashboard
                </Link>
                <Link href="/wallet" className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-neutral-800 hover:text-white flex items-center gap-1 ${pathname === '/wallet' ? 'text-amber-400 font-bold' : ''}`}>
                  <Wallet className="h-3 w-3" /> My Wallet
                </Link>
                {currentUser.role === 'seller' && (
                  <Link href="/store" className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-neutral-800 hover:text-white ${pathname === '/store' ? 'text-amber-400 font-bold' : ''}`}>
                    My Store
                  </Link>
                )}
                {currentUser.role === 'admin' && (
                  <Link href="/admin" className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-neutral-800 hover:text-white ${pathname === '/admin' ? 'text-amber-400 font-bold' : ''}`}>
                    Admin
                  </Link>
                )}
                <div className="w-px bg-neutral-700 h-4 mx-1" />
              </>
            )}
            {(!currentUser || currentUser.role === 'buyer') && (
              <Link href="/become-vendor" className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-amber-500 hover:text-white flex items-center gap-1 ${pathname === '/become-vendor' ? 'bg-amber-500 text-white' : 'text-amber-400'}`}>
                <Store className="h-3 w-3" />
                Become a Vendor
              </Link>
            )}
            <Link href="/buyer-protection" className="px-3 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-neutral-800 hover:text-emerald-400 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-emerald-500" />
              Buyer Protection
            </Link>
          </div>

        </div>
      </div>

      {/* 4. Auth Modal Redesigned */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-neutral-900">
                  {isRegister ? 'Join Vendly Escrow' : 'Sign In to Vendly'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {isRegister ? 'Start secure trading on the Celo network' : 'Access your purchases, store, and alerts'}
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-neutral-400 hover:text-neutral-900 text-lg font-semibold h-8 w-8 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-600 border border-rose-200 font-medium">
                {error}
              </div>
            )}

            {registerSuccess ? (
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <KeyRound className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-800">Check your inbox!</p>
                <p className="text-xs text-emerald-700">We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
                <button
                  onClick={() => { setShowAuthModal(false); setRegisterSuccess(false); setIsRegister(false); }}
                  className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="mt-6 space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                      <input type="text" required placeholder="e.g. Alice Smith" value={fullName} onChange={e => setFullName(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Username</label>
                      <input type="text" required placeholder="e.g. alice_smith (4–15 chars)" value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                        className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="e.g. buyer@vendly.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Password</label>
                  <div className="relative mt-1.5">
                    <input type={showPassword ? 'text' : 'password'} required placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors mt-6 cursor-pointer disabled:opacity-60">
                  {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-neutral-500 border-t border-neutral-100 pt-4">
              {!registerSuccess && (isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button onClick={() => { setIsRegister(false); setError(''); }} className="text-amber-600 font-semibold hover:underline cursor-pointer">Sign In</button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{' '}
                  <button onClick={() => { setIsRegister(true); setError(''); }} className="text-amber-600 font-semibold hover:underline cursor-pointer">Create Account</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-neutral-200" />}>
      <HeaderContent />
    </Suspense>
  );
}
