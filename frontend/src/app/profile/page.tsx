'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest, getUser, saveUser } from '../../utils/api';
import { User, ArrowLeft, Save, KeyRound, Camera, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const local = getUser();
    if (local) {
      setProfile(local);
      setFullName(local.fullName || '');
      setUsername(local.username || '');
      setBio(local.bio || '');
    }
    apiRequest('/auth/profile').then(res => {
      if (res.success) {
        setProfile(res.data);
        setFullName(res.data.fullName || '');
        setUsername(res.data.username || '');
        setBio(res.data.bio || '');
        saveUser(res.data);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, username, bio })
      });
      if (res.success) {
        saveUser(res.data);
        setProfile(res.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setPwSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const initials = profile
    ? (profile.fullName || profile.username || '?').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Avatar & name header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-4 flex items-center gap-5">
          <div className="relative">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-xl">
                {initials}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-neutral-900">{profile?.fullName || profile?.username || 'Your Profile'}</h1>
            <p className="text-sm text-neutral-400">@{profile?.username}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">
                {profile?.emailVerified ? 'Email Verified' : 'Email not verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-neutral-100 p-1 mb-4">
          <button onClick={() => setTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${tab === 'profile' ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>
            Profile Details
          </button>
          <button onClick={() => setTab('security')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${tab === 'security' ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>
            Security
          </button>
        </div>

        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-amber-500" /> Edit Profile
            </h2>

            {error && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-200">{error}</div>}
            {success && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5" /> {success}
              </div>
            )}

            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(n => <div key={n} className="h-10 bg-neutral-100 rounded-xl" />)}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" value={profile?.email || ''} disabled
                    className="w-full rounded-xl border border-neutral-100 px-4 py-3 text-sm bg-neutral-50 text-neutral-400 cursor-not-allowed" />
                  <p className="text-[10px] text-neutral-400 mt-1">Email cannot be changed for security reasons.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell buyers a bit about yourself..."
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'security' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-5 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" /> Change Password
            </h2>

            {pwError && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-200">{pwError}</div>}
            {pwSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5" /> {pwSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={pwLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <KeyRound className="h-4 w-4" />
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
