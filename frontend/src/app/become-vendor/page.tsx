'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { Store, ArrowLeft, ShieldCheck, Wallet, Star, ArrowRight, CheckCircle, Package, BarChart3 } from 'lucide-react';

const BENEFITS = [
  { icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, title: 'Zero-Risk Selling', desc: 'Escrow guarantees you get paid for every completed order — no chargebacks, no fraud.' },
  { icon: <Wallet className="h-5 w-5 text-amber-600" />, title: 'Instant Milestone Payouts', desc: 'Receive 30% on order lock, 20% on shipment, 50% on delivery. No 30-day waits.' },
  { icon: <Star className="h-5 w-5 text-blue-600" />, title: 'Build Reputation', desc: 'Earn verified reviews and seller ratings that grow your credibility on the platform.' },
  { icon: <Package className="h-5 w-5 text-indigo-600" />, title: 'Sell Anything', desc: 'Physical goods, digital products, services — list in any category with no restrictions.' },
  { icon: <BarChart3 className="h-5 w-5 text-rose-500" />, title: 'Seller Dashboard', desc: 'Manage inventory, track earnings, handle orders, and view analytics all in one place.' },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up or log in. Verify your email to activate your account.' },
  { n: '02', title: 'Open your store', desc: 'Give your store a name, description, and brand it with a logo.' },
  { n: '03', title: 'List your products', desc: 'Add product photos, descriptions, prices, and stock quantities.' },
  { n: '04', title: 'Start earning', desc: 'Receive orders, ship items, and collect milestone payouts automatically.' },
];

export default function BecomeVendorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:block"><Header /></div>

      {/* Hero */}
      <div className="bg-neutral-950 text-white px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 text-xs font-bold text-amber-400">
            <Store className="h-3.5 w-3.5" /> Vendly Seller Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">
            Become a <span className="text-amber-400">Vendly Vendor</span><br />
            Start Selling in Minutes
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
            Open your escrow-protected storefront on Celo. Zero upfront fees, instant payouts, and built-in buyer trust — everything you need to grow a real business online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/store" className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              <Store className="h-4 w-4" /> Open Your Store <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Browse as Buyer
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-32">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-8 mb-12">
          {[['$0', 'Setup fee'], ['3', 'Milestone payouts'], ['48h', 'To first sale']].map(([val, label]) => (
            <div key={label} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-black text-amber-500">{val}</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-neutral-900 mb-5">Why sell on Vendly?</h2>
          <div className="space-y-3">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4 bg-neutral-50 rounded-2xl border border-neutral-100 p-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">{b.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-neutral-900 mb-5">How it works</h2>
          <div className="relative border-l-2 border-amber-300 ml-4 pl-6 space-y-6">
            {STEPS.map(s => (
              <div key={s.n} className="relative">
                <span className="absolute -left-9 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">{s.n}</span>
                <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-neutral-950 rounded-2xl p-6 text-center space-y-4">
          <h3 className="text-lg font-black text-white">Ready to start selling?</h3>
          <p className="text-sm text-neutral-400">Your store can be live within the next 5 minutes.</p>
          <Link href="/store" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            <Store className="h-4 w-4" /> Create My Store Now
          </Link>
        </div>
      </div>
    </div>
  );
}
