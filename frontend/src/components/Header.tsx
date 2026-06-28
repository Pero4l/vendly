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
import { apiRequest, saveToken, removeToken, saveUser, removeUser } from '../utils/api';
import { ShoppingBag, ShieldAlert, Store, User, LogOut, KeyRound, Search, ChevronDown, HelpCircle, Lock, Menu, Bell, ShoppingCart, X, Package, Wallet, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { useCart } from '../context/CartContext';

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
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

  const categories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Digital Services' },
    { id: '3', name: 'Apparel' },
    { id: '4', name: 'Home & Kitchen' }
  ];

  const MOCK_NOTIFS = [
    { id: '1', type: 'order', title: 'Order Placed', message: 'Your order is awaiting seller confirmation.', createdAt: new Date(Date.now()-300000).toISOString(), read: false },
    { id: '2', type: 'escrow', title: 'Escrow Milestone', message: 'Milestone 1 (30%) released to seller.', createdAt: new Date(Date.now()-3600000).toISOString(), read: true },
    { id: '3', type: 'wallet', title: 'Wallet Ready', message: 'Your custodial wallet has been created.', createdAt: new Date(Date.now()-86400000).toISOString(), read: true },
  ];

  const openNotifDropdown = async () => {
    setShowNotifDropdown(v => !v);
    if (!notifications.length) {
      setNotifLoading(true);
      try {
        const res = await apiRequest('/notifications');
        setNotifications(res.success && res.data?.length ? res.data.slice(0, 5) : MOCK_NOTIFS);
      } catch { setNotifications(MOCK_NOTIFS); }
      finally { setNotifLoading(false); }
    }
  };

  const loadProfile = async () => {
    try {
      const res = await apiRequest('/auth/profile');
      if (res.success) {
        setCurrentUser(res.data);
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Sync header search inputs when URL changes
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('categoryId') || '';
    setHeaderSearch(qSearch);
    setHeaderCategory(qCat);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        saveToken(loginRes.data.accessToken);
        if (loginRes.data.user) saveUser(loginRes.data.user);
        await loadProfile();
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
    removeToken();
    removeUser();
    setCurrentUser(null);
    router.push('/');
  };

  const quickSignIn = async (targetRole: string) => {
    setLoading(true);
    try {
      const emailMap: Record<string, string> = {
        BUYER: 'buyer@vendly.com',
        SELLER: 'seller@vendly.com',
        ADMIN: 'admin@vendly.com'
      };
      const nameMap: Record<string, string> = {
        BUYER: 'Alice Buyer',
        SELLER: 'Bob Storefront',
        ADMIN: 'Chief Moderator'
      };

      const targetEmail = emailMap[targetRole];
      const targetName = nameMap[targetRole];

      try {
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: targetEmail, password: 'password123' })
        });
        saveToken(loginRes.data.accessToken);
      } catch (err) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: targetName,
            email: targetEmail,
            password: 'password123',
            role: targetRole
          })
        });
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: targetEmail, password: 'password123' })
        });
        saveToken(loginRes.data.accessToken);
      }

      await loadProfile();
      router.push('/dashboard');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      console.error('Quick sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * hidden md:block — this entire header is hidden on mobile screens.
     * On mobile, MobileTopBar (top) + BottomNav (bottom) handle navigation.
     * On desktop (md+), this full Amazon-style header is shown.
     */
    <header className="hidden md:block sticky top-0 z-50 w-full bg-white border-b border-neutral-200">

      {/* 1. Thin Top Utility Banner */}
      <div className="w-full bg-neutral-900 py-1.5 px-4 text-white text-[11px] sm:px-6 lg:px-8">
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'BUYER' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Buyer
              </button>
              <button
                onClick={() => quickSignIn('SELLER')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'SELLER' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Seller
              </button>
              <button
                onClick={() => quickSignIn('ADMIN')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${currentUser?.role === 'ADMIN' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 w-full max-w-2xl flex items-center border-2 border-neutral-350 hover:border-amber-500 focus-within:border-amber-500 rounded-lg overflow-hidden transition-colors"
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
              placeholder="Search secure Celo listings, hardware ledgers, art collections..."
              value={headerSearch}
              onChange={e => setHeaderSearch(e.target.value)}
              className="flex-1 h-10 px-4 text-sm text-neutral-900 bg-white placeholder-neutral-400 focus:outline-none"
            />

            <button
              type="submit"
              className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

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
                    href="/dashboard"
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
                  className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-neutral-900 transition-colors"
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

      {/* 3. Sub-Navigation Category bar */}
      <div className="w-full bg-neutral-50 border-t border-neutral-200 py-2 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex justify-between items-center text-xs font-semibold text-neutral-600">

          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            <span className="flex items-center gap-1.5 text-neutral-900 font-bold hover:text-amber-500 cursor-pointer">
              <Menu className="h-4 w-4 text-amber-500" />
              All Departments
            </span>

            <Link href="/marketplace" className={`hover:text-neutral-900 transition-colors ${pathname === '/marketplace' ? 'text-amber-600 font-bold' : ''}`}>
              Marketplace
            </Link>

            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/marketplace?categoryId=${cat.id}`}
                className={`hover:text-neutral-900 transition-colors ${searchParams.get('categoryId') === cat.id ? 'text-amber-600 font-bold' : ''}`}
              >
                {cat.name}
              </Link>
            ))}

            <Link href="/marketplace?search=Special" className="text-rose-600 hover:text-rose-700 transition-colors font-bold">
              Today's Hot Deals
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-neutral-500">
          {currentUser && (
              <>
                <Link href="/dashboard" className={`hover:text-neutral-900 transition ${pathname === '/dashboard' ? 'text-amber-600 font-bold' : ''}`}>
                  Dashboard
                </Link>
                <Link href="/wallet" className={`hover:text-neutral-900 transition flex items-center gap-1 ${pathname === '/wallet' ? 'text-amber-600 font-bold' : ''}`}>
                  My Wallet
                </Link>
                {currentUser.role === 'SELLER' && (
                  <Link href="/store" className={`hover:text-neutral-900 transition ${pathname === '/store' ? 'text-amber-600 font-bold' : ''}`}>
                    Seller Storefront
                  </Link>
                )}
                {currentUser.role === 'ADMIN' && (
                  <Link href="/admin" className={`hover:text-neutral-900 transition ${pathname === '/admin' ? 'text-amber-600 font-bold' : ''}`}>
                    Admin Operations
                  </Link>
                )}
              </>
            )}

            <a href="#" className="hover:text-neutral-900 flex items-center gap-1 transition-colors">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
              Buyer Protection Policy
            </a>
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
