const { ethers } = require('ethers');
require('dotenv').config();

// Token addresses on Celo Sepolia Testnet
// cUSD/USDT/USDC addresses differ per network — set via env vars in production
const TOKENS = {
  CELO: ethers.ZeroAddress,
  cUSD: process.env.CUSD_ADDRESS  || ethers.ZeroAddress,
  USDT: process.env.USDT_ADDRESS  || ethers.ZeroAddress,
  USDC: process.env.USDC_ADDRESS  || ethers.ZeroAddress
};

// ABIs
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)'
];

const ESCROW_ABI = [
  // Admin: lock funds when buyer places order
  'function lockFunds(bytes32 orderId, address buyer, address seller, address token, uint256 amount) external payable',
  // Admin: approve each stage — credits seller's claimable balance, does NOT auto-transfer
  'function approveStage(bytes32 orderId, uint8 stage) external',
  // Seller: pull any approved-but-unwithdrawN balance for their order
  'function sellerWithdraw(bytes32 orderId) external',
  // Admin: refund remaining locked funds to buyer (approved amounts stay credited to seller)
  'function refundBuyer(bytes32 orderId) external',
  // Buyer/Seller/Admin: flag an order as disputed
  'function openDispute(bytes32 orderId) external',
  // Admin: resolve dispute — split remaining locked funds
  'function resolveDispute(bytes32 orderId, uint256 sellerShare) external',
  // Admin only: emergency drain
  'function adminEmergencyWithdraw(address token, uint256 amount) external',
  // Views
  'function getSellerClaimable(bytes32 orderId) external view returns (uint256)',
  'function getOrder(bytes32 orderId) external view returns (address buyer, address seller, address token, uint256 totalAmount, uint256 approvedAmount, uint256 withdrawnAmount, uint8 stageApproved, bool active, bool disputed, bool refunded)',
  'function admin() external view returns (address)'
];

const PROVIDER_URL = process.env.CELO_PROVIDER_URL || 'https://celo-sepolia.g.alchemy.com/v2/IT28dkgGdoaFjLobFalF_';
const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || ethers.ZeroAddress;

// All blockchain objects are lazy — created on first use, not at module load.
// Passing a static network avoids ethers auto-detecting chainId on startup (which spams logs if the RPC is unreachable).
let _provider = null;
let _adminWallet = null;
let _escrowContract = null;

function getProvider() {
  if (_provider) return _provider;
  _provider = new ethers.JsonRpcProvider(PROVIDER_URL, { chainId: 11142220, name: 'celo-sepolia' });
  return _provider;
}

function getAdminWallet() {
  if (_adminWallet) return _adminWallet;

  const key = process.env.ADMIN_PRIVATE_KEY;
  const isValidKey = key && /^0x[0-9a-fA-F]{64}$/.test(key);

  if (!isValidKey) {
    throw new Error(
      'ADMIN_PRIVATE_KEY is not set or invalid in .env. ' +
      'It must be a 32-byte hex string starting with 0x (64 hex chars after 0x).'
    );
  }

  _adminWallet = new ethers.Wallet(key, getProvider());
  return _adminWallet;
}

function getEscrowContract() {
  if (_escrowContract) return _escrowContract;
  _escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, getAdminWallet());
  return _escrowContract;
}

/**
 * Generates a new random Celo wallet address.
 */
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

/**
 * Returns CELO and ERC20 stablecoins balances.
 */
async function getBalances(address) {
  try {
    const celoBalanceRaw = await getProvider().getBalance(address);
    const celoBalance = ethers.formatEther(celoBalanceRaw);

    const balances = {
      CELO: celoBalance,
      cUSD: '0.0',
      USDT: '0.0',
      USDC: '0.0'
    };

    for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
      if (symbol === 'CELO') continue;
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, getProvider());
        const bal = await contract.balanceOf(address);
        balances[symbol] = ethers.formatEther(bal); // Assuming 18 decimals for test tokens
      } catch (err) {
        balances[symbol] = '0.0';
      }
    }

    return balances;
  } catch (error) {
    console.error('Error fetching Celo balances:', error);
    return { CELO: '0.0', cUSD: '0.0', USDT: '0.0', USDC: '0.0' };
  }
}

/**
 * Transfers tokens from an internal wallet to an address.
 */
