'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. Redirecting to login...');
        setTimeout(() => router.push('/dashboard'), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 max-w-md w-full p-10 text-center">
        <div className="mb-6 flex justify-center">
          {status === 'loading' && <Loader2 className="w-14 h-14 text-amber-500 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-14 h-14 text-green-500" />}
          {status === 'error' && <XCircle className="w-14 h-14 text-red-500" />}
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-3">
          {status === 'loading' && 'Verifying your email…'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-8">{message}</p>

        {status !== 'loading' && (
          <a
            href="/dashboard"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {status === 'success' ? 'Go to Dashboard' : 'Back to Home'}
          </a>
        )}
      </div>
    </div>
  );
}
