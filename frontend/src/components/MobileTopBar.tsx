'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, UserCircle } from 'lucide-react';
import { getUser } from '../utils/api';

export default function MobileTopBar() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-neutral-100">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-neutral-900">VENDLY</span>
          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
            Escrow
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <Bell className="h-5 w-5 text-neutral-600" />
            {currentUser && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full" />
            )}
          </Link>

          {currentUser ? (
            <Link href="/wallet" className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm">
              {(currentUser.fullName || currentUser.username || 'U').charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors">
              <UserCircle className="h-6 w-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
