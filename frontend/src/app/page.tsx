'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import {
  ShieldCheck,
  ArrowRight,
  Wallet,
  Sparkles,
  Star,
  Package,
  Truck,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Layers,
  Database,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '../utils/api';

const CAT_IMAGES: Record<string, string> = {
  'Electronics':         'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600',
  'Digital Services':   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
  'Apparel & Fashion':  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=600',
  'Home & Kitchen':     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=600',
  'Health & Beauty':    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600',
  'Sports & Outdoors':  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=600',
  'Books & Media':      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600',
  'Art & Collectibles': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600',
};
const getCatImage = (name: string) =>
  CAT_IMAGES[name] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=600';

const CAT_DESC: Record<string, string> = {
  'Electronics':         'Hardware wallets, secure devices, Celo-compatible electronics.',
  'Digital Services':   'Domain names, SaaS tokens, subscriptions, and certificates.',
  'Apparel & Fashion':  'Exclusive drops, streetwear, and merchandise with NFC tags.',
  'Home & Kitchen':     'Furniture, appliances, and kitchen items with delivery guarantees.',
  'Health & Beauty':    'Wellness products, cosmetics, and supplements — verified sellers.',
  'Sports & Outdoors':  'Equipment, activewear, and outdoor gear from trusted merchants.',
  'Books & Media':      'Physical books, media, educational resources, and collectibles.',
  'Art & Collectibles': 'NFT-backed physical art, limited editions, and collectibles.',
};

// Interactive Escrow Simulator Stages data
const SIMULATOR_STAGES = [
  {
    stage: 1,
    title: "Stage 1: Deposit & Initial Lock",
    payout: "30% Released | 70% Escrowed",
    actor: "Buyer Action Required",
    desc: "The buyer submits the order and locks 100% of the purchase funds into the Celo smart contract. 30% of the funds are immediately released to the seller to cover packaging, handling, and initial postage costs, eliminating merchant cashflow bottlenecks."
  },
  {
    stage: 2,
    title: "Stage 2: Courier Dispatch & Transit",
    payout: "50% Cumulative | 50% Escrowed",
    actor: "Carrier Verification Required",
    desc: "The seller packages the item, dispatches it via an integrated carrier (e.g. DHL, FedEx), and uploads the tracking number. Once the carrier's API scans and registers the package in transit, the smart contract automatically unlocks another 20% of the funds."
  },
  {
    stage: 3,
    title: "Stage 3: Final Delivery & Settlement",
    payout: "100% Fully Settled | 0% Escrowed",
    actor: "Buyer or Courier Confirmation",
    desc: "The item arrives at the buyer's destination. Upon the buyer clicking 'Confirm Delivery' (or automatically after 72 hours of courier-verified delivery), the smart contract releases the final 50% of the funds to the merchant, completing the secure cycle."
  }
];

