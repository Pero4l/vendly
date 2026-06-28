'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck, Lock, Truck, RefreshCw, AlertTriangle,
  CheckCircle, Clock, HeartHandshake, BadgeCheck, Coins, MessageSquare
} from 'lucide-react';

const LAST_UPDATED = 'June 28, 2026';

interface CardProps { icon: React.ReactNode; title: string; children: React.ReactNode; accent?: string; }
function Card({ icon, title, children, accent = 'bg-amber-50 border-amber-200' }: CardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${accent}`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-sm font-black text-neutral-900">{title}</h3>
      </div>
      <div className="text-sm text-neutral-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

interface FaqProps { q: string; a: string; }
function Faq({ q, a }: FaqProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors">
        <span className="text-sm font-bold text-neutral-900 pr-4">{q}</span>
        <span className={`text-neutral-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function BuyerProtectionPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 px-4 py-3.5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex-1 text-center">
          <span className="text-sm font-black text-neutral-900">Buyer Protection Policy</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 pb-28">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500 mb-5">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-neutral-900 mb-2">Vendly Buyer Protection</h1>
          <p className="text-sm text-neutral-400">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-neutral-600 mt-3 max-w-xl mx-auto leading-relaxed">
            Every purchase on Vendly is protected by our 3-stage escrow system. Your money never goes directly to a seller — it stays locked until <strong>you</strong> confirm everything is right.
          </p>
        </div>

        {/* Trust badge strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: <Lock className="h-5 w-5 text-emerald-600" />, label: 'Escrow Protected' },
            { icon: <Coins className="h-5 w-5 text-amber-600" />, label: 'CELO Secured' },
            { icon: <RefreshCw className="h-5 w-5 text-blue-600" />, label: 'Full Refunds' },
            { icon: <HeartHandshake className="h-5 w-5 text-rose-500" />, label: '24/7 Support' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white border border-neutral-100 rounded-xl py-4 px-3 text-center">
              {icon}
              <span className="text-xs font-bold text-neutral-700">{label}</span>
            </div>
          ))}
        </div>

        {/* How escrow works */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-neutral-900 mb-4">How Your Money Is Protected</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-amber-200 hidden sm:block" />
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  pct: '30%',
                  title: 'Order Placed — Payment Locked',
                  desc: 'Your full payment is locked in Vendly escrow the moment you place your order. The seller receives 30% to begin processing. You can dispute at any time before delivery.',
                  icon: <Lock className="h-4 w-4 text-amber-600" />,
                },
                {
                  step: '2',
                  pct: '20%',
                  title: 'Item Shipped — Partial Release',
                  desc: 'Once the seller provides confirmed shipping proof, a further 20% is released. Tracking information is recorded on-chain so it cannot be faked.',
                  icon: <Truck className="h-4 w-4 text-blue-600" />,
                },
                {
                  step: '3',
                  pct: '50%',
                  title: 'You Confirm Delivery — Final Release',
                  desc: 'Only after YOU confirm the item arrived and matches the listing does the final 50% reach the seller. If something is wrong, open a dispute first.',
                  icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
                },
              ].map(({ step, pct, title, desc, icon }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm z-10">
                    {step}
                  </div>
                  <div className="flex-1 bg-white border border-neutral-100 rounded-xl p-4 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-neutral-900">{title}</p>
                      <span className="text-xs font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pct} Released</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Protection cards */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-neutral-900 mb-4">What You Are Protected Against</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />} title="Item Not Received" accent="bg-emerald-50 border-emerald-200">
              <p>If your item never arrives and tracking confirms non-delivery, you receive a <strong>full refund</strong> of the remaining escrow balance. No questions asked.</p>
            </Card>
            <Card icon={<AlertTriangle className="h-5 w-5 text-rose-500" />} title="Item Not As Described" accent="bg-rose-50 border-rose-200">
              <p>Received something that doesn't match the listing — wrong product, colour, size, or condition? Open a dispute and Vendly will mediate for a full or partial refund.</p>
            </Card>
            <Card icon={<Lock className="h-5 w-5 text-blue-600" />} title="Counterfeit or Fake Items" accent="bg-blue-50 border-blue-200">
              <p>Selling counterfeit goods is a permanent ban offence. If you receive a fake, you get a full refund and the seller account is suspended pending investigation.</p>
            </Card>
            <Card icon={<RefreshCw className="h-5 w-5 text-amber-600" />} title="Seller Cancels After Payment" accent="bg-amber-50 border-amber-200">
              <p>If a seller cancels an order after payment is locked, the full escrow amount is immediately returned to you — no deductions, no delays.</p>
            </Card>
            <Card icon={<Clock className="h-5 w-5 text-indigo-600" />} title="Significantly Delayed Delivery" accent="bg-indigo-50 border-indigo-200">
              <p>If your order is not shipped within the seller's stated timeline (or 14 days by default), you may cancel for a full refund of the unspent escrow balance.</p>
            </Card>
            <Card icon={<MessageSquare className="h-5 w-5 text-neutral-600" />} title="Unresponsive Seller" accent="bg-neutral-50 border-neutral-200">
              <p>If a seller stops responding after your order, Vendly support steps in. Funds remain locked until the matter is resolved in your favour or by mediation.</p>
            </Card>
          </div>
        </section>

        {/* How to open a dispute */}
        <section className="mb-10 bg-white border border-neutral-100 rounded-2xl p-6">
          <h2 className="text-lg font-black text-neutral-900 mb-1 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> How to Open a Dispute
          </h2>
          <p className="text-sm text-neutral-500 mb-5">You have <strong>7 days</strong> from the delivery date to raise a dispute.</p>
          <ol className="space-y-4">
            {[
              { n: '1', t: 'Go to My Orders', d: 'Open the Orders page from your dashboard or bottom navigation.' },
              { n: '2', t: 'Find the order', d: 'Locate the order you want to dispute and tap "Track Order".' },
              { n: '3', t: 'Tap "Open Dispute"', d: 'Select a reason (not received, not as described, damaged, etc.) and provide photos or evidence.' },
              { n: '4', t: 'Vendly Reviews', d: 'Our team reviews the evidence within 48 hours and may contact both parties for further information.' },
              { n: '5', t: 'Resolution', d: 'A full, partial, or no refund is issued based on the evidence. Escrow funds are released accordingly.' },
            ].map(({ n, t, d }) => (
              <li key={n} className="flex gap-4 items-start">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">{n}</span>
                <div>
                  <p className="text-sm font-bold text-neutral-900">{t}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Refund timelines */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-neutral-900 mb-4">Refund Timelines</h2>
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            <div className="divide-y divide-neutral-50">
              {[
                { scenario: 'Seller cancels before shipment', timeline: 'Immediate', color: 'text-emerald-600' },
                { scenario: 'Item not received (confirmed)', timeline: '24–48 hours', color: 'text-emerald-600' },
                { scenario: 'Dispute resolved in buyer\'s favour', timeline: '48–72 hours', color: 'text-blue-600' },
                { scenario: 'Dispute requiring mediation', timeline: '3–7 business days', color: 'text-amber-600' },
                { scenario: 'Chargeback / fraud investigation', timeline: 'Up to 14 business days', color: 'text-neutral-500' },
              ].map(({ scenario, timeline, color }) => (
                <div key={scenario} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-neutral-700">{scenario}</p>
                  <span className={`text-xs font-black ${color} flex-shrink-0 ml-4`}>{timeline}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2 px-1">All refunds are issued in CELO at the exchange rate at the time of original payment.</p>
        </section>

        {/* What is NOT covered */}
        <section className="mb-10 bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <h2 className="text-sm font-black text-rose-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> What Is NOT Covered
          </h2>
          <ul className="space-y-2 text-sm text-rose-700">
            {[
              'Transactions completed outside the Vendly platform (off-platform deals).',
              'Buyer\'s remorse — changing your mind after the item matches the listing.',
              'Disputes raised more than 7 days after confirmed delivery.',
              'Damage caused by the buyer after receipt.',
              'Items prohibited under our Terms & Conditions.',
              'Claims where the buyer provided an incorrect shipping address.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full bg-rose-200 flex items-center justify-center text-rose-600 font-black text-[10px]">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-neutral-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            <Faq
              q="Can the seller access my payment before I confirm delivery?"
              a="No. The full payment sits in escrow from the moment you check out. Sellers only receive milestone releases (30% on order, 20% on shipment) — the final 50% is released only after you confirm the item arrived and is correct."
            />
            <Faq
              q="What happens if I forget to confirm delivery?"
              a="If you do not confirm delivery or raise a dispute within 14 days of the confirmed shipping date, the escrow is automatically released to the seller. Make sure to check your orders and confirm promptly — or raise a dispute if something is wrong."
            />
            <Faq
              q="How do I prove an item is not as described?"
              a="Photos and videos are the strongest evidence. In your dispute, attach clear images of what you received alongside screenshots of the original listing. Vendly's team reviews all submitted evidence."
            />
            <Faq
              q="What currency are refunds issued in?"
              a="All refunds are issued in CELO, the same currency used for the original transaction. Vendly does not guarantee any specific fiat value, as cryptocurrency prices can fluctuate."
            />
            <Faq
              q="Can I trust sellers on Vendly?"
              a="All sellers are verified and reviewed. Seller ratings, review counts, and dispute history are publicly visible on each store page. We recommend checking a seller's reputation before purchasing high-value items."
            />
            <Faq
              q="How do I contact Vendly support about my dispute?"
              a="Open the Support page from the More menu (mobile) or message us at support@vendly.com. Our team responds within 24 hours on business days."
            />
          </div>
        </section>

        {/* CTA */}
        <div className="bg-neutral-900 rounded-2xl p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white mb-2">Shop With Confidence</h2>
          <p className="text-sm text-neutral-400 mb-5">Every Vendly purchase is protected by our escrow guarantee. If anything goes wrong, we've got your back.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
              Browse Marketplace
            </Link>
            <Link href="/support"
              className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
              <MessageSquare className="h-4 w-4" /> Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
