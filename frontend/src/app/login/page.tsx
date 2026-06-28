'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, saveToken, saveUser } from '../../utils/api';
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ fullName, username, email, password })
        });
        if (res.success) setRegisterSuccess(true);
      } else {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password })
        });
        saveToken(res.data.accessToken);
        if (res.data.user) saveUser(res.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (registerSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 max-w-md w-full p-10 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">Check your inbox!</h2>
          <p className="text-sm text-neutral-500">We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
          <button onClick={() => { setIsRegister(false); setRegisterSuccess(false); }}
            className="text-sm font-bold text-amber-600 underline">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Back nav */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 max-w-md w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-black tracking-tighter text-neutral-900">VENDLY</Link>
            <p className="text-xs text-neutral-400 mt-1">
              {isRegister ? 'Create your escrow marketplace account' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-600 border border-rose-200 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" required placeholder="e.g. Alice Smith" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input type="text" required placeholder="4–15 chars, lowercase" value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <p className="text-xs text-neutral-500 mt-3 text-center leading-relaxed">
                By creating an account you agree to our{' '}
                <Link href="/terms" className="font-bold text-amber-600 hover:underline">Terms & Conditions</Link>{' '}
                and{' '}
                <Link href="/terms#9" className="font-bold text-amber-600 hover:underline">Privacy Policy</Link>.
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-bold text-white transition-colors mt-3 disabled:opacity-60 flex items-center justify-center gap-2">
              <KeyRound className="h-4 w-4" />
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500 border-t border-neutral-100 pt-5">
            {isRegister ? (
              <span>Already have an account?{' '}
                <button onClick={() => { setIsRegister(false); setError(''); }} className="font-bold text-amber-600 hover:underline">Sign In</button>
              </span>
            ) : (
              <span>Don't have an account?{' '}
                <button onClick={() => { setIsRegister(true); setError(''); }} className="font-bold text-amber-600 hover:underline">Create Account</button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
