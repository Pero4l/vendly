'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { apiRequest } from '../../utils/api';
import Link from 'next/link';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
  Copy, CheckCircle, RefreshCw, Clock, AlertCircle,
  ShieldCheck, TrendingUp, Package, ExternalLink, X, ChevronDown
} from 'lucide-react';

const TOKENS = ['CELO', 'cUSD', 'USDT', 'USDC'] as const;
type Token = typeof TOKENS[number];

const TOKEN_META: Record<Token, { color: string; bg: string; border: string; icon: string }> = {
  CELO: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '🌿' },
  cUSD: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '💵' },
  USDT: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', icon: '₮' },
  USDC: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵' },
};

const TX_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DEPOSIT: { label: 'Deposit', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <ArrowDownLeft className="h-4 w-4" /> },
  WITHDRAWAL: { label: 'Withdrawal', color: 'text-rose-700', bg: 'bg-rose-50', icon: <ArrowUpRight className="h-4 w-4" /> },
  TRANSFER: { label: 'Transfer', color: 'text-blue-700', bg: 'bg-blue-50', icon: <ArrowRightLeft className="h-4 w-4" /> },
  ESCROW: { label: 'Escrow', color: 'text-amber-700', bg: 'bg-amber-50', icon: <ShieldCheck className="h-4 w-4" /> },
};

type ModalType = 'send' | 'withdraw' | 'deposit' | null;

