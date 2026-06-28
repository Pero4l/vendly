'use client';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import FloatingChat from './FloatingChat';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <FloatingChat />
      </CartProvider>
    </AuthProvider>
  );
}
