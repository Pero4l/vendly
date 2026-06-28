'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import { apiRequest, uploadFile, getProductImage } from '../../utils/api';
import {
  Store, PlusCircle, Package, ShoppingBag, Settings, RefreshCw, Upload,
  Camera, Edit2, Trash2, CheckCircle, AlertTriangle, Truck, XCircle,
  ArrowLeft, Eye, Clock, ShieldCheck, DollarSign
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'products' | 'orders' | 'settings';

const ORDER_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',    icon: <Clock className="h-3 w-3" /> },
  paid:       { label: 'Paid',       color: 'bg-blue-100 text-blue-700 border-blue-200',          icon: <ShieldCheck className="h-3 w-3" /> },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200',    icon: <RefreshCw className="h-3 w-3" /> },
  shipped:    { label: 'Shipped',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Truck className="h-3 w-3" /> },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-200 text-emerald-800 border-emerald-300', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled:  { label: 'Cancelled',  color: 'bg-neutral-100 text-neutral-500 border-neutral-200', icon: <XCircle className="h-3 w-3" /> },
  disputed:   { label: 'Disputed',   color: 'bg-rose-100 text-rose-600 border-rose-200',          icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function StorePage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('products');

  // Store registration
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Product form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pQty, setPQty] = useState('1');
  const [pCatId, setPCatId] = useState('');
  const [pImgFile, setPImgFile] = useState<File | null>(null);
  const [pImgPreview, setPImgPreview] = useState('');
  const [pImgUrl, setPImgUrl] = useState('');
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Store settings edit
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/stores/my-store');
      if (res.success) {
        // Backend returns a fresh token if stored token had wrong role
        if (res.accessToken) {
          localStorage.setItem('vendly_token', res.accessToken);
          const stored = localStorage.getItem('vendly_user');
          if (stored) {
            try { localStorage.setItem('vendly_user', JSON.stringify({ ...JSON.parse(stored), role: 'seller' })); } catch {}
          }
        }
        setStore(res.data);
        setEditName(res.data.name || '');
        setEditDesc(res.data.description || '');
        await Promise.all([loadProducts(res.data.id), loadOrders(), loadCategories()]);
      }
    } catch { setStore(null); }
    finally { setLoading(false); }
  };

  const loadProducts = async (storeId: string) => {
    setProductLoading(true);
    try {
      const res = await apiRequest(`/products?storeId=${storeId}`);
      if (res.success) setProducts(res.data);
    } catch {} finally { setProductLoading(false); }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await apiRequest('/orders');
      if (res.success) setOrders(res.data);
    } catch {} finally { setOrdersLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const res = await apiRequest('/categories');
      if (res.success && res.data.length > 0) {
        setCategories(res.data);
        setPCatId(res.data[0].id);
      }
    } catch {}
  };

  const handleApplyVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true); setApplyError('');
    try {
      let logoUrl = '';
      if (storeLogoFile) logoUrl = await uploadFile(storeLogoFile);
      const res = await apiRequest('/stores', {
        method: 'POST',
        body: JSON.stringify({ name: storeName, description: storeDesc, ...(logoUrl ? { logo: logoUrl } : {}) })
      });
      if (res.success) { await loadAll(); }
    } catch (err: any) { setApplyError(err.message || 'Failed to create store'); }
    finally { setApplyLoading(false); }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setPTitle(''); setPDesc(''); setPPrice(''); setPQty('1'); setPImgFile(null); setPImgPreview(''); setPImgUrl(''); setPError('');
    if (categories.length > 0) setPCatId(categories[0].id);
    setShowAddProduct(true);
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setPTitle(p.title || ''); setPDesc(p.description || ''); setPPrice(String(p.price || '')); setPQty(String(p.quantity || '0'));
    setPCatId(p.categoryId || (categories[0]?.id || ''));
    const existingImg = getProductImage(p.images);
    setPImgPreview(existingImg); setPImgUrl(existingImg); setPImgFile(null); setPError('');
    setShowAddProduct(true);
  };

  const handleProductImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPImgFile(file);
    setPImgPreview(URL.createObjectURL(file));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pPrice) { setPError('Title and price are required'); return; }
    setPSaving(true); setPError('');
    try {
      let imageUrl = pImgUrl;
      if (pImgFile) imageUrl = await uploadFile(pImgFile);

      const body = {
        title: pTitle, description: pDesc, price: pPrice,
        quantity: parseInt(pQty) || 0, categoryId: pCatId,
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {})
      };

      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(body) });
      }
      setShowAddProduct(false);
      if (store) await loadProducts(store.id);
    } catch (err: any) { setPError(err.message || 'Failed to save product'); }
    finally { setPSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await apiRequest(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err: any) { alert(err.message); }
    finally { setUpdatingOrder(null); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true); setSettingsMsg('');
    try {
      await apiRequest('/stores/my-store', { method: 'PUT', body: JSON.stringify({ name: editName, description: editDesc }) });
      setStore((s: any) => ({ ...s, name: editName, description: editDesc }));
      setSettingsMsg('Settings saved!');
      setTimeout(() => setSettingsMsg(''), 3000);
    } catch (err: any) { setSettingsMsg(err.message || 'Failed to save'); }
    finally { setSettingsSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="hidden md:block"><Header /></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  /* ── NO STORE ── Apply form */
  if (!store) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="hidden md:block"><Header /></div>
        <div className="max-w-lg mx-auto px-4 pt-8 pb-32">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="bg-white rounded-2xl border border-neutral-100 p-8">
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Store className="h-7 w-7 text-amber-600" />
              </div>
              <h1 className="text-xl font-black text-neutral-900">Open Your Store</h1>
              <p className="text-sm text-neutral-500 mt-1">Create your vendor storefront and start selling in minutes.</p>
            </div>

            {applyError && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-600">{applyError}</div>}

            <form onSubmit={handleApplyVendor} className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="h-20 w-20 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-colors flex items-center justify-center overflow-hidden bg-neutral-50">
                  {storeLogoPreview
                    ? <img src={storeLogoPreview} alt="logo" className="h-full w-full object-cover" />
                    : <Camera className="h-7 w-7 text-neutral-300" />}
                </button>
                <span className="text-xs text-neutral-400">Store logo (optional)</span>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setStoreLogoFile(f); setStoreLogoPreview(URL.createObjectURL(f)); } }} />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Store Name *</label>
                <input required value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. Tech Bazaar"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={3} placeholder="Tell buyers what you sell..."
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <button type="submit" disabled={applyLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-60">
                {applyLoading
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Creating...</>
                  : <><Store className="h-4 w-4" /> Create My Store</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── PENDING APPROVAL ── */
  if (store && store.status === 'pending') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="hidden md:block"><Header /></div>
        <div className="max-w-lg mx-auto px-4 pt-16 pb-32 text-center">
          <div className="bg-white rounded-2xl border border-amber-200 p-10 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-black text-neutral-900 mb-2">Your Store is Under Review</h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              Thanks for applying! Our team is reviewing your store <span className="font-bold text-neutral-800">"{store.name}"</span>.
              You'll be able to list products as soon as an admin approves your application.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2 mb-6">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">What happens next?</p>
              <p className="text-xs text-amber-800 leading-relaxed">1. An admin reviews your store details</p>
              <p className="text-xs text-amber-800 leading-relaxed">2. You receive a notification once approved</p>
              <p className="text-xs text-amber-800 leading-relaxed">3. Reload this page to start listing products</p>
            </div>
            <button onClick={loadAll} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-6 py-3 text-sm font-bold text-white transition-colors">
              <RefreshCw className="h-4 w-4" /> Check Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── REJECTED ── */
  if (store && store.status === 'rejected') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="hidden md:block"><Header /></div>
        <div className="max-w-lg mx-auto px-4 pt-16 pb-32 text-center">
          <div className="bg-white rounded-2xl border border-rose-200 p-10 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-black text-neutral-900 mb-2">Application Not Approved</h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              Unfortunately, your store <span className="font-bold text-neutral-800">"{store.name}"</span> was not approved.
              Please contact support if you believe this is a mistake.
            </p>
            <Link href="/support" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3 text-sm font-bold text-white transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── HAS STORE ── Seller dashboard */
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid');
  const totalRevenue = orders
    .filter(o => ['delivered', 'completed'].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="hidden md:block"><Header /></div>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        {/* Store header card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
          <div className="flex items-center gap-4">
            {store.logo?.url
              ? <img src={store.logo.url} alt="logo" className="h-14 w-14 rounded-xl object-cover" />
              : <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center"><Store className="h-7 w-7 text-amber-600" /></div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-neutral-900 truncate">{store.name}</h1>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">{store.status}</span>
              </div>
              <p className="text-xs text-neutral-400 truncate">{store.description || 'No description set'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-amber-600">{products.length}</p>
              <p className="text-[10px] text-neutral-500 font-medium">Products</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-blue-600">{pendingOrders.length}</p>
              <p className="text-[10px] text-neutral-500 font-medium">New Orders</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-emerald-600">{totalRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-neutral-500 font-medium">CELO Earned</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-neutral-100 p-1 mb-4">
          {(['products', 'orders', 'settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors ${tab === t ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:text-neutral-800'}`}>
              {t === 'orders' && pendingOrders.length > 0 ? `Orders (${pendingOrders.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS TAB ── */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-neutral-700">{products.length} Products</h2>
              <button onClick={openAddProduct}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors">
                <PlusCircle className="h-3.5 w-3.5" /> Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-white rounded-2xl border border-amber-200 p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-neutral-900">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                  <button onClick={() => setShowAddProduct(false)} className="text-neutral-400 hover:text-neutral-700">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {pError && <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">{pError}</div>}

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Product Image</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => imgInputRef.current?.click()}
                        className="h-20 w-20 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-colors flex items-center justify-center overflow-hidden bg-neutral-50 flex-shrink-0">
                        {pImgPreview
                          ? <img src={pImgPreview} alt="" className="h-full w-full object-cover" />
                          : <Camera className="h-6 w-6 text-neutral-300" />}
                      </button>
                      <div className="flex-1">
                        <button type="button" onClick={() => imgInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline">
                          <Upload className="h-3.5 w-3.5" /> {pImgPreview ? 'Change Image' : 'Upload Image'}
                        </button>
                        <p className="text-[10px] text-neutral-400 mt-1">JPEG, PNG or WebP • Max 5 MB</p>
                        {!pImgFile && (
                          <input value={pImgUrl} onChange={e => { setPImgUrl(e.target.value); setPImgPreview(e.target.value); }}
                            placeholder="Or paste image URL..."
                            className="mt-2 w-full border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                        )}
                      </div>
                      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleProductImgChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Title *</label>
                      <input required value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Product name"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Price (CELO) *</label>
                      <input required type="number" step="0.0001" min="0" value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="0.00"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Quantity</label>
                      <input type="number" min="0" value={pQty} onChange={e => setPQty(e.target.value)} placeholder="10"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    {categories.length > 0 && (
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                        <select value={pCatId} onChange={e => setPCatId(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} rows={3} placeholder="Describe your product..."
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={pSaving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60">
                      {pSaving
                        ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                        : <><CheckCircle className="h-3.5 w-3.5" /> {editingProduct ? 'Update' : 'Publish'}</>}
                    </button>
                    <button type="button" onClick={() => setShowAddProduct(false)}
                      className="px-4 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {productLoading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-amber-500" /></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center space-y-3">
                <ShoppingBag className="h-10 w-10 text-neutral-200 mx-auto" />
                <p className="text-sm font-bold text-neutral-600">No products yet</p>
                <button onClick={openAddProduct} className="text-xs font-bold text-amber-600 hover:underline">+ Add your first product</button>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map(p => {
                  const img = getProductImage(p.images, '');
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-neutral-100 p-4 flex gap-4 items-center">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        {img
                          ? <img src={img} alt="" className="h-full w-full object-cover" />
                          : <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{p.title}</p>
                        <p className="text-xs font-black text-amber-600">{p.price} CELO</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.quantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/products/${p.id}`}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-400">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => openEditProduct(p)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors text-amber-500">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-rose-50 transition-colors text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-neutral-700">{orders.length} Total Orders</h2>
              <button onClick={loadOrders} className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-amber-500" /></div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center space-y-3">
                <Package className="h-10 w-10 text-neutral-200 mx-auto" />
                <p className="text-sm font-bold text-neutral-600">No orders yet</p>
                <p className="text-xs text-neutral-400">Orders will appear here when buyers purchase your products.</p>
              </div>
            ) : (
              orders.map(order => {
                const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META['pending'];
                const firstItem = order.items?.[0];
                const productImg = getProductImage(firstItem?.product?.images, '');
                const buyer = order.buyer;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-neutral-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0">
                        {productImg
                          ? <img src={productImg} alt="" className="h-full w-full object-cover" />
                          : <div className="h-full w-full bg-amber-100" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-neutral-900">#{order.orderNumber || order.id?.slice(0, 12)}</p>
                            {buyer && <p className="text-[11px] text-neutral-400">{buyer.fullName || buyer.username} • {buyer.email}</p>}
                          </div>
                          <span className={`flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>
                        <p className="text-sm font-black text-amber-600 mt-1">{order.totalAmount} CELO</p>
                        {order.items?.length > 0 && (
                          <p className="text-[11px] text-neutral-500 truncate">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.items.map((i: any) => i.product?.title || 'Product').join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {(order.status === 'paid' || order.status === 'processing') && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-50">
                        {order.status === 'paid' && (
                          <button onClick={() => handleOrderStatus(order.id, 'processing')} disabled={updatingOrder === order.id}
                            className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-60">
                            Mark Processing
                          </button>
                        )}
                        <button onClick={() => handleOrderStatus(order.id, 'shipped')} disabled={updatingOrder === order.id}
                          className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
                          <Truck className="h-3 w-3" /> Mark Shipped
                        </button>
                      </div>
                    )}
                    {order.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-neutral-50">
                        <p className="text-[11px] text-neutral-400 text-center">Awaiting buyer payment confirmation</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-500" /> Store Settings
            </h2>
            {settingsMsg && (
              <div className={`mb-4 rounded-lg p-3 text-xs font-medium ${settingsMsg.includes('saved') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
                {settingsMsg}
              </div>
            )}
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Store Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="pt-1 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">Store URL slug: <span className="font-mono font-bold text-neutral-600">{store.slug}</span></p>
              </div>
              <button type="submit" disabled={settingsSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60">
                {settingsSaving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
