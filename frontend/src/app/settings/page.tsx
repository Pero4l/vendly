'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest, getUser, removeToken, removeUser } from '../../utils/api';
import { Settings, ArrowLeft, Bell, ShieldCheck, LogOut, Trash2, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch {}
    removeToken();
    removeUser();
    router.push('/');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className={`transition-colors ${value ? 'text-amber-500' : 'text-neutral-300'}`}>
      {value ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-500" />
          </Link>
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            Settings
          </h1>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-neutral-100 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-50">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account</h2>
          </div>
          <Link href="/profile" className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black">
              {user ? (user.fullName || user.username || '?').slice(0, 2).toUpperCase() : '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900">{user?.fullName || user?.username || 'Your Account'}</p>
              <p className="text-xs text-neutral-400">{user?.email}</p>
            </div>
            <User className="h-4 w-4 text-neutral-400" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-neutral-100 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-50">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">Email Notifications</p>
                <p className="text-xs text-neutral-400">Receive email alerts for account activity</p>
              </div>
              <Toggle value={emailNotifs} onChange={setEmailNotifs} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">Order Updates</p>
                <p className="text-xs text-neutral-400">Get notified on order and escrow changes</p>
              </div>
              <Toggle value={orderUpdates} onChange={setOrderUpdates} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">Marketing Emails</p>
                <p className="text-xs text-neutral-400">Promotions and product announcements</p>
              </div>
              <Toggle value={marketingEmails} onChange={setMarketingEmails} />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-2xl border border-neutral-100 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-50">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Privacy & Security
            </h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <Link href="/profile#security" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
              <span className="text-sm font-medium text-neutral-800">Change Password</span>
              <ArrowLeft className="h-4 w-4 text-neutral-400 rotate-180" />
            </Link>
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-neutral-800">Two-Factor Authentication</p>
              <p className="text-xs text-neutral-400 mt-0.5">Coming soon — adds extra login security</p>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-50">
            <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors text-left">
              <LogOut className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-800">Sign Out</span>
            </button>
            <button
              onClick={() => window.confirm('Delete your account? This cannot be undone. You will be redirected to support.') && router.push('/support')}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-50 transition-colors text-left">
              <Trash2 className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-600">Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
