const { Wallet } = require('../models');
const celoService = require('../blockchain/celoService');

const SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds
let _timer = null;

async function syncAllWalletBalances() {
  try {
    const wallets = await Wallet.findAll({ where: { isActive: true } });
    if (!wallets.length) return;

    await Promise.allSettled(
      wallets.map(async (wallet) => {
        try {
          const onChain = await celoService.getBalances(wallet.address);
          const celoBalance = parseFloat(onChain.CELO || '0');
          if (parseFloat(wallet.celoBalance || '0') !== celoBalance) {
            await wallet.update({ celoBalance });
          }
        } catch {
          // Skip individual wallet on RPC error — don't crash the whole sync
        }
      })
    );
  } catch (err) {
    console.error('[BalanceSync] Failed to sync wallet balances:', err.message);
  }
}

function startBalanceSync() {
  if (_timer) return; // already running
  console.log('[BalanceSync] Starting wallet balance sync every 30 seconds.');
  // Run once immediately on startup, then every 30s
  syncAllWalletBalances();
  _timer = setInterval(syncAllWalletBalances, SYNC_INTERVAL_MS);
}

function stopBalanceSync() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

module.exports = { startBalanceSync, stopBalanceSync, syncAllWalletBalances };
