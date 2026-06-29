'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ShoppingBag, LayoutDashboard, Wallet, MoreHorizontal,
  X, ShieldCheck, Store, Shield, Bell, LogOut, UserCircle, ChevronRight,
  Package, AlertTriangle, Heart, MessageSquare, Settings, User, ShoppingCart
} from 'lucide-react';
import { getUser, removeToken, removeUser, apiRequest } from '../utils/api';
import { useCart } from '../context/CartContext';

const TABS = [
  { href: '/dashboard',            icon: Home,            label: 'Home' },
  { href: '/marketplace', icon: ShoppingBag,      label: 'Shop' },
  { href: '/orders',      icon: Package,          label: 'Orders' },
  { href: '/wallet',      icon: Wallet,           label: 'Wallet' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { totalItems } = useCart();

  // Re-read user on every navigation (layout stays mounted in App Router)
  useEffect(() => {
    setCurrentUser(getUser());
  }, [pathname]);

  const handleLogout = async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch {}
    removeToken();
    removeUser();
    setCurrentUser(null);
    setMoreOpen(false);
    window.location.href = '/';
  };

  const close = () => setMoreOpen(false);

  // Hide the entire bottom nav when not logged in
  if (!currentUser) return null;

  return (
    <>
      {/* Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-sm md:hidden" onClick={close} />
      )}

      {/* More Drawer */}
      <div className={`fixed bottom-20 left-3 right-3 z-50 md:hidden transition-all duration-300 ease-out ${moreOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">

          {/* User info header */}
          {currentUser ? (
            <div className="px-5 py-4 bg-neutral-950 flex items-center gap-3 sticky top-0">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                {(currentUser.fullName || currentUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentUser.fullName || currentUser.username}</p>
                <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
              </div>
              <span className="ml-auto shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                {currentUser.role || 'USER'}
              </span>
            </div>
          ) : (
            <div className="px-5 py-4 bg-neutral-950 flex items-center gap-3">
              <UserCircle className="h-10 w-10 text-neutral-600" />
              <div>
                <p className="text-sm font-bold text-white">Not signed in</p>
                <p className="text-[11px] text-neutral-400">Sign in to access all features</p>
              </div>
            </div>
          )}

          {/* Menu sections */}
          <div className="py-2">
            {/* Account */}
            {currentUser && (
              <>
                <SectionLabel label="Account" />
                <MoreMenuItem href="/profile" icon={<User className="h-5 w-5" />} label="My Profile" color="text-amber-600" onPress={close} />
                <MoreMenuItem href="/notifications" icon={<Bell className="h-5 w-5" />} label="Notifications" color="text-blue-600" badge onPress={close} />
              </>
            )}

            {/* Orders & Disputes */}
            <SectionLabel label="Orders" />
            <MoreMenuItem href="/track-order" icon={<Package className="h-5 w-5" />} label="Track Order" color="text-emerald-600" onPress={close} />
            <MoreMenuItem href="/orders" icon={<AlertTriangle className="h-5 w-5" />} label="Disputes" color="text-rose-500" onPress={close} />
            <MoreMenuItem href="/cart" icon={<ShoppingCart className="h-5 w-5" />} label="My Cart" color="text-amber-600" badge={totalItems > 0} badgeCount={totalItems} onPress={close} />

            {/* Discover */}
            <SectionLabel label="Discover" />
            <MoreMenuItem href="/favorites" icon={<Heart className="h-5 w-5" />} label="Favorites" color="text-rose-500" onPress={close} />
            <MoreMenuItem href="/marketplace" icon={<ShoppingBag className="h-5 w-5" />} label="Marketplace" color="text-neutral-700" onPress={close} />

            {/* Seller / Admin */}
                    {currentUser?.role === 'seller' && (
              <>
                <SectionLabel label="Seller" />
                <MoreMenuItem href="/store" icon={<Store className="h-5 w-5" />} label="Seller Storefront" color="text-amber-600" onPress={close} />
              </>
            )}
            {currentUser?.role === 'admin' && (
              <>
                <SectionLabel label="Admin" />
                <MoreMenuItem href="/admin" icon={<Shield className="h-5 w-5" />} label="Admin Operations" color="text-rose-600" onPress={close} />
              </>
            )}

            {/* Grow — only for buyers/guests */}
            {(!currentUser?.role || currentUser.role === 'buyer') && (
              <>
                <SectionLabel label="Grow" />
                <MoreMenuItem href="/store" icon={<Store className="h-5 w-5" />} label="Become a Vendor" color="text-amber-600" onPress={close} />
              </>
            )}

            {/* Help */}
            <SectionLabel label="Help & Settings" />
            <MoreMenuItem href="/support" icon={<MessageSquare className="h-5 w-5" />} label="Message Support" color="text-indigo-600" onPress={close} />
            <MoreMenuItem href="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" color="text-neutral-600" onPress={close} />

            <div className="mx-5 my-1 h-px bg-neutral-100" />

            {/* Auth */}
            {currentUser ? (
              <button onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-rose-50 transition-colors text-rose-600">
                <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            ) : (
              <>
                <MoreMenuItem href="/login" icon={<UserCircle className="h-5 w-5" />} label="Sign In" color="text-amber-600" onPress={close} />
                <MoreMenuItem href="/login" icon={<User className="h-5 w-5" />} label="Create Account" color="text-neutral-700" onPress={close} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-white/95 backdrop-blur-xl border-t border-neutral-200 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {TABS.map(tab => {
              const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
              const isCart = tab.href === '/cart';
              return (
                <Link key={tab.href} href={tab.href}
                  className="flex flex-col items-center justify-center gap-1 h-full px-3 flex-1 relative">
                  {isActive && <span className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-8 bg-amber-500 rounded-full" />}
                  <div className="relative">
                    <tab.icon className={`h-5 w-5 transition-all ${isActive ? 'text-amber-500 scale-110' : 'text-neutral-400'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isCart && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-amber-500' : 'text-neutral-400'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <button onClick={() => setMoreOpen(prev => !prev)}
              className="flex flex-col items-center justify-center gap-1 h-full px-3 flex-1 relative cursor-pointer">
              {moreOpen && <span className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-8 bg-amber-500 rounded-full" />}
              {moreOpen
                ? <X className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
                : <MoreHorizontal className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />}
              <span className={`text-[10px] font-bold tracking-wide ${moreOpen ? 'text-amber-500' : 'text-neutral-400'}`}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-5 pt-3 pb-1">
      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function MoreMenuItem({ href, icon, label, color, badge, badgeCount, onPress }: {
  href: string; icon: React.ReactNode; label: string; color: string;
  badge?: boolean; badgeCount?: number; onPress: () => void;
}) {
  return (
    <Link href={href} onClick={onPress}
      className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors">
      <div className={`h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center relative ${color}`}>
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
            {badgeCount && badgeCount > 0 ? (badgeCount > 9 ? '9+' : badgeCount) : ''}
          </span>
        )}
      </div>
      <span className="text-sm font-bold text-neutral-800 flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-neutral-300" />
    </Link>
  );
}
