'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ShoppingBag, LayoutDashboard, Wallet, MoreHorizontal,
  X, ShieldCheck, Store, Shield, Bell, LogOut, UserCircle, ChevronRight
} from 'lucide-react';
import { getUser, removeToken, removeUser } from '../utils/api';

const TABS = [
  { href: '/',            icon: Home,            label: 'Home' },
  { href: '/marketplace', icon: ShoppingBag,      label: 'Shop' },
  { href: '/dashboard',   icon: LayoutDashboard,  label: 'Orders' },
  { href: '/wallet',      icon: Wallet,           label: 'Wallet' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, [moreOpen]);

  const handleLogout = () => {
    removeToken();
    removeUser();
    setCurrentUser(null);
    setMoreOpen(false);
    window.location.href = '/';
  };

  return (
    <>
      {/* More Drawer Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Drawer */}
      <div className={`fixed bottom-20 left-4 right-4 z-50 md:hidden transition-all duration-300 ease-out ${moreOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden">
          {/* User info header */}
          {currentUser ? (
            <div className="px-5 py-4 bg-neutral-950 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                {(currentUser.fullName || currentUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentUser.fullName || currentUser.username}</p>
                <p className="text-[11px] text-neutral-400">{currentUser.email}</p>
              </div>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                {currentUser.role}
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

          {/* Menu items */}
          <div className="py-2">
            {currentUser?.role === 'SELLER' && (
              <MoreMenuItem href="/store" icon={<Store className="h-5 w-5" />} label="Seller Storefront" color="text-amber-600" onPress={() => setMoreOpen(false)} />
            )}
            {currentUser?.role === 'ADMIN' && (
              <MoreMenuItem href="/admin" icon={<Shield className="h-5 w-5" />} label="Admin Operations" color="text-rose-600" onPress={() => setMoreOpen(false)} />
            )}
            <MoreMenuItem href="/dashboard" icon={<Bell className="h-5 w-5" />} label="Notifications" color="text-blue-600" onPress={() => setMoreOpen(false)} />
            <MoreMenuItem href="/" icon={<ShieldCheck className="h-5 w-5" />} label="Escrow Smart Contract" color="text-emerald-600" onPress={() => setMoreOpen(false)} />
            <div className="mx-5 my-1 h-px bg-neutral-100" />
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-rose-50 transition-colors text-rose-600"
              >
                <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            ) : (
              <MoreMenuItem href="/" icon={<UserCircle className="h-5 w-5" />} label="Sign In / Register" color="text-neutral-700" onPress={() => setMoreOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-white/95 backdrop-blur-xl border-t border-neutral-200 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {TABS.map(tab => {
              const isActive = tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center gap-1 h-full px-3 flex-1 relative"
                >
                  {isActive && (
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-8 bg-amber-500 rounded-full" />
                  )}
                  <tab.icon className={`h-5 w-5 transition-all ${isActive ? 'text-amber-500 scale-110' : 'text-neutral-400'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-amber-500' : 'text-neutral-400'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <button
              onClick={() => setMoreOpen(prev => !prev)}
              className="flex flex-col items-center justify-center gap-1 h-full px-3 flex-1 relative cursor-pointer"
            >
              {moreOpen && (
                <span className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-8 bg-amber-500 rounded-full" />
              )}
              {moreOpen
                ? <X className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
                : <MoreHorizontal className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />
              }
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

function MoreMenuItem({ href, icon, label, color, onPress }: {
  href: string; icon: React.ReactNode; label: string; color: string; onPress: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPress}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
    >
      <div className={`h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-bold text-neutral-800 flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-neutral-300" />
    </Link>
  );
}
