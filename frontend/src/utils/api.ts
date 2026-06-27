const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Initial Mock Database setup for fully responsive offline demo
const DEFAULT_MOCK_DB = {
  users: [
    { id: 'u1', name: 'Alice Buyer', email: 'buyer@vendly.com', password: 'password123', role: 'BUYER' },
    { id: 'u2', name: 'Bob Storefront', email: 'seller@vendly.com', password: 'password123', role: 'SELLER' },
    { id: 'u3', name: 'Chief Moderator', email: 'admin@vendly.com', password: 'password123', role: 'ADMIN' }
  ],
  stores: [
    { id: 's1', userId: 'u2', name: 'Celo Alpha Emporium', description: 'Premium Web3 physical goods and digital assets.', isApproved: true }
  ],
  categories: [
    { id: '1', name: 'Electronics', slug: 'electronics' },
    { id: '2', name: 'Digital Services', slug: 'digital-services' },
    { id: '3', name: 'Apparel', slug: 'apparel' },
    { id: '4', name: 'Home & Kitchen', slug: 'home-kitchen' }
  ],
  products: [
    {
      id: 'p1',
      storeId: 's1',
      title: 'Premium Web3 Hardware Ledger',
      description: 'Secure, offline physical storage device supporting CELO, cUSD, and standard ERC-20 tokens. Equipped with an OLED screen and dual chip architecture.',
      price: '1.5',
      quantity: 10,
      categoryId: '1',
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600' }],
      store: { id: 's1', name: 'Celo Alpha Emporium' },
      category: { id: '1', name: 'Electronics' }
    },
    {
      id: 'p2',
      storeId: 's1',
      title: 'Celo NFT Artwork Collection',
      description: 'Limited edition high fidelity digital art minted directly on the Celo blockchain. Unlockable content included upon payment confirmation.',
      price: '0.5',
      quantity: 5,
      categoryId: '2',
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600' }],
      store: { id: 's1', name: 'Celo Alpha Emporium' },
      category: { id: '2', name: 'Digital Services' }
    },
    {
      id: 'p3',
      storeId: 's1',
      title: 'Sleek Cyber Hoodie (Special Edition)',
      description: 'Cotton-poly blend cyber-aesthetic apparel with embroidered physical QR tag linking to a verified creator certificate on Celo.',
      price: '2.0',
      quantity: 20,
      categoryId: '3',
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600' }],
      store: { id: 's1', name: 'Celo Alpha Emporium' },
      category: { id: '3', name: 'Apparel' }
    },
    {
      id: 'p4',
      storeId: 's1',
      title: 'Pro Mechanical Keyboard (Gold Trim)',
      description: 'Premium hot-swappable switches, golden anodized aluminum case, and Custom PBT Keycaps. Works wired or via ultra-low latency wireless.',
      price: '3.2',
      quantity: 8,
      categoryId: '1',
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600' }],
      store: { id: 's1', name: 'Celo Alpha Emporium' },
      category: { id: '1', name: 'Electronics' }
    },
    {
      id: 'p5',
      storeId: 's1',
      title: 'Smart Ambient Speaker Node',
      description: 'Immersive soundscape home hub speaker. Auto-tunes room audio signatures and connects directly to decentralized music distribution APIs.',
      price: '1.8',
      quantity: 12,
      categoryId: '4',
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&q=80&w=600' }],
      store: { id: 's1', name: 'Celo Alpha Emporium' },
      category: { id: '4', name: 'Home & Kitchen' }
    }
  ],
  orders: [] as any[],
  disputes: [] as any[],
  notifications: [] as any[],
  wallets: [
    {
      id: 'w1', userId: 'u1',
      address: '0x3A1F2B9cD4e56789aBcDeF0123456789AbCdEf01',
      balances: { CELO: 4.25, cUSD: 12.50, USDT: 8.00, USDC: 5.00 }
    },
    {
      id: 'w2', userId: 'u2',
      address: '0x9B2C3d4E5f678901aBcDeF2345678901AbCdEf02',
      balances: { CELO: 10.00, cUSD: 50.00, USDT: 20.00, USDC: 15.00 }
    },
    {
      id: 'w3', userId: 'u3',
      address: '0xC3D4E5f6789012bcDeF3456789012BcDeF012303',
      balances: { CELO: 100.00, cUSD: 200.00, USDT: 50.00, USDC: 50.00 }
    }
  ] as any[],
  walletTransactions: [
    { id: 'tx1', walletId: 'w1', type: 'DEPOSIT', token: 'CELO', amount: '2.00', status: 'COMPLETED', senderAddress: 'External', receiverAddress: '0x3A1F2B9cD4e56789aBcDeF0123456789AbCdEf01', txHash: '0xabc123', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'tx2', walletId: 'w1', type: 'ESCROW', token: 'CELO', amount: '1.50', status: 'COMPLETED', senderAddress: '0x3A1F2B9cD4e56789aBcDeF0123456789AbCdEf01', receiverAddress: 'Escrow Contract', txHash: '0xdef456', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'tx3', walletId: 'w1', type: 'TRANSFER', token: 'cUSD', amount: '5.00', status: 'COMPLETED', senderAddress: '0x3A1F2B9cD4e56789aBcDeF0123456789AbCdEf01', receiverAddress: '0x9B2C3d4E5f678901aBcDeF2345678901AbCdEf02', txHash: '0xghi789', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tx4', walletId: 'w2', type: 'DEPOSIT', token: 'cUSD', amount: '30.00', status: 'COMPLETED', senderAddress: 'External', receiverAddress: '0x9B2C3d4E5f678901aBcDeF2345678901AbCdEf02', txHash: '0xjkl000', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'tx5', walletId: 'w2', type: 'WITHDRAWAL', token: 'CELO', amount: '3.00', status: 'PENDING', senderAddress: '0x9B2C3d4E5f678901aBcDeF2345678901AbCdEf02', receiverAddress: 'External Wallet', txHash: null, createdAt: new Date(Date.now() - 3600000).toISOString() }
  ] as any[]
};

function getMockDB(): typeof DEFAULT_MOCK_DB {
  if (typeof window === 'undefined') return DEFAULT_MOCK_DB;
  const dbStr = localStorage.getItem('vendly_mock_db');
  if (!dbStr) {
    localStorage.setItem('vendly_mock_db', JSON.stringify(DEFAULT_MOCK_DB));
    return DEFAULT_MOCK_DB;
  }
  return JSON.parse(dbStr);
}

function saveMockDB(db: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendly_mock_db', JSON.stringify(db));
  }
}

