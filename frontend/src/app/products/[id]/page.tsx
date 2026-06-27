'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { apiRequest } from '../../../utils/api';
import { ShoppingCart, ShieldCheck, RefreshCw, Star, ArrowLeft, Truck, Package, ShieldAlert, Award, ChevronRight, HelpCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showEscrowDetails, setShowEscrowDetails] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const { addItem } = useCart();

  const fetchProduct = async () => {
    try {
      const res = await apiRequest(`/products/${id}`);
      if (res.success) {
        setProduct(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    try {
      const favs = JSON.parse(localStorage.getItem('vendly_favorites') || '[]');
      setIsFavorite(favs.includes(String(id)));
    } catch {}
  }, [id]);

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
      image: product.images?.[0] || '',
      storeId: product.storeId || '',
      storeName: product.store?.name || 'Vendly Store'
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    setStatusMessage('Sandbox Mode: Initializing order...');
    setErrorMsg('');

    try {
      const orderRes = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          shippingAddress: '789 Sandbox Avenue, Celo Local Devnet'
        })
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create order');
      }

      const orderId = orderRes.data.id;
      setStatusMessage('Sandbox Mode: Simulating locked smart-escrow deposit...');
      
      // Simulate blockchain lag
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTx = '0x' + Math.random().toString(16).substr(2, 40) + 'ab82';
      await confirmPaymentOnBackend(mockTx, orderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sandbox purchase failed');
      setPurchaseLoading(false);
      setStatusMessage('');
    }
  };

  const confirmPaymentOnBackend = async (hash: string, orderId: string) => {
    setStatusMessage('Confirming transaction hash with audit log...');
    try {
      await apiRequest('/orders/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ orderId, txHash: hash })
      });
      setStatusMessage('Success! Funds locked in 3-stage escrow. Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(`Payment confirmed on-chain, but failed syncing backend: ${err.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-xs text-neutral-500 font-semibold">Retrieving product metrics...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <p className="text-neutral-500 font-semibold">Product listing not found.</p>
          <Link href="/marketplace" className="text-amber-600 hover:underline text-xs font-bold">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const mainImg = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600';
  const totalCost = (parseFloat(product.price) * quantity).toFixed(4);
  const usdPrice = (parseFloat(product.price) * 0.70).toFixed(2);
  const totalUsdCost = (parseFloat(totalCost) * 0.70).toFixed(2);

  // Mock seller statistics
  const sellerRating = 4.9;
  const sellerPositive = "98%";
  const sellerOrders = 142;

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* Breadcrumbs */}
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Listings
        </Link>

        {/* Professional Retail Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Product Presentation (Image + Description + Milestone Tracker) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image Gallery Container */}
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 md:p-6">
              <div className="h-96 md:h-[480px] rounded-xl overflow-hidden bg-white border border-neutral-200 relative">
                <img 
                  src={mainImg} 
                  alt={product.title} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Core Listing Details */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-amber-100 px-2.5 py-1 rounded text-xs font-bold text-amber-800">
                  {product.category?.name}
                </span>
                <span className="bg-neutral-100 px-2.5 py-1 rounded text-xs font-bold text-neutral-700">
                  SKU: P-{product.id.toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 leading-tight">
                {product.title}
              </h1>

              {/* Seller Reputation Block */}
              <div className="flex flex-wrap items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                      Merchant: {product.store?.name || 'Celo Alpha Emporium'}
                      <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black">VERIFIED</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Seller Rating: <span className="font-bold text-neutral-700">{sellerRating} ★</span> ({sellerPositive} positive feedback over {sellerOrders} orders)
                    </p>
                  </div>
                </div>
              </div>

              {/* Description tab */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Product Description</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Interactive Milestone Tracker breakdown */}
            <div className="border border-neutral-200 rounded-2xl bg-neutral-50 p-6 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                Escrow Release Milestone Progression
              </h3>
              <p className="text-xs text-neutral-500">
                To guarantee security, your Celo payment is divided into three incremental payout milestones:
              </p>

              <div className="relative border-l-2 border-amber-300 ml-3.5 pl-6 space-y-6 py-2">
                {/* Milestone 1 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    30%
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Milestone 1: Order Locked</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Released to seller immediately upon order initialization to fund packaging and setup.
                    </p>
                  </div>
                </div>

                {/* Milestone 2 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    20%
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Milestone 2: Shipment Dispatched</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Released when seller inputs shipping carrier dispatch verification tracking.
                    </p>
                  </div>
                </div>

                {/* Milestone 3 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    50%
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Milestone 3: Receipt and Release</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Released only when buyer confirms delivery or courier API verifies parcel arrival.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Sticky Buy Box Widget (Amazon Style) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl border border-neutral-250 bg-white p-6 shadow-md space-y-6">
              
              {/* Price block */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-semibold block">Total Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-neutral-900">{product.price} CELO</span>
                  <span className="text-xs text-neutral-500">~ ${usdPrice} USD</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded w-max">
                  ✓ Free secure shipping included
                </span>
              </div>

              <hr className="border-neutral-100" />

              {/* Shipping parameters */}
              <div className="space-y-3 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-neutral-400" />
                  <span>Delivery to: <b>Global Web3 Destination</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-neutral-400" />
                  <span>Ships within: <b>24-48 Hours</b></span>
                </div>
                <div className="flex items-center justify-between text-neutral-900">
                  <span>Stock Status:</span>
                  {product.quantity > 0 ? (
                    <span className="text-emerald-600 font-bold">{product.quantity} in stock</span>
                  ) : (
                    <span className="text-rose-600 font-bold">Out of stock</span>
                  )}
                </div>
              </div>

              <hr className="border-neutral-100" />

              {/* Quantity Selection */}
              {product.quantity > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Select Quantity</label>
                  <div className="flex items-center justify-between border border-neutral-350 rounded-lg overflow-hidden bg-neutral-50 p-1">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1 hover:bg-neutral-200 text-sm font-bold text-neutral-700 disabled:opacity-50 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-neutral-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                      disabled={quantity >= product.quantity}
                      className="px-3 py-1 hover:bg-neutral-200 text-sm font-bold text-neutral-700 disabled:opacity-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between items-center text-xs font-bold text-neutral-500">
                <span>Escrow Deposit Subtotal:</span>
                <div className="text-right">
                  <span className="text-neutral-900 block text-sm font-extrabold">{totalCost} CELO</span>
                  <span className="text-[10px] text-neutral-400 font-normal">~ ${totalUsdCost} USD</span>
                </div>
              </div>

              {/* Dynamic statuses */}
              {statusMessage && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-200 font-medium">
                  {errorMsg}
                </div>
              )}


              {/* Main Actions */}
              <div className="space-y-2">
                <button
                  onClick={handlePurchase}
                  disabled={purchaseLoading || product.quantity === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {purchaseLoading ? statusMessage || 'Processing...' : product.quantity === 0 ? 'Out of Stock' : 'Buy Now — Escrow Protected'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${cartAdded ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700'}`}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {cartAdded ? 'Added!' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${isFavorite ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-neutral-300 bg-white text-neutral-400 hover:text-rose-400'}`}
                    title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Escrow payout toggle box */}
              <div className="border border-neutral-100 rounded-lg p-3 space-y-2">
                <button 
                  onClick={() => setShowEscrowDetails(!showEscrowDetails)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <span>Escrow Payout Accordion</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showEscrowDetails ? 'rotate-90' : ''}`} />
                </button>

                {showEscrowDetails && (
                  <div className="text-[10px] text-neutral-500 space-y-1.5 pt-1.5 border-t border-neutral-100">
                    <div className="flex justify-between">
                      <span>Stage 1 (Initial Lock):</span>
                      <span className="font-bold">{(parseFloat(totalCost) * 0.3).toFixed(3)} CELO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage 2 (Courier Dispatch):</span>
                      <span className="font-bold">{(parseFloat(totalCost) * 0.2).toFixed(3)} CELO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage 3 (Parcel Confirm):</span>
                      <span className="font-bold">{(parseFloat(totalCost) * 0.5).toFixed(3)} CELO</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-[10px] text-neutral-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>100% Buyer Protection:</b> Funds are held securely on Celo Alfajores network escrow smart contracts.</span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