async function transferTokens(senderPrivateKey, receiverAddress, tokenSymbol, amount) {
  const wallet = new ethers.Wallet(senderPrivateKey, getProvider());
  const amountWei = ethers.parseEther(amount.toString());

  if (tokenSymbol === 'CELO') {
    const tx = await wallet.sendTransaction({
      to: receiverAddress,
      value: amountWei
    });
    const receipt = await tx.wait();
    return receipt.hash;
  } else {
    const tokenAddress = TOKENS[tokenSymbol];
    if (!tokenAddress) throw new Error(`Unsupported token: ${tokenSymbol}`);

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const tx = await contract.transfer(receiverAddress, amountWei);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}

const MOCK_TX = '0x_mock_tx_not_deployed';

function isEscrowDeployed() {
  return ESCROW_CONTRACT_ADDRESS !== ethers.ZeroAddress;
}

/**
 * Called by backend when buyer places an order.
 * Locks the buyer's funds in the escrow contract.
 * tokenSymbol: 'CELO' | 'cUSD' | 'USDT' | 'USDC'
 */
/**
 * Locks buyer's funds in the escrow contract.
 *
 * The contract is onlyAdmin — only the admin wallet can call lockFunds.
 * In our custodial model the flow is:
 *   1. Buyer wallet → admin wallet  (buyer's funds are debited)
 *   2. Admin wallet → escrow contract via lockFunds  (funds are locked on-chain)
 *
 * For ERC-20:
 *   1. Buyer wallet transfers tokens to admin wallet
 *   2. Admin wallet approves escrow contract
 *   3. Admin wallet calls lockFunds (contract pulls from admin)
 */
async function lockEscrowFunds(orderId, buyerAddress, sellerAddress, tokenSymbol, amount, buyerPrivateKey) {
  if (!isEscrowDeployed()) {
    console.warn('[Escrow] Contract not deployed — skipping lockFunds');
    return MOCK_TX;
  }

  if (!buyerPrivateKey) throw new Error('Buyer private key required to lock escrow funds');

  const amountWei = ethers.parseEther(amount.toString());
  const adminWallet = getAdminWallet();
  const buyerOnChainWallet = new ethers.Wallet(buyerPrivateKey, getProvider());
  const orderIdBytes = ethers.id(orderId);
  const tokenAddress = TOKENS[tokenSymbol] ?? ethers.ZeroAddress;

  if (tokenSymbol === 'CELO') {
    // Step 1: Buyer's custodial wallet sends CELO to admin wallet.
    // Buyer's wallet is funded on-chain via airdrop, so they cover the amount.
    const transferTx = await buyerOnChainWallet.sendTransaction({
      to: adminWallet.address,
      value: amountWei
    });
    await transferTx.wait();

    // Step 2: Admin locks that CELO in the escrow contract.
    // Admin only covers gas here — the CELO came from the buyer.
    const contract = getEscrowContract();
    const lockTx = await contract.lockFunds(
      orderIdBytes, buyerAddress, sellerAddress, tokenAddress, amountWei,
      { value: amountWei }
    );
    const receipt = await lockTx.wait();
    return receipt.hash;
  } else {
    // ERC-20
    const erc20Buyer = new ethers.Contract(tokenAddress, ERC20_ABI, buyerWallet);
    const erc20Admin = new ethers.Contract(tokenAddress, ERC20_ABI, adminWallet);

    // Step 1: Buyer transfers tokens to admin wallet
    const transferTx = await erc20Buyer.transfer(adminWallet.address, amountWei);
    await transferTx.wait();

    // Step 2: Admin approves escrow contract to pull those tokens
    const approveTx = await erc20Admin.approve(ESCROW_CONTRACT_ADDRESS, amountWei);
    await approveTx.wait();

    // Step 3: Admin calls lockFunds — contract pulls tokens from admin
    const contract = getEscrowContract();
    const lockTx = await contract.lockFunds(
      orderIdBytes, buyerAddress, sellerAddress, tokenAddress, amountWei
    );
    const receipt = await lockTx.wait();
    return receipt.hash;
  }
}

/**
 * Admin approves a stage (1, 2, or 3).
 * This credits the seller's claimable balance inside the contract.
 * The seller must separately call sellerWithdraw() to receive funds.
 */
async function triggerEscrowRelease(orderId, stage) {
  if (!isEscrowDeployed()) {
    console.warn(`[Escrow] Contract not deployed — skipping approveStage(${stage})`);
    return MOCK_TX;
  }

  if (stage < 1 || stage > 3) throw new Error('Invalid stage: must be 1, 2, or 3');

  const contract = getEscrowContract();
  const orderIdBytes = ethers.id(orderId);
  const tx = await contract.approveStage(orderIdBytes, stage);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Admin refunds all remaining locked (unapproved) funds to the buyer.
 * Any already-approved seller amounts remain claimable by the seller.
 */
async function triggerEscrowRefund(orderId) {
  if (!isEscrowDeployed()) {
    console.warn('[Escrow] Contract not deployed — skipping refundBuyer');
    return MOCK_TX;
  }

  const contract = getEscrowContract();
  const orderIdBytes = ethers.id(orderId);
  const tx = await contract.refundBuyer(orderIdBytes);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Admin resolves a dispute: sellerShare goes to seller's claimable balance,
 * the rest is refunded to the buyer immediately.
 */
async function triggerDisputeResolve(orderId, sellerShare) {
  if (!isEscrowDeployed()) {
    console.warn('[Escrow] Contract not deployed — skipping resolveDispute');
    return MOCK_TX;
  }

  const contract = getEscrowContract();
  const orderIdBytes = ethers.id(orderId);
  const sellerShareWei = ethers.parseEther(sellerShare.toString());
  const tx = await contract.resolveDispute(orderIdBytes, sellerShareWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Seller (or admin on their behalf) withdraws all approved-but-unclaimed funds for an order.
 * Since Vendly uses custodial wallets, the admin signs this transaction using the seller's
 * stored private key so the seller doesn't need to interact with the chain directly.
 */
async function triggerSellerWithdraw(orderId, sellerPrivateKey) {
  if (!isEscrowDeployed()) {
    console.warn('[Escrow] Contract not deployed — skipping sellerWithdraw');
    return MOCK_TX;
  }

  const sellerWallet = new ethers.Wallet(sellerPrivateKey, getProvider());
  const contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, sellerWallet);
  const orderIdBytes = ethers.id(orderId);
  const tx = await contract.sellerWithdraw(orderIdBytes);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Returns how much a seller can currently withdraw for a given order.
 */
async function getSellerClaimable(orderId) {
  if (!isEscrowDeployed()) return '0';
  const contract = getEscrowContract();
  const orderIdBytes = ethers.id(orderId);
  const wei = await contract.getSellerClaimable(orderIdBytes);
  return ethers.formatEther(wei);
}

module.exports = {
  TOKENS,
  generateWallet,
  getBalances,
  transferTokens,
  lockEscrowFunds,
  triggerEscrowRelease,
  triggerSellerWithdraw,
  triggerEscrowRefund,
  triggerDisputeResolve,
  getSellerClaimable
};
