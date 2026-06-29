'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '../../../components/Header';
import { apiRequest, getUser } from '../../../utils/api';
import {
  ShoppingCart, ShieldCheck, RefreshCw, ArrowLeft, Truck, Package,
  Award, ChevronRight, Heart, Store, Star, MessageSquare, CheckCircle,
  Lock, AlertCircle, BadgeCheck, Headphones
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct]               = useState<any>(null);
  const [reviews, setReviews]               = useState<any[]>([]);
  const [quantity, setQuantity]             = useState(1);
  const [loading, setLoading]               = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [statusMessage, setStatusMessage]   = useState('');
  const [errorMsg, setErrorMsg]             = useState('');
  const [isFavorite, setIsFavorite]         = useState(false);
  const [cartAdded, setCartAdded]           = useState(false);
  const [isOwnProduct, setIsOwnProduct]     = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [reviewRating, setReviewRating]     = useState(0);
  const [reviewHover, setReviewHover]       = useState(0);
  const [reviewComment, setReviewComment]   = useState('');
  const [reviewOrderId, setReviewOrderId]   = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess]   = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // All fetches in parallel
      const [productRes, reviewsRes] = await Promise.all([
        apiRequest(`/products/${id}`),
        apiRequest(`/products/${id}/reviews`).catch(() => ({ success: false, data: [] })),
      ]);

      if (productRes.success) {
        setProduct(productRes.data);
        const user = getUser();

        // Parallel secondary fetches (non-blocking)
        const secondaryFetches: Promise<any>[] = [];
        if (user?.role === 'seller') secondaryFetches.push(apiRequest('/stores/my-store').catch(() => null));
        if (user?.role === 'buyer')  secondaryFetches.push(apiRequest('/orders').catch(() => null));

        if (secondaryFetches.length > 0) {
          const results = await Promise.all(secondaryFetches);
          if (user?.role === 'seller' && results[0]?.success) {
            setIsOwnProduct(results[0].data?.id === productRes.data?.storeId);
          }
          if (user?.role === 'buyer' && results[0]?.success) {
            const eligible = (results[0].data || []).filter((o: any) =>
              ['delivered', 'completed'].includes(o.status) &&
              o.items?.some((item: any) => item.productId === productRes.data.id)
            );
            setEligibleOrders(eligible);
            if (eligible.length > 0) setReviewOrderId(eligible[0].id);
          }
        }
      }
      if (reviewsRes.success) setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    try {
      const favs = JSON.parse(localStorage.getItem('vendly_favorites') || '[]');
      setIsFavorite(favs.includes(String(id)));
    } catch {}
  }, [load, id]);

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('vendly_favorites') || '[]');
      const next = isFavorite ? favs.filter(f => f !== String(id)) : [...favs, String(id)];
      localStorage.setItem('vendly_favorites', JSON.stringify(next));
      setIsFavorite(!isFavorite);
    } catch {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      title: product.title,
      price: String(product.price),
      image: product.images?.[0]?.url || product.images?.[0]?.imageUrl || '',
      storeId: product.storeId || '',
      storeName: product.store?.name || 'Vendly Store',
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handlePurchase = async () => {
    const user = getUser();
    if (!user) { router.push('/'); return; }
    setPurchaseLoading(true);
    setStatusMessage('Placing order...');
    setErrorMsg('');
    try {
      const orderRes = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          shippingAddress: { line1: 'To be confirmed', city: 'N/A', country: 'N/A' },
        }),
      });
      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to create order');
      setStatusMessage('Locking funds in escrow...');
      await apiRequest('/orders/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ orderId: orderRes.data.id, txHash: null }),
      });
      setStatusMessage('Order placed! Redirecting...');
      setTimeout(() => router.push('/orders'), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Purchase failed');
      setPurchaseLoading(false);
      setStatusMessage('');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewOrderId) return;
    setReviewSubmitting(true);
    try {
      const res = await apiRequest('/products/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: id, orderId: reviewOrderId, rating: reviewRating, comment: reviewComment }),
      });
      if (res.success) {
        setReviewSuccess(true);
        setReviewRating(0);
        setReviewComment('');
        const [reviewsRes, pRes] = await Promise.all([
          apiRequest(`/products/${id}/reviews`).catch(() => null),
          apiRequest(`/products/${id}`).catch(() => null),
        ]);
        if (reviewsRes?.success) setReviews(reviewsRes.data || []);
        if (pRes?.success) setProduct(pRes.data);
      }
    } catch {} finally { setReviewSubmitting(false); }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
        <p className="text-xs text-neutral-400 font-semibold">Loading product...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-neutral-300" />
        <p className="text-sm font-bold text-neutral-500">Product not found.</p>
        <Link href="/marketplace" className="text-amber-600 hover:underline text-xs font-bold">Back to Marketplace</Link>
      </div>
    </div>
  );

  const mainImg = product.images?.[0]?.url || product.images?.[0]?.imageUrl || '';
  const totalCost = (parseFloat(product.price) * quantity).toFixed(4);
  const usdPrice  = (parseFloat(product.price) * 0.70).toFixed(2);
  const totalUsd  = (parseFloat(totalCost) * 0.70).toFixed(2);
  const avgRating = parseFloat(product.averageRating) || 0;
  const totalReviews = product.totalReviews || reviews.length;

  const BuyBox = () => (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-5">
      {/* Price */}
      <div>
        <p className="text-xs text-neutral-400 font-semibold mb-1">Price</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-900">{product.price} CELO</span>
          <span className="text-xs text-neutral-400">≈ ${usdPrice}</span>
        </div>
        <span className="inline-block mt-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          ✓ Escrow protected
        </span>
      </div>

      <hr className="border-neutral-100" />

      {/* Stock + shipping */}
      <div className="space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span>Ships within <b>24–48 hours</b></span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          {product.quantity > 0
            ? <span><b className="text-emerald-600">{product.quantity}</b> in stock</span>
            : <span className="text-rose-600 font-bold">Out of stock</span>
          }
        </div>
      </div>

      {/* Quantity */}
      {product.quantity > 0 && (
        <div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Quantity</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer">−</button>
            <span className="text-sm font-bold text-neutral-900 w-4 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))} disabled={quantity >= product.quantity}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer">+</button>
            <span className="text-xs text-neutral-400 ml-1">= <b className="text-neutral-700">{totalCost} CELO</b> (≈ ${totalUsd})</span>
          </div>
        </div>
      )}

      {/* Status messages */}
      {statusMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />{statusMessage}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700 font-medium">{errorMsg}</div>
      )}

      {/* Actions */}
      {isOwnProduct ? (
        <div className="space-y-2">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
            <Store className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-amber-800">This is your product</p>
          </div>
          <Link href="/store" className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-xs font-bold text-white transition-colors">
            <Store className="h-4 w-4" /> Seller Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={handlePurchase} disabled={purchaseLoading || product.quantity === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-3.5 text-sm font-black text-white transition-colors cursor-pointer">
            {purchaseLoading
              ? <><RefreshCw className="h-4 w-4 animate-spin" />{statusMessage || 'Processing...'}</>
              : product.quantity === 0
                ? 'Out of Stock'
                : <><ShoppingCart className="h-4 w-4" />Buy Now — Escrow Protected</>
            }
          </button>
          <div className="flex gap-2">
            <button onClick={handleAddToCart} disabled={product.quantity === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                cartAdded ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
              }`}>
              <ShoppingCart className="h-3.5 w-3.5" />{cartAdded ? '✓ Added!' : 'Add to Cart'}
            </button>
            <button onClick={toggleFavorite}
              className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                isFavorite ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-neutral-200 bg-white text-neutral-400 hover:text-rose-400'
              }`}>
              <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      )}

      {/* Escrow breakdown */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors list-none">
          <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Escrow Breakdown</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-2.5 pt-2.5 border-t border-neutral-100 space-y-1.5 text-[11px] text-neutral-500">
          {[['Stage 1 — Order locked', 0.3], ['Stage 2 — Shipped', 0.2], ['Stage 3 — Delivered', 0.5]].map(([label, pct]) => (
            <div key={label as string} className="flex justify-between">
              <span>{label as string}</span>
              <span className="font-bold text-neutral-700">{(parseFloat(totalCost) * (pct as number)).toFixed(3)} CELO</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );

  const BuyerProtection = () => (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
      <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Vendly Buyer Protection
      </h3>
      <div className="space-y-3">
        {[
          { icon: <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />, title: 'Funds locked in smart contract', desc: 'Your payment goes into a Celo blockchain escrow — not to the seller — until you confirm receipt.' },
          { icon: <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />, title: 'Verified sellers only', desc: 'Every store is manually reviewed and approved by the Vendly team before they can list products.' },
          { icon: <RefreshCw className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />, title: 'Full refund if item not received', desc: 'Open a dispute within the platform and our team will release your funds back if the seller fails to deliver.' },
          { icon: <Headphones className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />, title: '24/7 dispute resolution', desc: 'Our moderation team mediates all disputes and has on-chain authority to refund buyers or release escrow.' },
        ].map(item => (
          <div key={item.title} className="flex gap-3">
            {item.icon}
            <div>
              <p className="text-xs font-bold text-emerald-900">{item.title}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/buyer-protection" className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors">
        Learn more about buyer protection <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900">
      <Header />

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 pb-28">

        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
        </Link>

        {/* ── MOBILE: image → buy box → info → reviews ── */}
        {/* ── DESKTOP: left(image+info+reviews) | right sticky(buybox) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">

            {/* Product Image */}
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3]">
                {mainImg ? (
                  <Image
                    src={mainImg}
                    alt={product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                    <Package className="h-16 w-16 text-neutral-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Title + tags (shown above buy box on mobile via ordering) */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {product.category?.name && (
                  <span className="bg-amber-100 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800">{product.category.name}</span>
                )}
                {product.quality && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.quality === 'new'         ? 'bg-emerald-100 text-emerald-800' :
                    product.quality === 'neatly_used' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-neutral-200 text-neutral-600'
                  }`}>
                    {product.quality === 'new' ? '✦ New' : product.quality === 'neatly_used' ? 'Neatly Used' : 'Old Used'}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">{product.title}</h1>

              {/* Seller + rating */}
              <div className="flex flex-wrap items-center gap-4 bg-white border border-neutral-100 rounded-xl p-3.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-800 flex items-center gap-1 flex-wrap">
                      {product.store?.name || 'Vendly Store'}
                      <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black">VERIFIED</span>
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                      ))}
                      <span className="text-[10px] text-neutral-400 ml-1">
                        {avgRating > 0 ? `${avgRating.toFixed(1)} (${totalReviews})` : 'No reviews yet'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Buy box — MOBILE ONLY (shown between image and info on small screens) */}
            <div className="lg:hidden space-y-4">
              <BuyBox />
              <BuyerProtection />
            </div>

            {/* Escrow Milestone Tracker */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Escrow Release Milestones
              </h3>
              <p className="text-xs text-neutral-500">Your payment is split into three protected stages — funds only release when each delivery milestone is confirmed.</p>
              <div className="space-y-4">
                {[
                  { pct: '30%', color: 'bg-amber-500', label: 'Milestone 1 — Order Locked', desc: 'Released to seller on order confirmation to fund packaging and preparation.' },
                  { pct: '20%', color: 'bg-amber-400', label: 'Milestone 2 — Shipment Dispatched', desc: 'Released when seller provides verified shipping tracking information.' },
                  { pct: '50%', color: 'bg-amber-600', label: 'Milestone 3 — Delivered & Confirmed', desc: 'Final release only after you confirm receipt or courier API verifies arrival.' },
                ].map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`h-10 w-10 rounded-full ${m.color} flex items-center justify-center text-xs font-black text-white shrink-0`}>{m.pct}</div>
                    <div className="pt-1">
                      <p className="text-xs font-bold text-neutral-900">{m.label}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-5">
              <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" /> Customer Reviews
                {totalReviews > 0 && <span className="text-xs font-normal text-neutral-400">({totalReviews})</span>}
              </h3>

              {eligibleOrders.length > 0 && !isOwnProduct && !reviewSuccess && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
                  <h4 className="text-sm font-black text-neutral-900">Leave a Review</h4>
                  {eligibleOrders.length > 1 && (
                    <select value={reviewOrderId} onChange={e => setReviewOrderId(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
                      {eligibleOrders.map((o: any) => (
                        <option key={o.id} value={o.id}>Order #{o.orderNumber || o.id.slice(0, 8)}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)} onMouseLeave={() => setReviewHover(0)}
                        className="cursor-pointer p-0.5 transition-transform hover:scale-110">
                        <Star className={`h-7 w-7 transition-colors ${star <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`} />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm font-bold text-neutral-600 self-center">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                      </span>
                    )}
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3}
                    placeholder="Share your experience..."
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                  <button onClick={handleSubmitReview} disabled={!reviewRating || reviewSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer">
                    {reviewSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {reviewSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-sm font-bold text-emerald-800">Thank you for your review!</p>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center">
                  <Star className="mx-auto h-8 w-8 text-neutral-200 mb-2" />
                  <p className="text-sm font-bold text-neutral-400">No reviews yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Be the first to review after purchase.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="rounded-2xl border border-neutral-100 bg-white p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-black text-amber-700 shrink-0">
                            {(r.reviewer?.fullName || r.reviewer?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{r.reviewer?.fullName || r.reviewer?.username || 'Anonymous'}</p>
                            <p className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-neutral-600 leading-relaxed pl-10">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — sticky desktop only */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <BuyBox />
            <BuyerProtection />
          </div>

        </div>
      </main>
    </div>
  );
}