export default function Home() {
  const [activeStage, setActiveStage] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleNextStage = () => {
    if (activeStage < 3) {
      setIsSimulating(true);
      setTimeout(() => {
        setActiveStage(prev => prev + 1);
        setIsSimulating(false);
      }, 1000);
    } else {
      setIsSimulating(true);
      setTimeout(() => {
        setActiveStage(1);
        setIsSimulating(false);
      }, 800);
    }
  };

  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    apiRequest('/categories').then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length) {
        setCategories(res.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 selection:bg-amber-100 selection:text-amber-900">
      <Header />

      {/* 1. HERO SECTION: High-contrast, premium, dark-gradient styling */}
      <section className="relative bg-neutral-950 text-white py-24 px-6 sm:px-12 lg:px-24 overflow-hidden border-b border-neutral-850">

        {/* Organic colored background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">

          {/* Left Column: Title & Main Value Prop */}
          <div className="lg:col-span-7 space-y-8">

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400 tracking-wide">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              Next-Gen Commerce Secured by Celo Blockchain
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
              Zero-Trust <br />
              <span className="bg-orange-400 bg-clip-text text-transparent">
                Escrow Commerce
              </span>
            </h1>

            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Vendly eliminates commerce fraud. By locking purchase payments in decentralized, audited smart contracts, we disburse funds incrementally to merchants based on real-world shipment and delivery tracking milestones.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/marketplace"
                className="group rounded-xl bg-amber-500 hover:bg-amber-600 px-7 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                Enter Marketplace
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-xl border border-neutral-700 hover:border-neutral-500 bg-neutral-900/50 hover:bg-neutral-900 px-7 py-4 text-sm font-bold text-neutral-300 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4 text-amber-400" />
                View Dashboard
              </Link>
            </div>

            {/* Trusted indicators */}
            <div className="pt-6 border-t border-neutral-900 flex flex-wrap gap-x-10 gap-y-4 text-xs text-neutral-550 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> 100% Funds Audited</span>
              <span className="flex items-center gap-1.5"><ArrowRightLeft className="h-4 w-4 text-amber-400" /> Incremental Milestones</span>
              <span className="flex items-center gap-1.5"><Database className="h-4 w-4 text-blue-400" /> Verified Carrier APIs</span>
            </div>
          </div>

          {/* Right Column: Premium Marketing 3D Illustration */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/20 shadow-2xl glow-glow max-w-md w-full aspect-square">
              <img
                src="/hero_secure_escrow.png"
                alt="Secure Escrow Protection"
                className="w-full h-full object-cover rounded-3xl"
              />

              {/* Glassmorphic overlay badge */}
              <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 bg-neutral-950/85 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                    <ShieldCheck className="h-5.5 w-5.5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight">Escrow Active</h4>
                    <p className="text-[10px] text-neutral-450 mt-0.5 font-medium">Secured on Celo Smart Contract</p>
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Audited
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE INTERACTIVE ESCROW FLOW SIMULATOR */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-neutral-50 border-b border-neutral-200">
        <div className="mx-auto max-w-5xl space-y-12">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-neutral-950 tracking-tight">
              The 3-Stage Escrow Architecture
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Click through the stages below to simulate how the Vendly smart contract coordinates payments automatically based on logistics.
            </p>
          </div>

          {/* Timeline Node Selector */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto px-6">
            {/* Background progress bar line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-200 -z-0 rounded" />

            {/* Active progress bar highlight */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 -z-0 transition-all duration-500 rounded"
              style={{ width: `${((activeStage - 1) / 2) * 100}%` }}
            />

            {/* Stages circles */}
            {SIMULATOR_STAGES.map(s => {
              const isActive = activeStage === s.stage;
              const isPassed = activeStage > s.stage;

              return (
                <button
                  key={s.stage}
                  onClick={() => setActiveStage(s.stage)}
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 font-bold text-sm cursor-pointer ${isActive ? 'bg-amber-500 border-amber-600 text-white scale-110 shadow-lg shadow-amber-500/20' :
                    isPassed ? 'bg-amber-100 border-amber-500 text-amber-800' :
                      'bg-white border-neutral-300 text-neutral-400 hover:border-neutral-450 hover:text-neutral-750'
                    }`}
                >
                  {isPassed ? '✓' : s.stage}

                  {/* Floating label */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 whitespace-nowrap hidden sm:inline">
                    Stage {s.stage}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Card Presentation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6">

            {/* Left Box: Explanation and data */}
            <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="bg-amber-100 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-amber-800">
                    {SIMULATOR_STAGES[activeStage - 1].actor}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wide ${activeStage === 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {SIMULATOR_STAGES[activeStage - 1].payout}
                  </span>
                </div>

                <h3 className="text-xl font-black text-neutral-900">
                  {SIMULATOR_STAGES[activeStage - 1].title}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-555 leading-relaxed">
                  {SIMULATOR_STAGES[activeStage - 1].desc}
                </p>
              </div>

              {/* Action Simulation Trigger */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="text-[11px] text-neutral-400 font-medium">
                  {activeStage === 3 ? "All stages completed! Reset simulator." : `Proceed to Stage ${activeStage + 1} simulation.`}
                </div>
                <button
                  onClick={handleNextStage}
                  disabled={isSimulating}
                  className="rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 px-4 py-2.5 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Securing...
                    </>
                  ) : activeStage === 3 ? (
                    <>
                      Reset Simulation
                      <RefreshCw className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Trigger Next Stage
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Box: Interactive Visual Transaction Hub */}
            <div className="lg:col-span-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-md flex flex-col justify-between relative overflow-hidden min-h-[340px]">

              {/* Colored abstract background glows */}
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {activeStage === 1 && (
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Smart Escrow Initialized
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">Step 1 of 3</span>
                  </div>

                  {/* Vault Graphic representation */}
                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-xl animate-pulse" />
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
                        <Lock className="h-8 w-8" />
                      </div>
                    </div>
                  </div>

                  {/* Receipt breakdown */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-neutral-800">
                      <span>Total Deposit:</span>
                      <span className="text-neutral-900">1.50 CELO ($1.05)</span>
                    </div>
                    <div className="h-px bg-neutral-205 my-1.5" />
                    <div className="flex justify-between text-neutral-600">
                      <span>30% Initial Release:</span>
                      <span className="text-emerald-600 font-bold">+0.45 CELO</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>70% Securely Escrowed:</span>
                      <span className="text-amber-600 font-bold">1.05 CELO</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStage === 2 && (
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      Logistics Verification
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">Step 2 of 3</span>
                  </div>

                  {/* Route progress */}
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-bold">
                      <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5 text-neutral-400" /> Dispatched</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">In Transit</span>
                      <span className="flex items-center gap-1 font-medium text-neutral-300">Arrival</span>
                    </div>

                    {/* Visual Timeline Bar */}
                    <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Transit Information */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Carrier Partner:</span>
                      <span className="font-bold text-neutral-850">DHL Express</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tracking Code:</span>
                      <span className="font-mono font-bold text-neutral-850 text-[11px]">VN-982-CELO-77</span>
                    </div>
                    <div className="h-px bg-neutral-205 my-1.5" />
                    <div className="flex justify-between text-neutral-600">
                      <span>Cumulative Released:</span>
                      <span className="text-emerald-600 font-bold">0.75 CELO (50%)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStage === 3 && (
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Escrow Fully Settled
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">Step 3 of 3</span>
                  </div>

                  {/* Certified Checkmark Seal */}
                  <div className="flex items-center justify-center py-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                    </div>
                  </div>

                  {/* Settlement Certificate breakdown */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-neutral-800">
                      <span>Escrow Release:</span>
                      <span className="text-emerald-600 font-bold">100% Disbursed</span>
                    </div>
                    <div className="h-px bg-neutral-205 my-1.5" />
                    <div className="flex justify-between text-neutral-600">
                      <span>Disbursed to Merchant:</span>
                      <span className="text-neutral-800 font-medium">1.50 CELO</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Smart Contract Status:</span>
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Settled & Closed</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 text-[10px] text-neutral-450 leading-tight flex items-center justify-between z-10 relative">
                <span>Verified by Celo Blockchain Explorer</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION: Why Choose Vendly */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-white">
        <div className="mx-auto max-w-7xl space-y-16">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-55 border border-emerald-200 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Risk Free Commerce
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight leading-none">
              Engineered to Eliminate Buying & Selling Friction
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              We leverage smart contracts to secure your hard-earned funds, eliminating fraud, courier spoofing, and merchant default risks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1 */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-base">Incremental Payouts</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                By dividing payments into 30%, 20%, and 50% releases, we fund the merchant's logistics overhead while keeping the bulk of buyer assets protected.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-base">Decentralized Disputes</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                If an order goes awry, either party can initiate a dispute. Smart contracts freeze funds, allowing audited platform moderators to resolve claims fairly.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-base">Automated Carrier Sync</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We integrate directly with courier APIs. The smart contract automatically scans logistics status logs to trigger intermediate milestone releases.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-base">Celo Blockchain Security</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                No centralized bank holds your money. Funds are locked in transparent, audited smart contracts, accessible only via on-chain signatures.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. DEPARTMENT PREVIEW CARDS */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-neutral-50 border-t border-b border-neutral-200">
        <div className="mx-auto max-w-7xl space-y-16">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-neutral-950 tracking-tight leading-none">
                Explore Verified Store Departments
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-lg">
                Browse listings uploaded by registered merchants, fully covered by Vendly escrow smart contracts.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline shrink-0 cursor-pointer"
            >
              Browse All Listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-72 bg-neutral-100 rounded-2xl animate-pulse" />
                ))
              : categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="h-44 overflow-hidden relative bg-neutral-100">
                      <img
                        src={getCatImage(cat.name)}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-extrabold text-neutral-900 text-base group-hover:text-amber-500 transition-colors">{cat.name}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{CAT_DESC[cat.name] || cat.description || 'Browse verified products in this category.'}</p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <Link
                      href={`/marketplace?categoryId=${cat.id}`}
                      className="w-full rounded-lg bg-neutral-900 hover:bg-amber-500 hover:text-white py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      Browse Department
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            }
          </div>

        </div>
      </section>

      {/* 5. PLATFORM STATISTICS / TRUST */}
      <section className="py-20 px-6 sm:px-12 lg:px-24 bg-neutral-950 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-750 to-transparent" />

        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">$4.2M+</h3>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Escrow Volume Secured</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">24 Hours</h3>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Average Settlement Time</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">100%</h3>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Dispute Resolution Rate</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">1,850+</h3>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Registered Merchants</p>
          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION & TESTIMONIALS */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-white">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Column: Testimonials */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              What Traders Say About Vendly
            </h2>

            <div className="space-y-6">
              {/* Review 1 */}
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                      JS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Jared Smith</h4>
                      <p className="text-[9px] text-neutral-500 font-medium">Electronics Merchant</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "As a seller, securing upfront liquidity is critical. Vendly's 30% instant release covers my logistics packaging costs, while the buyer feels secure knowing the rest of the funds are locked in Celo until delivery confirmation. It's a win-win."
                </p>
              </div>

              {/* Review 2 */}
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      KM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Karen Miller</h4>
                      <p className="text-[9px] text-neutral-500 font-medium">Digital Collector</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "I was always nervous buying domain names and digital assets from unknown sellers. With Vendly, my funds are held securely in escrow on-chain. Knowing I can open a dispute if the seller defaults gives me total peace of mind."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-contrast call to action card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-neutral-950 text-white p-8 md:p-10 border border-neutral-850 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                  Ready to Trade Securely?
                </h3>
                <p className="text-xs text-neutral-450 leading-relaxed">
                  Join thousands of buyers and sellers trading physical products and digital services on Celo with complete protection.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Link
                  href="/marketplace"
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-3.5 text-xs font-bold text-white text-center transition-colors block cursor-pointer"
                >
                  Explore Active Listings
                </Link>

                <div className="flex justify-between items-center text-[10px] text-neutral-550 uppercase font-bold tracking-wider pt-2 border-t border-neutral-850">
                  <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-500" /> SECURE SMART CONTRACTS</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-amber-400" /> ZERO DEPOSIT FEES</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12 px-6 text-center text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-left">
            <p className="font-extrabold text-neutral-900 tracking-tighter text-sm">VENDLY ESCROW</p>
            <p className="text-[11px] text-neutral-500">Decentralized, incremental-release escrow commerce on Celo.</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <Link href="/marketplace" className="hover:text-neutral-900 transition-colors">Marketplace</Link>
            <Link href="/buyer-protection" className="hover:text-neutral-900 transition-colors">Buyer Protection</Link>
            <Link href="/store" className="hover:text-neutral-900 transition-colors">Sell on Vendly</Link>
            <Link href="/support" className="hover:text-neutral-900 transition-colors">Support</Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl pt-8 mt-8 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-neutral-450">
          <p>© 2026 Vendly Protocol. All rights reserved.</p>
          <p>Built with passion for the Celo Ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}