function getActiveUserFromToken(): any {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('vendly_token');
  if (!token) return null;
  const db = getMockDB();
  return db.users.find(u => u.email === token) || null;
}

function handleMockRequest(endpoint: string, options: RequestInit = {}): any {
  const db = getMockDB();
  const activeUser = getActiveUserFromToken();
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;
  
  // Clean endpoint path and query parameters
  const [path, queryStr] = endpoint.split('?');
  const query = new URLSearchParams(queryStr || '');

  // Log mock API routing for developers
  console.log(`[Mock API Fallback] ${method} ${path}`, { query: Object.fromEntries(query.entries()), body });

  // 1. AUTH ROUTES
  if (path === '/auth/login') {
    const user = db.users.find(u => u.email === body.email && u.password === body.password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return { success: true, data: { accessToken: user.email } };
  }

  if (path === '/auth/register') {
    const exists = db.users.some(u => u.email === body.email);
    if (exists) {
      throw new Error('User already exists');
    }
    const newUser = {
      id: 'u' + (db.users.length + 1),
      name: body.name,
      email: body.email,
      password: body.password || 'password123',
      role: body.role || 'BUYER'
    };
    db.users.push(newUser);
    saveMockDB(db);
    return { success: true, data: newUser };
  }

  if (path === '/auth/profile') {
    if (!activeUser) {
      throw new Error('Unauthorized');
    }
    return { success: true, data: activeUser };
  }

  // 2. STORES ROUTES
  if (path === '/stores/my-store') {
    if (!activeUser) throw new Error('Unauthorized');
    const store = db.stores.find(s => s.userId === activeUser.id);
    return { success: true, data: store || null };
  }

  if (path === '/stores' && method === 'POST') {
    if (!activeUser) throw new Error('Unauthorized');
    const newStore = {
      id: 's' + (db.stores.length + 1),
      userId: activeUser.id,
      name: body.name,
      description: body.description,
      isApproved: false // awaits admin approval
    };
    db.stores.push(newStore);
    saveMockDB(db);
    return { success: true, data: newStore };
  }

  // 3. PRODUCTS ROUTES
  if (path === '/products') {
    if (method === 'POST') {
      if (!activeUser) throw new Error('Unauthorized');
      const store = db.stores.find(s => s.userId === activeUser.id);
      if (!store) throw new Error('No store registered for user');
      
      const newProd = {
        id: 'p' + (db.products.length + 1),
        storeId: store.id,
        title: body.title,
        description: body.description,
        price: body.price,
        quantity: parseInt(body.quantity || 1),
        categoryId: body.categoryId || '1',
        images: body.images ? body.images.map((img: string) => typeof img === 'string' ? { imageUrl: img } : img) : [],
        store: { id: store.id, name: store.name },
        category: db.categories.find(c => c.id === body.categoryId) || { id: '1', name: 'Electronics' }
      };
      
      db.products.push(newProd);
      saveMockDB(db);
      return { success: true, data: newProd };
    } else {
      // GET products list
      let filtered = [...db.products];
      
      const searchKey = query.get('search');
      if (searchKey) {
        const k = searchKey.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(k) || p.description.toLowerCase().includes(k));
      }
      
      const catId = query.get('categoryId');
      if (catId) {
        filtered = filtered.filter(p => p.categoryId === catId);
      }
      
      const minPrice = query.get('minPrice');
      if (minPrice) {
        filtered = filtered.filter(p => parseFloat(p.price) >= parseFloat(minPrice));
      }
      
      const maxPrice = query.get('maxPrice');
      if (maxPrice) {
        filtered = filtered.filter(p => parseFloat(p.price) <= parseFloat(maxPrice));
      }

      const storeId = query.get('storeId');
      if (storeId) {
        filtered = filtered.filter(p => p.storeId === storeId);
      }
      
      return { success: true, data: filtered };
    }
  }

  // GET single product details
  if (path.startsWith('/products/')) {
    const id = path.split('/').pop();
    const product = db.products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return { success: true, data: product };
  }

  // 4. ORDERS ROUTES
  if (path === '/orders' && method === 'POST') {
    if (!activeUser) throw new Error('Unauthorized');
    const orderItems = body.items.map((item: any) => {
      const prod = db.products.find(p => p.id === item.productId);
      return {
        id: 'oi' + Math.random().toString(36).substr(2, 9),
        productId: item.productId,
        quantity: item.quantity,
        price: prod?.price || '0',
        product: prod
      };
    });

    const totalAmount = orderItems.reduce((acc: number, oi: any) => acc + parseFloat(oi.price) * oi.quantity, 0).toFixed(4);

    // Deduct stock
    orderItems.forEach((oi: any) => {
      const prod = db.products.find(p => p.id === oi.productId);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - oi.quantity);
      }
    });

    const newOrder = {
      id: 'ord' + (db.orders.length + 1001),
      userId: activeUser.id,
      storeId: orderItems[0]?.product?.storeId || 's1',
      status: 'PENDING',
      totalAmount,
      shippingAddress: body.shippingAddress || 'Default Web3 Address',
      items: orderItems,
      store: orderItems[0]?.product?.store,
      user: { name: activeUser.name, email: activeUser.email },
      createdAt: new Date().toISOString()
    };

    db.orders.push(newOrder);
    
    // Add notification to seller
    const sellerStore = db.stores.find(s => s.id === newOrder.storeId);
    if (sellerStore) {
      db.notifications.unshift({
        id: 'n' + (db.notifications.length + 1),
        userId: sellerStore.userId,
        message: `New escrow order placed for ${totalAmount} CELO! Awaiting buyer lock signature.`,
        createdAt: new Date().toISOString()
      });
    }

    saveMockDB(db);
    return { success: true, data: newOrder };
  }

  if (path === '/orders/confirm-payment') {
    const order = db.orders.find(o => o.id === body.orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'PAID';
    order.txHash = body.txHash || '0x' + Math.random().toString(16).substr(2, 40);

    // Notification to buyer
    db.notifications.unshift({
      id: 'n' + (db.notifications.length + 1),
      userId: order.userId,
      message: `Payment confirmed! ${order.totalAmount} CELO locked in 3-stage Escrow for order ${order.id}.`,
      createdAt: new Date().toISOString()
    });

    // Notification to seller
    const store = db.stores.find(s => s.id === order.storeId);
    if (store) {
      db.notifications.unshift({
        id: 'n' + (db.notifications.length + 1),
        userId: store.userId,
        message: `Order ${order.id} paid! Lock signed. Please package and ship the products to initiate Stage 1 payout.`,
        createdAt: new Date().toISOString()
      });
    }

    saveMockDB(db);
    return { success: true, data: order };
  }

  if (path === '/orders/my-orders') {
    if (!activeUser) throw new Error('Unauthorized');
    let userOrders = [];
    if (activeUser.role === 'BUYER') {
      userOrders = db.orders.filter(o => o.userId === activeUser.id);
    } else if (activeUser.role === 'SELLER') {
      const store = db.stores.find(s => s.userId === activeUser.id);
      userOrders = store ? db.orders.filter(o => o.storeId === store.id) : [];
    } else {
      userOrders = db.orders; // Admin sees all
    }
    return { success: true, data: userOrders.sort((a,b) => b.id.localeCompare(a.id)) };
  }

  // 5. NOTIFICATIONS
  if (path === '/notifications') {
    if (!activeUser) throw new Error('Unauthorized');
    const userNotifs = db.notifications.filter(n => n.userId === activeUser.id);
    return { success: true, data: userNotifs };
  }

  // 6. ADMIN OPERATIONS
  if (path === '/admin/pending-stores') {
    const pending = db.stores.filter(s => !s.isApproved);
    // Include user details
    const mapped = pending.map(s => {
      const owner = db.users.find(u => u.id === s.userId);
      return { ...s, user: owner };
    });
    return { success: true, data: mapped };
  }

  if (path === '/admin/approve-store') {
    const store = db.stores.find(s => s.id === body.storeId);
    if (!store) throw new Error('Store not found');
    store.isApproved = body.approve;
    if (body.approve) {
      db.notifications.unshift({
        id: 'n' + (db.notifications.length + 1),
        userId: store.userId,
        message: `Congratulations! Your store '${store.name}' has been approved by the platform moderators. You are now live!`,
        createdAt: new Date().toISOString()
      });
    }
    saveMockDB(db);
    return { success: true, data: store };
  }

  if (path === '/admin/disputes') {
    const activeDisputes = db.disputes.filter(d => d.status === 'OPEN');
    // Map order details
    const mapped = activeDisputes.map(d => {
      const order = db.orders.find(o => o.id === d.orderId);
      return { ...d, order };
    });
    return { success: true, data: mapped };
  }

  if (path.startsWith('/admin/disputes/') && path.endsWith('/resolve')) {
    const segments = path.split('/');
    const disputeId = segments[segments.length - 2];
    const dispute = db.disputes.find(d => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found');
    
    dispute.status = 'RESOLVED';
    dispute.refundPercentage = body.refundPercentage;
    dispute.resolvedAt = new Date().toISOString();

    const order = db.orders.find(o => o.id === dispute.orderId);
    if (order) {
      order.status = 'DELIVERED'; // Settled
      db.notifications.unshift({
        id: 'n' + (db.notifications.length + 1),
        userId: order.userId,
        message: `Platform mediation completed for order ${order.id}. ${body.refundPercentage}% refunded to buyer.`,
        createdAt: new Date().toISOString()
      });
      const store = db.stores.find(s => s.id === order.storeId);
      if (store) {
        db.notifications.unshift({
          id: 'n' + (db.notifications.length + 1),
          userId: store.userId,
          message: `Dispute on order ${order.id} resolved by moderators. ${100 - body.refundPercentage}% payout released to store.`,
          createdAt: new Date().toISOString()
        });
      }
    }

    saveMockDB(db);
    return { success: true, data: dispute };
  }

  // 7. BUYER DISPUTES
  if (path === '/disputes' && method === 'POST') {
    if (!activeUser) throw new Error('Unauthorized');
    const order = db.orders.find(o => o.id === body.orderId);
    if (!order) throw new Error('Order not found');
    
    order.status = 'DISPUTED';
    
    const newDispute = {
      id: 'disp' + (db.disputes.length + 101),
      orderId: order.id,
      reason: body.reason,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    db.disputes.push(newDispute);

    // Notify seller
    const store = db.stores.find(s => s.id === order.storeId);
    if (store) {
      db.notifications.unshift({
        id: 'n' + (db.notifications.length + 1),
        userId: store.userId,
        message: `Dispute opened by buyer for order ${order.id} stating: "${body.reason}". Escrow locked pending admin review.`,
        createdAt: new Date().toISOString()
      });
    }

    saveMockDB(db);
    return { success: true, data: newDispute };
  }

  // 8. WALLET ROUTES
  if (path === '/wallet/balance') {
    if (!activeUser) throw new Error('Unauthorized');
    const wallet = db.wallets.find((w: any) => w.userId === activeUser.id);
    if (!wallet) {
      // Auto-create a mock wallet for new users
      const newWallet = {
        id: 'w' + (db.wallets.length + 1),
        userId: activeUser.id,
        address: '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0'),
        balances: { CELO: 0.00, cUSD: 0.00, USDT: 0.00, USDC: 0.00 }
      };
      db.wallets.push(newWallet);
      saveMockDB(db);
      return { success: true, data: { id: newWallet.id, address: newWallet.address, balances: newWallet.balances } };
    }
    return { success: true, data: { id: wallet.id, address: wallet.address, balances: wallet.balances } };
  }

  if (path === '/wallet/history') {
    if (!activeUser) throw new Error('Unauthorized');
    const wallet = db.wallets.find((w: any) => w.userId === activeUser.id);
    if (!wallet) return { success: true, data: [] };
    const txs = db.walletTransactions.filter((tx: any) => tx.walletId === wallet.id);
    return { success: true, data: txs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
  }

  if (path === '/wallet/transfer' && method === 'POST') {
    if (!activeUser) throw new Error('Unauthorized');
    const { receiverAddress, token, amount } = body;
    if (!receiverAddress || !token || !amount) throw new Error('Missing transfer parameters');
    const wallet = db.wallets.find((w: any) => w.userId === activeUser.id);
    if (!wallet) throw new Error('Wallet not found');
    const bal = wallet.balances[token] || 0;
    if (bal < parseFloat(amount)) throw new Error(`Insufficient ${token} balance`);
    wallet.balances[token] = parseFloat((bal - parseFloat(amount)).toFixed(6));
    const newTx = {
      id: 'tx' + Date.now(),
      walletId: wallet.id,
      type: 'TRANSFER',
      token,
      amount: String(amount),
      status: 'COMPLETED',
      senderAddress: wallet.address,
      receiverAddress,
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      createdAt: new Date().toISOString()
    };
    db.walletTransactions.push(newTx);
    saveMockDB(db);
    return { success: true, message: 'Transfer executed successfully', data: newTx };
  }

  if (path === '/wallet/withdraw' && method === 'POST') {
    if (!activeUser) throw new Error('Unauthorized');
    const { destinationAddress, token, amount } = body;
    if (!destinationAddress || !token || !amount) throw new Error('Missing withdrawal parameters');
    const wallet = db.wallets.find((w: any) => w.userId === activeUser.id);
    if (!wallet) throw new Error('Wallet not found');
    const bal = wallet.balances[token] || 0;
    if (bal < parseFloat(amount)) throw new Error(`Insufficient ${token} balance`);
    wallet.balances[token] = parseFloat((bal - parseFloat(amount)).toFixed(6));
    const newTx = {
      id: 'tx' + Date.now(),
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      token,
      amount: String(amount),
      status: 'PENDING',
      senderAddress: wallet.address,
      receiverAddress: destinationAddress,
      txHash: null,
      createdAt: new Date().toISOString()
    };
    db.walletTransactions.push(newTx);
    saveMockDB(db);
    return { success: true, message: 'Withdrawal request submitted for approval', data: newTx };
  }

  // Default fallback error
  throw new Error(`Endpoint mock handler not found for: ${method} ${path}`);
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendly_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (err: any) {
    // If backend connection fails (fetch throws an error because server isn't running),
    // we intercept and handle the request transparently using localStorage mock DB fallback!
    console.warn(`[Backend Offline Fallback] Redirecting ${options.method || 'GET'} ${endpoint} to mock router.`, err);
    try {
      const mockResult = handleMockRequest(endpoint, options);
      return mockResult;
    } catch (mockErr: any) {
      throw new Error(mockErr.message || 'Fallback simulation error');
    }
  }
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendly_token', token);
  }
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendly_token');
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vendly_token');
  }
  return null;
}
