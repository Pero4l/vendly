'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('wallets', 'celo_balance', {
      type: Sequelize.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('wallets', 'celo_balance');
  }
};
