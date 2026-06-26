'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { apiRequest, saveToken, removeToken } from '../utils/api';
import { ShoppingBag, ShieldAlert, Store, User, LogOut, KeyRound, Search, ChevronDown, HelpCircle, Lock, Menu, Bell } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BUYER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search States inside Header
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerCategory, setHeaderCategory] = useState('');

  const categories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Digital Services' },
    { id: '3', name: 'Apparel' },
    { id: '4', name: 'Home & Kitchen' }
  ];

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
    router.push(`/?${query.toString()}`);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role })
        });
        if (res.success) {
          const loginRes = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          saveToken(loginRes.data.accessToken);
          loadProfile();
          setShowAuthModal(false);
        }
      } else {
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        saveToken(loginRes.data.accessToken);
        loadProfile();
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-200">
      
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  currentUser?.role === 'BUYER' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Buyer
              </button>
              <button
                onClick={() => quickSignIn('SELLER')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  currentUser?.role === 'SELLER' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Seller
              </button>
              <button
                onClick={() => quickSignIn('ADMIN')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  currentUser?.role === 'ADMIN' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
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
              <ConnectButton showBalance={false} />
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
            <ConnectButton showBalance={false} />

            {/* Profile Dropdown or Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    Hello, {currentUser.name.split(' ')[0]}
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

                {/* Direct Dashboard Link icon */}
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-amber-500 transition-colors relative"
                  title="Notifications & Purchases"
                >
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full" />
                </Link>

                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-neutral-900 transition-colors"
                  title="Logout Account"
                >
                  <LogOut className="h-4.5 w-4.5" />
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

            <Link href="/" className={`hover:text-neutral-900 transition-colors ${pathname === '/' ? 'text-amber-600 font-bold' : ''}`}>
              Marketplace
            </Link>
            
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                href={`/?categoryId=${cat.id}`} 
                className={`hover:text-neutral-900 transition-colors ${searchParams.get('categoryId') === cat.id ? 'text-amber-600 font-bold' : ''}`}
              >
                {cat.name}
              </Link>
            ))}

            <Link href="/?search=Special" className="text-rose-600 hover:text-rose-700 transition-colors font-bold">
              Today's Hot Deals
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-neutral-500">
            {currentUser && (
              <>
                <Link href="/dashboard" className={`hover:text-neutral-900 transition ${pathname === '/dashboard' ? 'text-amber-600 font-bold' : ''}`}>
                  Dashboard
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

            <form onSubmit={handleAuth} className="mt-6 space-y-4 text-neutral-805">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Alice Smith"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. buyer@vendly.com"
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Minimum 6 characters"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500" 
                />
              </div>
              
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Default Marketplace Role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="BUYER">Buyer (Purchase items using escrow protection)</option>
                    <option value="SELLER">Seller (Upload products, manage orders & receive payouts)</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors mt-6 cursor-pointer"
              >
                {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-neutral-500 border-t border-neutral-100 pt-4">
              {isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button onClick={() => setIsRegister(false)} className="text-amber-600 font-semibold hover:underline cursor-pointer">Sign In</button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{' '}
                  <button onClick={() => setIsRegister(true)} className="text-amber-600 font-semibold hover:underline cursor-pointer">Create Account</button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