export default function WalletPage() {
  const [profile, setProfile] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedToken, setSelectedToken] = useState<Token>('CELO');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [profRes, balRes, histRes] = await Promise.all([
        apiRequest('/auth/profile'),
        apiRequest('/wallets/balance'),
        apiRequest('/wallets/history'),
      ]);
      if (profRes.success) setProfile(profRes.data);
      if (balRes.success) setWalletData(balRes.data);
      if (histRes.success) setTransactions(histRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  const copyAddress = () => {
    if (walletData?.address) {
      navigator.clipboard.writeText(walletData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setModal(null);
    setAmount('');
    setRecipientAddress('');
    setWithdrawAddress('');
  };

  const handleSend = async () => {
    if (!recipientAddress || !amount) return showToast('Fill in all fields', false);
    setSubmitting(true);
    try {
      const res = await apiRequest('/wallets/transfer', {
        method: 'POST',
        body: JSON.stringify({ receiverAddress: recipientAddress, token: selectedToken, amount: parseFloat(amount) }),
      });
      if (res.success) {
        showToast(`Sent ${amount} ${selectedToken} successfully!`);
        closeModal();
        fetchAll();
      } else {
        showToast(res.message || 'Transfer failed', false);
      }
    } catch (e: any) {
      showToast(e.message || 'Transfer failed', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !amount) return showToast('Fill in all fields', false);
    setSubmitting(true);
    try {
      const res = await apiRequest('/wallets/withdraw', {
        method: 'POST',
        body: JSON.stringify({ destinationAddress: withdrawAddress, token: selectedToken, amount: parseFloat(amount) }),
      });
      if (res.success) {
        showToast(`Withdrawal of ${amount} ${selectedToken} submitted!`);
        closeModal();
        fetchAll();
      } else {
        showToast(res.message || 'Withdrawal failed', false);
      }
    } catch (e: any) {
      showToast(e.message || 'Withdrawal failed', false);
    } finally {
      setSubmitting(false);
    }
  };

  const totalUSD = walletData?.balances
    ? (walletData.balances.CELO * 0.70) + walletData.balances.cUSD + walletData.balances.USDT + walletData.balances.USDC
    : 0;

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <Wallet className="h-12 w-12 text-neutral-300" />
        <h2 className="text-lg font-bold text-neutral-700">Sign in to access your wallet</h2>
        <p className="text-sm text-neutral-500">Every Vendly account gets a custodial Celo wallet automatically.</p>
        <Link href="/" className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-6 py-3 transition-colors">
          Go to Homepage
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-xl border transition-all ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Modal overlay */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-neutral-900">
                {modal === 'send' ? 'Send Funds' : modal === 'withdraw' ? 'Withdraw Funds' : 'Deposit Funds'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal === 'deposit' ? (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Send any supported asset to your Vendly wallet address below. Deposits are confirmed after 1 block on Celo Alfajores.
                </p>
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Your Vendly Wallet Address</p>
                  <p className="font-mono text-xs text-neutral-800 break-all">{walletData?.address}</p>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700 font-medium">
                  ⚠️ Only send CELO, cUSD, USDT, or USDC to this address on the Celo network.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Token selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Asset</label>
                  <div className="relative">
                    <select
                      value={selectedToken}
                      onChange={e => setSelectedToken(e.target.value as Token)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
                    >
                      {TOKENS.map(t => (
                        <option key={t} value={t}>{TOKEN_META[t].icon} {t} — Balance: {walletData?.balances?.[t]?.toFixed(4) ?? '0.0000'}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                {/* Recipient / Destination */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                    {modal === 'send' ? 'Recipient Wallet Address' : 'Destination External Address'}
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={modal === 'send' ? recipientAddress : withdrawAddress}
                    onChange={e => modal === 'send' ? setRecipientAddress(e.target.value) : setWithdrawAddress(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-mono text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-16"
                    />
                    <span className="absolute right-4 top-2.5 text-xs font-bold text-neutral-400">{selectedToken}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Available: <span className="font-bold text-neutral-600">{walletData?.balances?.[selectedToken]?.toFixed(4) ?? '0.0000'} {selectedToken}</span>
                  </p>
                </div>

                <button
                  onClick={modal === 'send' ? handleSend : handleWithdraw}
                  disabled={submitting}
                  className="w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 disabled:opacity-60 text-white text-sm font-bold py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</> : modal === 'send' ? 'Confirm Send' : 'Submit Withdrawal'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-neutral-950">My Vendly Wallet</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Custodial Celo wallet · auto-created for {profile?.fullName || profile?.username || 'your account'}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-600 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Balances
          </button>
        </div>

        {/* Portfolio Summary Hero Card */}
        <div className="relative rounded-3xl bg-neutral-950 text-white overflow-hidden shadow-xl">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

          <div className="relative z-10 p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">Total Portfolio Value (Est.)</p>
                <p className="text-4xl font-black tracking-tight">${totalUSD.toFixed(2)} <span className="text-base text-neutral-500 font-semibold">USD</span></p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Celo Alfajores Testnet</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[11px] text-neutral-300">
                      {walletData?.address
                        ? `${walletData.address.substring(0, 14)}...${walletData.address.slice(-8)}`
                        : 'Loading...'}
                    </p>
                    <button onClick={copyAddress} className="text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer">
                      {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-900">
              <button
                onClick={() => setModal('deposit')}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="h-4 w-4" /> Deposit
              </button>
              <button
                onClick={() => setModal('send')}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" /> Send / Transfer
              </button>
              <button
                onClick={() => setModal('withdraw')}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-5 py-2.5 text-xs font-bold text-neutral-300 transition-colors"
              >
                <Package className="h-4 w-4" /> Escrow Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Asset Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TOKENS.map(token => {
            const meta = TOKEN_META[token];
            const balance = walletData?.balances?.[token] ?? 0;
            return (
              <div key={token} className={`rounded-2xl border ${meta.border} ${meta.bg} p-5 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{meta.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color} bg-white/60 px-2 py-0.5 rounded-full border ${meta.border}`}>
                    {token}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-black text-neutral-900">{balance.toFixed(4)}</p>
                  <p className={`text-[11px] font-bold ${meta.color}`}>{token}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedToken(token); setModal('send'); }}
                    className="flex-1 rounded-lg bg-white/80 hover:bg-white border border-neutral-200 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors cursor-pointer"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => { setSelectedToken(token); setModal('withdraw'); }}
                    className="flex-1 rounded-lg bg-white/80 hover:bg-white border border-neutral-200 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors cursor-pointer"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Transaction History
            </h2>
            <span className="text-[11px] text-neutral-400 font-semibold">{transactions.length} transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Clock className="mx-auto h-10 w-10 text-neutral-200" />
              <p className="text-sm font-bold text-neutral-500">No transactions yet</p>
              <p className="text-xs text-neutral-400">Deposit funds to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {transactions.map((tx: any) => {
                const meta = TX_TYPE_META[tx.type] || TX_TYPE_META.TRANSFER;
                const isOut = tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' || tx.type === 'ESCROW';
                return (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800">{meta.label}</p>
                        <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[180px]">
                          {isOut ? `→ ${tx.receiverAddress}` : `← ${tx.senderAddress}`}
                        </p>
                        <p className="text-[10px] text-neutral-400">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className={`text-sm font-black ${isOut ? 'text-neutral-800' : 'text-emerald-600'}`}>
                        {isOut ? '-' : '+'}{tx.amount} {tx.token}
                      </p>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                        {tx.status === 'COMPLETED' ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {tx.status}
                      </div>
                      {tx.txHash && (
                        <a
                          href={`https://alfajores.celoscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-700 font-bold"
                        >
                          View on Explorer <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Notice */}
        {/* <div className="rounded-2xl bg-neutral-950 text-white p-6 flex items-start gap-4 border border-neutral-900">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black">Custodial Wallet Security</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your Vendly wallet private key is AES-256 encrypted and stored in our secure database — never exposed in transit. For non-custodial control, use the RainbowKit wallet in the header to connect your own hardware wallet.
            </p>
          </div>
        </div> */}

      </main>
    </div>
  );
}
