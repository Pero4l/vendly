const { ethers } = require('ethers');
require('dotenv').config();

// Token addresses on Celo Alfajores Testnet
const TOKENS = {
  CELO: ethers.ZeroAddress,
  cUSD: process.env.CUSD_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDT: process.env.USDT_ADDRESS || '0xe285ae699274f99090450b30ae585cd57ee2222b', // Mock/Standard
  USDC: process.env.USDC_ADDRESS || '0x2f37586574602f902d8f572a805c6d3d4b684534'  // Mock/Standard
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

const PROVIDER_URL = process.env.CELO_PROVIDER_URL || 'https://alfajores-forno.celo-testnet.org';
const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || ethers.ZeroAddress;

// All blockchain objects are lazy — created on first use, not at module load.
// Passing a static network avoids ethers auto-detecting chainId on startup (which spams logs if the RPC is unreachable).
let _provider = null;
let _adminWallet = null;
let _escrowContract = null;

function getProvider() {
  if (_provider) return _provider;
  _provider = new ethers.JsonRpcProvider(PROVIDER_URL, { chainId: 44787, name: 'celo-alfajores' });
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
async function lockEscrowFunds(orderId, buyerAddress, sellerAddress, tokenSymbol, amount) {
  if (!isEscrowDeployed()) {
    console.warn('[Escrow] Contract not deployed — skipping lockFunds');
    return MOCK_TX;
  }

  const contract = getEscrowContract();
  const orderIdBytes = ethers.id(orderId);
  const tokenAddress = TOKENS[tokenSymbol] ?? ethers.ZeroAddress;
  const amountWei = ethers.parseEther(amount.toString());

  let tx;
  if (tokenSymbol === 'CELO') {
    tx = await contract.lockFunds(orderIdBytes, buyerAddress, sellerAddress, tokenAddress, amountWei, { value: amountWei });
  } else {
    // For ERC-20 the admin wallet must have approved the contract first
    tx = await contract.lockFunds(orderIdBytes, buyerAddress, sellerAddress, tokenAddress, amountWei);
  }

  const receipt = await tx.wait();
  return receipt.hash;
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
  triggerEscrowRefund,
  triggerDisputeResolve,
  getSellerClaimable
};
