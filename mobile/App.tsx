import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert,
  SafeAreaView
} from 'react-native';

// Screen Router state
type Screen = 'Marketplace' | 'Details' | 'Dashboard' | 'Admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Marketplace');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | 'ADMIN'>('BUYER');
  
  // Listings Catalog Mock
  const [products, setProducts] = useState<any[]>([
    {
      id: 'p1',
      title: 'Premium Web3 Hardware Ledger',
      description: 'Secure, offline physical storage device supporting CELO, cUSD, and standard tokens.',
      price: '1.5',
      quantity: 10,
      seller: 'Celo Alpha Emporium'
    },
    {
      id: 'p2',
      title: 'Celo NFT Artwork Collection',
      description: 'Limited edition high fidelity digital art minted directly on the Celo blockchain.',
      price: '0.5',
      quantity: 5,
      seller: 'Celo Alpha Emporium'
    },
    {
      id: 'p3',
      title: 'Sleek Cyber Hoodie (Special Edition)',
      description: 'Cotton-poly blend cyber-aesthetic apparel with embroidered physical QR tag.',
      price: '2.0',
      quantity: 20,
      seller: 'Celo Alpha Emporium'
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Wallet Balances Mock
  const [wallet, setWallet] = useState({
    address: '0x321a...b98c',
    CELO: '150.00',
    cUSD: '85.50',
    USDT: '45.00',
    USDC: '25.00'
  });

  // Orders and Disputes Mock
  const [orders, setOrders] = useState<any[]>([
    {
      id: 'ord-8839',
      productTitle: 'Premium Web3 Hardware Ledger',
      totalAmount: '1.5',
      status: 'PAID',
      shippingAddress: '123 Celo Developer Blvd',
      txHash: '0x12f...892'
    }
  ]);

  const [disputes, setDisputes] = useState<any[]>([]);

  // Dispute form modal state
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Platform setting fee mock
  const [platformFeeBps, setPlatformFeeBps] = useState('250');

  // Trigger Purchase Flow
  const handlePurchase = (product: any) => {
    Alert.alert(
      "Confirm Purchase",
      `Purchase ${product.title} for ${product.price} CELO?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            // Deduct balance
            const newCelo = (parseFloat(wallet.CELO) - parseFloat(product.price)).toFixed(2);
            setWallet(w => ({ ...w, CELO: newCelo }));
            
            // Add Order
            const newOrder = {
              id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
              productTitle: product.title,
              totalAmount: product.price,
              status: 'PAID',
              shippingAddress: '789 Mobile Developer Way',
              txHash: `0x${Math.random().toString(16).substr(2, 9)}...tx`
            };
            setOrders(prev => [newOrder, ...prev]);
            Alert.alert("Success", "Assets locked in Escrow contract! Order is PAID.");
            setCurrentScreen('Dashboard');
          } 
        }
      ]
    );
  };

  const handleUpdateStatus = (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    Alert.alert("Status Updated", `Order status is now ${nextStatus}`);
  };

  const submitDispute = () => {
    const newDispute = {
      id: `disp-${Math.floor(100 + Math.random() * 900)}`,
      orderId: disputeOrderId,
      reason: disputeReason,
      status: 'OPEN'
    };
    setDisputes(prev => [newDispute, ...prev]);
    setOrders(prev => prev.map(o => o.id === disputeOrderId ? { ...o, status: 'DISPUTED' } : o));
    setIsDisputeModalVisible(false);
    setDisputeReason('');
    Alert.alert("Claim Open", "Moderators have been alerted to mediate escrow release.");
  };

  const handleResolveDispute = (disputeId: string, resolution: 'REFUND' | 'RELEASE') => {
    setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d));
    
    // Find dispute order id
    const disp = disputes.find(d => d.id === disputeId);
    if (disp) {
      setOrders(prev => prev.map(o => o.id === disp.orderId ? { ...o, status: resolution === 'REFUND' ? 'REFUNDED' : 'COMPLETED' } : o));
    }
    
    Alert.alert("Case Settled", `Escrow released as: ${resolution}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      {/* Top Header */}
      <View className="px-6 py-4 border-b border-slate-900 flex-row justify-between items-center bg-slate-950">
        <View>
          <Text className="text-xl font-black tracking-tight text-white">VENDLY</Text>
          <Text className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Celo Mobile Escrow</Text>
        </View>

        {/* Role Selector toggles */}
        <View className="flex-row bg-slate-900 rounded-full p-1 border border-slate-800">
          {(['BUYER', 'SELLER', 'ADMIN'] as const).map((r) => (
            <TouchableOpacity 
              key={r}
              onPress={() => setRole(r)}
              className={`rounded-full px-3 py-1 ${role === r ? 'bg-sky-500' : ''}`}
            >
              <Text className={`text-[10px] font-bold ${role === r ? 'text-slate-950' : 'text-slate-400'}`}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Container */}
      <ScrollView className="flex-1 px-5 py-4">
        
        {currentScreen === 'Marketplace' && (
          <View className="space-y-6">
            <View className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 space-y-1.5">
              <Text className="text-xs font-bold text-sky-400">Secure Escrow Shopping</Text>
              <Text className="text-[11px] text-slate-400 leading-normal">
                Select a listing below. Funds will be locked in the Celo smart contract and released incrementally.
              </Text>
            </View>

            <Text className="text-base font-bold text-white mb-2">Available Products</Text>

            {products.map((prod) => (
              <View key={prod.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-4">
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">{prod.seller}</Text>
                    <Text className="text-sm font-bold text-white mt-0.5">{prod.title}</Text>
                  </View>
                  <Text className="text-sm font-black text-sky-400">{prod.price} CELO</Text>
                </View>

                <Text className="text-[11px] text-slate-400 leading-normal">{prod.description}</Text>

                <View className="flex-row justify-between items-center pt-2">
                  <Text className="text-[10px] text-slate-500">Stock: {prod.quantity} left</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedProduct(prod);
                      setCurrentScreen('Details');
                    }}
                    className="bg-sky-500 rounded-lg px-3.5 py-1.5"
                  >
                    <Text className="text-[10px] font-bold text-slate-950">View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {currentScreen === 'Details' && selectedProduct && (
          <View className="space-y-6">
            <TouchableOpacity 
              onPress={() => setCurrentScreen('Marketplace')}
              className="flex-row items-center gap-1 mb-2"
            >
              <Text className="text-xs text-slate-400 font-bold">← Back to Marketplace</Text>
            </TouchableOpacity>

            <View className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <View className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-slate-500">Merchant: {selectedProduct.seller}</Text>
                <Text className="text-lg font-bold text-white">{selectedProduct.title}</Text>
              </View>

              <View className="border-t border-b border-slate-800 py-3 flex-row justify-between items-center">
                <Text className="text-xs text-slate-400 font-semibold">Total Price</Text>
                <Text className="text-xl font-black text-white">{selectedProduct.price} CELO</Text>
              </View>

              <Text className="text-xs text-slate-400 leading-normal">{selectedProduct.description}</Text>

              <TouchableOpacity 
                onPress={() => handlePurchase(selectedProduct)}
                className="bg-sky-500 rounded-xl py-3 items-center"
              >
                <Text className="text-xs font-bold text-slate-950">Confirm Escrow Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentScreen === 'Dashboard' && (
          <View className="space-y-6">
            {/* Wallet details */}
            <View className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Escrow Wallet</Text>
              <Text className="text-[10px] font-mono text-slate-500 truncate">{wallet.address}</Text>
              
              <View className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <Text className="text-[11px] text-slate-300">CELO: <Text className="font-bold text-white">{wallet.CELO}</Text></Text>
                <Text className="text-[11px] text-slate-300">cUSD: <Text className="font-bold text-white">{wallet.cUSD}</Text></Text>
                <Text className="text-[11px] text-slate-300">USDT: <Text className="font-bold text-white">{wallet.USDT}</Text></Text>
                <Text className="text-[11px] text-slate-300">USDC: <Text className="font-bold text-white">{wallet.USDC}</Text></Text>
              </View>
            </View>

            {/* Orders list */}
            <Text className="text-sm font-bold text-white mb-2">My Orders Audit</Text>
            {orders.map((order) => (
              <View key={order.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-3 space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[10px] font-mono text-slate-500">{order.id}</Text>
                  <Text className="text-[10px] font-bold text-sky-400">{order.status}</Text>
                </View>
                <Text className="text-xs font-bold text-white">{order.productTitle}</Text>
                <Text className="text-[11px] text-slate-400">Amount paid: {order.totalAmount} CELO</Text>

                {role === 'SELLER' && order.status === 'PAID' && (
                  <TouchableOpacity 
                    onPress={() => handleUpdateStatus(order.id, 'SHIPPED')}
                    className="bg-indigo-500 rounded-lg py-1.5 items-center mt-2"
                  >
                    <Text className="text-[10px] font-bold text-white">Mark as Shipped</Text>
                  </TouchableOpacity>
                )}

                {role === 'BUYER' && order.status === 'SHIPPED' && (
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity 
                      onPress={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="flex-1 bg-emerald-500 rounded-lg py-1.5 items-center"
                    >
                      <Text className="text-[10px] font-bold text-slate-950">Confirm Delivery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        setDisputeOrderId(order.id);
                        setIsDisputeModalVisible(true);
                      }}
                      className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5 items-center"
                    >
                      <Text className="text-[10px] font-bold text-rose-400">Dispute</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {currentScreen === 'Admin' && (
          <View className="space-y-6">
            {/* Global Settings */}
            <View className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Charges Setting</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-400">Platform Charge Ratio</Text>
                <TextInput 
                  keyboardType="numeric"
                  value={platformFeeBps}
                  onChangeText={setPlatformFeeBps}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white font-bold w-20 text-center"
                />
              </View>
              <Text className="text-[10px] text-slate-500 leading-normal">
                100 basis points = 1.00% charge per item release.
              </Text>
            </View>

            {/* Disputes mediation list */}
            <Text className="text-sm font-bold text-white mb-2">Mediation Center</Text>
            {disputes.length === 0 ? (
              <Text className="text-xs text-slate-500 text-center py-4">No dispute tickets raised.</Text>
            ) : (
              disputes.map((disp) => (
                <View key={disp.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-3 space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[10px] font-mono text-slate-500">{disp.id}</Text>
                    <Text className="text-[10px] font-bold text-rose-400">{disp.status}</Text>
                  </View>
                  <Text className="text-xs text-slate-400">Order ID: {disp.orderId}</Text>
                  <Text className="text-xs text-slate-300 font-semibold">"{disp.reason}"</Text>

                  {disp.status === 'OPEN' && (
                    <View className="flex-row gap-2 pt-2 border-t border-slate-800/80">
                      <TouchableOpacity 
                        onPress={() => handleResolveDispute(disp.id, 'REFUND')}
                        className="flex-1 bg-rose-500 rounded-lg py-1.5 items-center"
                      >
                        <Text className="text-[10px] font-bold text-white">Refund Buyer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleResolveDispute(disp.id, 'RELEASE')}
                        className="flex-1 bg-emerald-500 rounded-lg py-1.5 items-center"
                      >
                        <Text className="text-[10px] font-bold text-slate-950">Release to Seller</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Dispute Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDisputeModalVisible}
        onRequestClose={() => setIsDisputeModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full space-y-4 shadow-2xl">
            <Text className="text-sm font-bold text-white">File Escrow Dispute Claim</Text>
            <Text className="text-[11px] text-slate-500">Describe the delivery fault to halt merchant escrow release.</Text>
            
            <TextInput
              multiline
              numberOfLines={4}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="e.g. Broken item packaging, incorrect shipment size..."
              placeholderTextColor="#64748b"
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />

            <View className="flex-row gap-3 justify-end pt-2">
              <TouchableOpacity 
                onPress={() => setIsDisputeModalVisible(false)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2"
              >
                <Text className="text-xs font-semibold text-slate-400">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={submitDispute}
                className="bg-rose-500 rounded-lg px-4 py-2"
              >
                <Text className="text-xs font-bold text-white">Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer Navigation Bar */}
      <View className="px-6 py-3 border-t border-slate-900 flex-row justify-around bg-slate-950">
        {(['Marketplace', 'Dashboard', 'Admin'] as const).map((scr) => (
          <TouchableOpacity 
            key={scr}
            onPress={() => setCurrentScreen(scr)}
            className="items-center py-1"
          >
            <Text className={`text-[11px] font-bold ${currentScreen === scr ? 'text-sky-400' : 'text-slate-500'}`}>
              {scr}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
