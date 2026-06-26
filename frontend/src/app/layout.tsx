import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Web3Provider } from "../components/Web3Provider";
import '@rainbow-me/rainbowkit/styles.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vendly | Escrow-Based Marketplace on Celo",
  description: "Trade physical and digital products securely with decentralized escrow payments, automated milestones, and transparent reputation tracking on the Celo blockchain.",
  keywords: ["Celo", "Web3 Marketplace", "Escrow Contract", "USDT", "USDC", "cUSD", "Buyer Protection"],
  authors: [{ name: "Vendly Team" }],
  openGraph: {
    title: "Vendly | Escrow-Based Marketplace on Celo",
    description: "Decentralized trade protection using advanced smart contract escrows.",
    type: "website"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-white text-neutral-900">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full bg-white text-neutral-900 font-sans selection:bg-yellow-200`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
