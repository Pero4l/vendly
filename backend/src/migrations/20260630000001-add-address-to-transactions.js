'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'sender_address', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'escrow_id'
    });
    await queryInterface.addColumn('transactions', 'receiver_address', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'sender_address'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('transactions', 'sender_address');
    await queryInterface.removeColumn('transactions', 'receiver_address');
  }
};
