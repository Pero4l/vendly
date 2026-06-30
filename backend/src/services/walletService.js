const { Wallet, Transaction } = require('../models');
const celoService = require('../blockchain/celoService');
const encryption = require('../utils/encryption');

/**
 * Creates and encrypts a Celo wallet for a user.
 */
async function createWalletForUser(userId, username) {
  // Prevent duplicate wallet creation
  const existing = await Wallet.findOne({ where: { userId } });
  if (existing) return existing;

  const celoWallet = celoService.generateWallet();
  const encryptedKey = encryption.encrypt(celoWallet.privateKey);

  const wallet = await Wallet.create({
    userId,
    username: username || null,
    address: celoWallet.address,
    encryptedPrivateKey: encryptedKey,
    isActive: true
  });

  return wallet;
}

/**
 * Retrieves a user's wallet with decrypted credentials and updates balances from the blockchain.
 */
async function getUserWallet(userId) {
  const wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) throw new Error('Wallet not found');

  // Decrypt private key
  const privateKey = encryption.decrypt(wallet.encryptedPrivateKey);

  // CELO balance is always sourced from DB (admin-controlled, purchase-deducted).
  // Other token balances come from the blockchain.
  let cUSD = 0, USDT = 0, USDC = 0;
  try {
    const onChain = await celoService.getBalances(wallet.address);
    cUSD = parseFloat(onChain.cUSD || '0');
    USDT = parseFloat(onChain.USDT || '0');
    USDC = parseFloat(onChain.USDC || '0');
  } catch { /* use zeros */ }

  const balances = {
    CELO: parseFloat(wallet.celoBalance || '0'),
    cUSD,
    USDT,
    USDC
  };

  return {
    id: wallet.id,
    address: wallet.address,
    privateKey,
    balances
  };
}

/**
 * Signs and broadcasts a transaction using the user's encrypted private key.
 */
async function transferUserFunds(userId, receiverAddress, tokenSymbol, amount) {
  const userWallet = await getUserWallet(userId);
  
  // Register pending transaction in DB
  const dbTx = await Transaction.create({
    walletId: userWallet.id,
    type: 'TRANSFER',
    token: tokenSymbol,
    amount,
    status: 'PENDING',
    senderAddress: userWallet.address,
    receiverAddress
  });

  try {
    const txHash = await celoService.transferTokens(
      userWallet.privateKey,
      receiverAddress,
      tokenSymbol,
      amount
    );

    dbTx.status = 'COMPLETED';
    dbTx.txHash = txHash;
    await dbTx.save();

    return dbTx;
  } catch (error) {
    dbTx.status = 'FAILED';
    await dbTx.save();
    throw error;
  }
}

module.exports = {
  createWalletForUser,
  getUserWallet,
  transferUserFunds
};
