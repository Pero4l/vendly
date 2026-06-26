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
  'function releaseThirtyPercent(bytes32 orderId) external',
  'function releaseTwentyPercent(bytes32 orderId) external',
  'function releaseFinalFiftyPercent(bytes32 orderId) external',
  'function refundBuyer(bytes32 orderId, uint256 refundAmount) external',
  'function resolveDispute(bytes32 orderId, uint256 refundAmount) external',
  'function openDispute(bytes32 orderId) external'
];

const PROVIDER_URL = process.env.CELO_PROVIDER_URL || 'https://alfajores-forno.celo-testnet.org';
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

// Admin server wallet for signing escrow contract releases
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || ethers.ZeroAddress;
const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, adminWallet);

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
    const celoBalanceRaw = await provider.getBalance(address);
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
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
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
  const wallet = new ethers.Wallet(senderPrivateKey, provider);
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

/**
 * Performs admin-signed Escrow milestone release triggers.
 */
async function triggerEscrowRelease(orderId, stage) {
  if (ESCROW_CONTRACT_ADDRESS === ethers.ZeroAddress) {
    console.warn("Escrow contract address not configured, skipping blockchain transaction");
    return '0x_mock_tx_hash_for_development';
  }

  const orderIdBytes = ethers.id(orderId); // Hash UUID to bytes32
  let tx;
  
  if (stage === 1) {
    tx = await escrowContract.releaseThirtyPercent(orderIdBytes);
  } else if (stage === 2) {
    tx = await escrowContract.releaseTwentyPercent(orderIdBytes);
  } else if (stage === 3) {
    tx = await escrowContract.releaseFinalFiftyPercent(orderIdBytes);
  } else {
    throw new Error('Invalid release stage');
  }

  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Performs admin-signed Escrow refund to buyer.
 */
async function triggerEscrowRefund(orderId, amount) {
  if (ESCROW_CONTRACT_ADDRESS === ethers.ZeroAddress) {
    console.warn("Escrow contract address not configured, skipping blockchain transaction");
    return '0x_mock_tx_hash_for_development';
  }

  const orderIdBytes = ethers.id(orderId);
  const amountWei = ethers.parseEther(amount.toString());

  const tx = await escrowContract.refundBuyer(orderIdBytes, amountWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Performs admin-signed Escrow dispute resolution.
 */
async function triggerDisputeResolve(orderId, refundAmount) {
  if (ESCROW_CONTRACT_ADDRESS === ethers.ZeroAddress) {
    console.warn("Escrow contract address not configured, skipping blockchain transaction");
    return '0x_mock_tx_hash_for_development';
  }

  const orderIdBytes = ethers.id(orderId);
  const refundWei = ethers.parseEther(refundAmount.toString());

  const tx = await escrowContract.resolveDispute(orderIdBytes, refundWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

module.exports = {
  TOKENS,
  generateWallet,
  getBalances,
  transferTokens,
  triggerEscrowRelease,
  triggerEscrowRefund,
  triggerDisputeResolve
};
