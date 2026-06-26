const walletService = require('../services/walletService');
const { Wallet, Withdrawal, Transaction } = require('../models');
const celoService = require('../blockchain/celoService');

async function getBalance(req, res, next) {
  try {
    const data = await walletService.getUserWallet(req.user.id);
    // Return address and balance, omit private key for security in response
    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        address: data.address,
        balances: data.balances
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function transfer(req, res, next) {
  try {
    const { receiverAddress, token, amount } = req.body;
    if (!receiverAddress || !token || !amount) {
      return res.status(400).json({ success: false, message: 'Missing transfer parameters' });
    }

    const tx = await walletService.transferUserFunds(req.user.id, receiverAddress, token, amount);
    res.status(200).json({ success: true, message: 'Transfer executed successfully', data: tx });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function requestWithdrawal(req, res, next) {
  try {
    const { destinationAddress, token, amount } = req.body;
    if (!destinationAddress || !token || !amount) {
      return res.status(400).json({ success: false, message: 'Missing withdrawal parameters' });
    }

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    // Deduct and execute withdrawal.
    // For production, withdrawals might be audited or automated. Here we submit it as PENDING withdrawal
    const withdrawal = await Withdrawal.create({
      walletId: wallet.id,
      amount,
      token,
      destinationAddress,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted for approval',
      data: withdrawal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getHistory(req, res, next) {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const transactions = await Transaction.findAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBalance,
  transfer,
  requestWithdrawal,
  getHistory
};
