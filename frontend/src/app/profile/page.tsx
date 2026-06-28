'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { apiRequest, getUser, saveUser, getToken } from '../../utils/api';
import {
  User, ArrowLeft, Save, KeyRound, Camera, CheckCircle, ShieldCheck,
  Eye, EyeOff, Upload, MapPin
} from 'lucide-react';

type Tab = 'profile' | 'security' | 'address';

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<any>(null);

  // Profile tab
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Security tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Address tab
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('');
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState('');
  const [addrSuccess, setAddrSuccess] = useState('');

  const populateAddress = (addr: any) => {
    if (!addr) return;
    setAddrFullName(addr.fullName || addr.name || '');
    setAddrPhone(addr.phone || '');
    setAddrLine1(addr.line1 || '');
    setAddrLine2(addr.line2 || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || '');
    setAddrZip(addr.zip || addr.postalCode || '');
    setAddrCountry(addr.country || '');
  };

  useEffect(() => {
    const local = getUser();
    if (local) {
      setProfile(local);
      setFullName(local.fullName || '');
      setUsername(local.username || '');
      setBio(local.bio || '');
      populateAddress(local.address);
    }
    apiRequest('/auth/profile').then(res => {
      if (res.success) {
        setProfile(res.data);
        setFullName(res.data.fullName || '');
        setUsername(res.data.username || '');
        setBio(res.data.bio || '');
        populateAddress(res.data.address);
        saveUser(res.data);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
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
    setPwLoading(true); setPwError(''); setPwSuccess('');
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine1 || !addrCity || !addrCountry) {
      setAddrError('Street address, city, and country are required');
      return;
    }
    setAddrSaving(true); setAddrError(''); setAddrSuccess('');
    try {
      const address = {
        fullName: addrFullName,
        phone: addrPhone,
        line1: addrLine1,
        line2: addrLine2,
        city: addrCity,
        state: addrState,
        zip: addrZip,
        country: addrCountry
      };
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ address })
      });
      if (res.success) {
        // Merge address into stored user
        const updated = { ...getUser(), address };
        saveUser(updated);
        setProfile((p: any) => ({ ...p, address }));
        setAddrSuccess('Delivery address saved!');
        setTimeout(() => setAddrSuccess(''), 3000);
      }
    } catch (err: any) {
      setAddrError(err.message || 'Failed to save address');
    } finally {
      setAddrSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true); setError('');
    try {
      const token = getToken();
      const form = new FormData();
      form.append('image', avatarFile);
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      const updateRes = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, username, bio, avatar: data.url })
      });
      if (updateRes.success) {
        saveUser(updateRes.data);
        setProfile(updateRes.data);
        setAvatarFile(null);
        setSuccess('Profile picture updated!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = profile
    ? (profile.fullName || profile.username || '?').slice(0, 2).toUpperCase()
    : '?';
  const avatarSrc = avatarPreview || profile?.avatar;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User className="h-3.5 w-3.5" /> },
    { key: 'address', label: 'Address', icon: <MapPin className="h-3.5 w-3.5" /> },
    { key: 'security', label: 'Security', icon: <KeyRound className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Avatar & name header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-4 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-xl">
                {initials}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border-2 border-white shadow flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <Camera className="h-3.5 w-3.5 text-neutral-600" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="flex-1 min-w-0">
            {avatarFile ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-neutral-700">New photo selected</p>
                <div className="flex gap-2">
                  <button onClick={handleAvatarUpload} disabled={avatarUploading}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
                    <Upload className="h-3 w-3" /> {avatarUploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                  <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    className="text-xs font-bold text-neutral-400 hover:text-neutral-700 px-2 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-neutral-100 p-1 mb-4 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
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
                {[1, 2, 3].map(n => <div key={n} className="h-10 bg-neutral-100 rounded-xl" />)}
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

        {/* ── ADDRESS TAB ── */}
        {tab === 'address' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" /> Delivery Address
            </h2>
            <p className="text-xs text-neutral-400 mb-5">This address is used at checkout for all your orders.</p>

            {addrError && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-200">{addrError}</div>}
            {addrSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5" /> {addrSuccess}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Full Name (for delivery)
                  </label>
                  <input
                    type="text" value={addrFullName} onChange={e => setAddrFullName(e.target.value)}
                    placeholder="Name on the package"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel" value={addrPhone} onChange={e => setAddrPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Street Address *
                  </label>
                  <input
                    required type="text" value={addrLine1} onChange={e => setAddrLine1(e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Apartment, Suite, etc.
                  </label>
                  <input
                    type="text" value={addrLine2} onChange={e => setAddrLine2(e.target.value)}
                    placeholder="Apt 4B (optional)"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    required type="text" value={addrCity} onChange={e => setAddrCity(e.target.value)}
                    placeholder="New York"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text" value={addrState} onChange={e => setAddrState(e.target.value)}
                    placeholder="New York"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text" value={addrZip} onChange={e => setAddrZip(e.target.value)}
                    placeholder="10001"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Country *
                  </label>
                  <input
                    required type="text" value={addrCountry} onChange={e => setAddrCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button type="submit" disabled={addrSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <MapPin className="h-4 w-4" />
                {addrSaving ? 'Saving...' : 'Save Delivery Address'}
              </button>
            </form>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
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
              {[
                { label: 'Current Password', val: currentPassword, set: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
                { label: 'New Password', val: newPassword, set: setNewPassword, show: showNew, setShow: setShowNew },
                { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
              ].map(({ label, val, set, show, setShow }) => (
                <div key={label}>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} required
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShow((v: boolean) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
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
