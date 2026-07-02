'use strict';

// Postgres does not auto-index foreign key columns, and every hot lookup in the
// controllers (store/product/order/wallet/notification lookups) filters on these
// columns without an index, forcing a sequential scan as tables grow.
const INDEXES = [
  ['store_profiles', 'user_id'],
  ['stores', 'store_profile_id'],
  ['products', 'store_id'],
  ['products', 'category_id'],
  ['products', 'status'],
  ['orders', 'buyer_id'],
  ['orders', 'status'],
  ['order_items', 'order_id'],
  ['order_items', 'product_id'],
  ['order_items', 'seller_id'],
  ['escrows', 'order_id'],
  ['escrows', 'buyer_id'],
  ['escrows', 'seller_id'],
  ['wallets', 'user_id'],
  ['addresses', 'user_id'],
  ['transactions', 'wallet_id'],
  ['transactions', 'order_id'],
  ['notifications', 'user_id'],
  ['favorites', 'user_id'],
  ['favorites', 'product_id'],
  ['reviews', 'product_id'],
  ['reviews', 'seller_id'],
  ['disputes', 'order_id'],
  ['tracking', 'order_id'],
  ['tracking_events', 'tracking_id'],
  ['conversations', 'order_id'],
  ['conversations', 'buyer_id'],
  ['conversations', 'seller_id'],
  ['conversation_participants', 'conversation_id'],
  ['conversation_participants', 'user_id'],
  ['messages', 'conversation_id'],
  ['withdrawals', 'user_id'],
];

module.exports = {
  up: async (queryInterface) => {
    for (const [table, column] of INDEXES) {
      await queryInterface.addIndex(table, [column], {
        name: `${table}_${column}_idx`
      });
    }
  },

  down: async (queryInterface) => {
    for (const [table, column] of INDEXES) {
      await queryInterface.removeIndex(table, `${table}_${column}_idx`);
    }
  }
};
