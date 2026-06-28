'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import { MessageSquare, ArrowLeft, Send, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = [
  { q: 'How does the escrow system work?', a: 'When you place an order, your payment is held securely in our escrow system. Funds are released to the seller in three milestones: 30% on order lock, 20% on shipment, and 50% after you confirm delivery.' },
  { q: 'What happens if I have a dispute?', a: 'Go to Dashboard → your order → "Open Dispute". Our team reviews evidence from both parties and resolves within 48–72 hours. Funds remain locked in escrow until resolution.' },
  { q: 'How do I track my order?', a: 'Open your Dashboard and tap the order to see its real-time escrow milestone status. Sellers are required to update shipment details within 24 hours.' },
  { q: 'How do I fund my wallet?', a: 'Go to Wallet → Deposit. You can fund your custodial Celo wallet using any supported exchange or wallet that supports CELO transfers.' },
  { q: 'How long does delivery take?', a: 'Delivery time is set by the seller. Physical items typically take 3–14 days. Digital services are usually delivered within 24 hours of order placement.' },
];

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({ email, subject, message })
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-500" />
          </Link>
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            Message Support
          </h1>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4 space-y-1">
          <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-3">Common Questions</h2>
          {FAQ.map((item, i) => (
            <div key={i} className="border border-neutral-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors">
                <span className="text-sm font-medium text-neutral-800">{item.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 text-neutral-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-xs text-neutral-500 leading-relaxed border-t border-neutral-100">{item.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4">Send a Message</h2>
          <p className="text-xs text-neutral-400 mb-5">Our support team responds within 24 hours on business days.</p>

          {success ? (
            <div className="text-center py-10 space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-black text-neutral-900">Message sent!</h3>
              <p className="text-sm text-neutral-400">We'll get back to you at <strong>{email}</strong> within 24 hours.</p>
              <button onClick={() => { setSuccess(false); setSubject(''); setMessage(''); setEmail(''); }}
                className="text-sm font-bold text-amber-600 underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Your Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
                  <option value="">Select a topic...</option>
                  <option>Order Issue</option>
                  <option>Dispute Resolution</option>
                  <option>Payment / Wallet</option>
                  <option>Account Access</option>
                  <option>Seller Support</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Message</label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />
              </div>
              {error && (
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              )}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
