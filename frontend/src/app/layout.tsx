/**
 * layout.tsx — Root Application Layout
 * ─────────────────────────────────────────────────────────────────
 * Wraps every page in:
 *  1. Web3Provider   — RainbowKit + Wagmi wallet context
 *  2. MobileTopBar   — sticky top bar shown only on mobile
 *  3. BottomNav      — fixed bottom tab bar shown only on mobile
 *
 * The desktop Header component is rendered inside each page individually
 * (using `hidden md:block` on mobile) so that page-specific header
 * state (search, active user) can be managed per-page.
 *
 * Safe-area bottom padding (`pb-20`) is handled globally via the
 * `.app-shell` class in globals.css so developers don't need to
 * remember to add it to every new page.
 * ─────────────────────────────────────────────────────────────────
 */
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Web3Provider } from '../components/Web3Provider';
import MobileTopBar from '../components/MobileTopBar';
import BottomNav from '../components/BottomNav';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

/* ── Fonts ─────────────────────────────────────────────────────── */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/* ── SEO Metadata ──────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Vendly | Escrow-Based Marketplace on Celo',
  description:
    'Trade physical and digital products securely with decentralized escrow payments, automated milestones, and transparent reputation tracking on the Celo blockchain.',
  keywords: ['Celo', 'Web3 Marketplace', 'Escrow Contract', 'USDT', 'USDC', 'cUSD', 'Buyer Protection'],
  authors: [{ name: 'Vendly Team' }],
  openGraph: {
    title: 'Vendly | Escrow-Based Marketplace on Celo',
    description: 'Decentralized trade protection using advanced smart contract escrows.',
    type: 'website',
  },
};

/* ── Root Layout ───────────────────────────────────────────────── */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased bg-white text-neutral-900">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full bg-white text-neutral-900 font-sans selection:bg-yellow-200`}>
        <Web3Provider>
          {/*
           * MobileTopBar — sticky top bar, only visible on mobile (md:hidden inside component).
           * Renders above the page content.
           */}
          <MobileTopBar />

          {/*
           * app-shell — wraps all page content with bottom padding (pb-20)
           * on mobile so content never hides behind the BottomNav.
           * On desktop (md+) the padding is removed.
           */}
          <div className="app-shell">
            {children}
          </div>

          {/*
           * BottomNav — fixed bottom tab bar, only visible on mobile (md:hidden inside component).
           * Tabs: Home · Shop · Orders · Wallet · More
           */}
          <BottomNav />
        </Web3Provider>
      </body>
    </html>
  );
}
