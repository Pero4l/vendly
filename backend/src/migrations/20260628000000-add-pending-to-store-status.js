'use strict';

module.exports = {
  async up(queryInterface) {
    // PostgreSQL cannot add enum values inside a transaction
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_stores_status" ADD VALUE IF NOT EXISTS 'pending';`
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_stores_status" ADD VALUE IF NOT EXISTS 'rejected';`
    );
  },

  async down(queryInterface) {
    // Removing enum values requires recreating the type; skip for safety
  }
};
