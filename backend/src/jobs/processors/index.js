const { getWorkerClass, connection } = require('../queue');
const Worker = getWorkerClass();
const { ethers } = require('ethers');
const { Transaction, Wallet } = require('../../models');
const notificationService = require('../../services/notificationService');
const walletService = require('../../services/walletService');

const PROVIDER_URL = process.env.CELO_PROVIDER_URL || 'https://alfajores-forno.celo-testnet.org';
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

/**
 * Initializes the background workers.
 */
function startWorkers() {
  // Transaction monitor worker
  const txWorker = new Worker('tx-monitor', async (job) => {
    const { txHash, transactionId } = job.data;
    console.log(`[Worker] Verifying transaction: ${txHash} for ID: ${transactionId}`);

    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found on-chain yet');
      }

      const receipt = await tx.wait(1); // Wait for 1 confirmation
      
      const dbTx = await Transaction.findByPk(transactionId);
      if (!dbTx) return;

      if (receipt.status === 1) {
        dbTx.status = 'COMPLETED';
        await dbTx.save();

        // Notify user of successful tx
        const wallet = await Wallet.findByPk(dbTx.walletId);
        if (wallet) {
          await notificationService.notifyUser(
            wallet.userId,
            'Transaction Confirmed',
            `Your ${dbTx.type} of ${dbTx.amount} ${dbTx.token} has been successfully completed.`,
            'wallet_transfer'
          );
        }
      } else {
        dbTx.status = 'FAILED';
        await dbTx.save();
      }
    } catch (error) {
      console.error(`[Worker Error] Failed checking tx ${txHash}:`, error.message);
      throw error; // Let BullMQ retry
    }
  }, { connection });

  // Notification queue worker
  const notifWorker = new Worker('notifications', async (job) => {
    const { userId, title, message } = job.data;
    await notificationService.notifyUser(userId, title, message, 'info');
  }, { connection });

  // Wallet creation worker
  const walletWorker = new Worker('wallets', async (job) => {
    const { userId } = job.data;
    console.log(`[Worker] Creating wallet for user: ${userId}`);
    await walletService.createWalletForUser(userId);
  }, { connection });

  txWorker.on('completed', (job) => console.log(`[Worker] Transaction job completed: ${job.id}`));
  txWorker.on('failed', (job, err) => console.error(`[Worker] Transaction job failed: ${job.id}`, err));
  
  walletWorker.on('completed', (job) => console.log(`[Worker] Wallet creation job completed for user: ${job.data.userId}`));
  walletWorker.on('failed', (job, err) => console.error(`[Worker] Wallet creation job failed for user: ${job.data.userId}`, err));
}

module.exports = {
  startWorkers
};
