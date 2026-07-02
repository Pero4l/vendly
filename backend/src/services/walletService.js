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

  // All balances sourced from the blockchain — on-chain is the source of truth.
  let CELO = 0, cUSD = 0, USDT = 0, USDC = 0;
  try {
    const onChain = await celoService.getBalances(wallet.address);
    CELO = parseFloat(onChain.CELO || '0');
    cUSD = parseFloat(onChain.cUSD || '0');
    USDT = parseFloat(onChain.USDT || '0');
    USDC = parseFloat(onChain.USDC || '0');
    // Persist CELO balance to DB so it's always in sync
    if (parseFloat(wallet.celoBalance || '0') !== CELO) {
      await wallet.update({ celoBalance: CELO });
    }
  } catch { /* use zeros on RPC failure */ }

  const balances = { CELO, cUSD, USDT, USDC };

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
    type: 'transfer',
    token: tokenSymbol,
    amount,
    status: 'pending',
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

    dbTx.status = 'success';
    dbTx.txHash = txHash;
    await dbTx.save();

    return dbTx;
  } catch (error) {
    dbTx.status = 'failed';
    await dbTx.save();
    throw error;
  }
}

module.exports = {
  createWalletForUser,
  getUserWallet,
  transferUserFunds
};
