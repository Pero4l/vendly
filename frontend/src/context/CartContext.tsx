'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
  storeId: string;
  storeName: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// Each user gets their own cart key so switching accounts doesn't bleed carts
function cartKey(): string {
  try {
    const u = JSON.parse(localStorage.getItem('vendly_user') || '{}');
    return `vendly_cart_${u.id || 'guest'}`;
  } catch {
    return 'vendly_cart_guest';
  }
}

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try { localStorage.setItem(cartKey(), JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
    // Re-load the correct user's cart whenever login / logout happens
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vendly_user') setItems(readCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      const next = existing
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
      writeCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => { const next = prev.filter(i => i.id !== id); writeCart(next); return next; });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setItems(prev => { const next = prev.map(i => i.id === id ? { ...i, quantity: qty } : i); writeCart(next); return next; });
  }, [removeItem]);

  const clearCart = useCallback(() => persist([]), [persist]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
