'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'quality', {
      type: Sequelize.ENUM('new', 'neatly_used', 'old_used'),
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'quality');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_quality";');
  }
};
