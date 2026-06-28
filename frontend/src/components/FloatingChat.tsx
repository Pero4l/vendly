'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

interface Message { id: string; from: 'user' | 'bot'; text: string; time: Date; }

const BOT_RESPONSES: Record<string, string> = {
  default: "Thanks for reaching out! Our support team typically responds within a few hours. Is there anything specific I can help you with?",
  order: "For order issues, please go to Dashboard → your order → tap 'Open Dispute' if needed. Escrow funds remain locked until resolution.",
  payment: "All payments are held in secure escrow. Funds are released in 3 milestones: 30% on order, 20% on shipment, 50% on delivery.",
  track: "To track your order, visit the 'Track Order' page from the More tab. You'll see live escrow milestone progress.",
  wallet: "Go to the Wallet page to view your balance, deposit, or withdraw. Your custodial Celo wallet is created automatically on signup.",
  refund: "Refunds are handled through our dispute system. Open a dispute on your order and our team will review within 48–72 hours.",
  seller: "To become a seller, visit 'Become a Vendor' in the More tab. You can create your store in minutes with zero upfront fees.",
  hi: "Hi there! 👋 I'm the Vendly support assistant. I can help with orders, payments, tracking, wallets, and more. What do you need?",
  hello: "Hello! Welcome to Vendly support. How can I help you today?",
};

function getBotReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/\b(hi|hey|hello|hiya)\b/)) return BOT_RESPONSES.hi;
  if (lower.match(/\border|purchase|buy\b/)) return BOT_RESPONSES.order;
  if (lower.match(/\bpay|payment|escrow|celo\b/)) return BOT_RESPONSES.payment;
  if (lower.match(/\btrack|shipping|ship|deliver/)) return BOT_RESPONSES.track;
  if (lower.match(/\bwallet|balance|deposit|withdraw/)) return BOT_RESPONSES.wallet;
  if (lower.match(/\brefund|cancel|return\b/)) return BOT_RESPONSES.refund;
  if (lower.match(/\bsell|vendor|store|merchant\b/)) return BOT_RESPONSES.seller;
  return BOT_RESPONSES.default;
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', from: 'bot', text: "Hi! 👋 I'm the Vendly support assistant. Ask me anything about orders, payments, or tracking!", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), from: 'bot', text: reply, time: new Date() }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      {/* Chat window */}
      {open && (
        <div className="mb-3 w-80 bg-white rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-neutral-950 px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Vendly Support</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> Online
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-neutral-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${msg.from === 'user' ? 'bg-amber-500 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${msg.from === 'user' ? 'text-amber-200' : 'text-neutral-400'}`}>{fmt(msg.time)}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-100 bg-white flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={sendMessage} disabled={!input.trim()}
              className="h-9 w-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(v => !v)}
        className="h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95">
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
