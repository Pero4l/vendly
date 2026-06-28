'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, UserCircle, ShoppingCart } from 'lucide-react';
import { getUser } from '../utils/api';
import { useCart } from '../context/CartContext';

export default function MobileTopBar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { totalItems } = useCart();

  useEffect(() => {
    setCurrentUser(getUser());
  }, [pathname]);

  // Fetch unread notification count when user is logged in
  useEffect(() => {
    if (!getUser()) return;
    import('../utils/api').then(({ apiRequest }) => {
      apiRequest('/notifications').then(res => {
        if (res.success && Array.isArray(res.data)) {
          setUnreadCount(res.data.filter((n: any) => !n.isRead && !n.read).length);
        }
      }).catch(() => {});
    });
  }, [pathname]);

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-neutral-100">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-neutral-900">VENDLY</span>
          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
            Escrow
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {currentUser ? (
            <>
              {/* Cart — only when logged in */}
              <Link href="/cart" className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors">
                <ShoppingCart className="h-5 w-5 text-neutral-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Notifications — only when logged in */}
              <Link href="/notifications" className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors">
                <Bell className="h-5 w-5 text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full" />
                )}
              </Link>

              {/* User avatar */}
              <Link href="/profile" className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm ml-0.5">
                {(currentUser.fullName || currentUser.username || 'U').charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            /* Not logged in — only show Sign In button */
            <Link href="/login"
              className="flex items-center gap-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
