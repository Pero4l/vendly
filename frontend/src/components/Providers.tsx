'use client';
import { CartProvider } from '../context/CartContext';
import FloatingChat from './FloatingChat';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <FloatingChat />
    </CartProvider>
  );
}
