'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../utils/api';
import { KeyRound, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password })
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Reset failed. The link may have expired — please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-black text-neutral-900">Password updated!</h2>
        <p className="text-sm text-neutral-500">Your password has been reset. Redirecting you to sign in...</p>
        <Link href="/login" className="inline-block text-sm font-bold text-amber-600 underline">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-black tracking-tighter text-neutral-900">VENDLY</Link>
        <p className="text-xs text-neutral-400 mt-1">Set a new password for your account</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3.5 flex items-start gap-2 border border-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        </div>
      )}

      {!token ? (
        <div className="text-center">
          <Link href="/login" className="text-sm font-bold text-amber-600 underline">Request a new reset link</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Repeat your new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
            <KeyRound className="h-4 w-4" />
            {loading ? 'Updating...' : 'Reset Password'}
          </button>

          <p className="text-center text-sm text-neutral-500 pt-2">
            <Link href="/login" className="font-bold text-amber-600 hover:underline">Back to Sign In</Link>
          </p>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 max-w-md w-full p-8">
        <Suspense fallback={<p className="text-center text-sm text-neutral-400">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
