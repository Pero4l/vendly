'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Admin User
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const adminUserId = 'a0000000-0000-0000-0000-000000000000';

    await queryInterface.bulkInsert('users', [{
      id: adminUserId,
      full_name: 'Vendly Admin',
      username: 'admin',
      email: 'admin@vendly.com',
      phone: '+10000000000',
      password_hash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      is_verified: true,
      email_verified: true,
      phone_verified: true,
      is_online: false,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 2. Seed Settings (Marketplace Settings, Escrow Configuration, Default Notification Types)
    await queryInterface.bulkInsert('settings', [
      {
        id: 'b0000000-0000-0000-0000-000000000000',
        key: 'marketplace_settings',
        value: JSON.stringify({
          site_name: 'Vendly Marketplace',
          support_email: 'support@vendly.com',
          allowed_tokens: ['CELO', 'cUSD', 'USDT', 'USDC']
        }),
        description: 'General configuration for the Vendly marketplace platform',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000000',
        key: 'escrow_settings',
        value: JSON.stringify({
          stage_1_release: 30,
          stage_2_release: 20,
          stage_3_release: 50
        }),
        description: 'Multi-stage release configuration percentages for smart-contract escrow',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'd0000000-0000-0000-0000-000000000000',
        key: 'default_notification_types',
        value: JSON.stringify({
          types: [
            'order_created',
            'order_paid',
            'order_shipped',
            'order_delivered',
            'order_disputed',
            'escrow_released',
            'wallet_deposit',
            'wallet_withdrawal'
          ]
        }),
        description: 'Supported notification event triggers within Vendly system',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 3. Seed Categories (Main Categories)
    const electronicsId = 'e1000000-0000-0000-0000-000000000000';
    const fashionId = 'e2000000-0000-0000-0000-000000000000';
    const homeLivingId = 'e3000000-0000-0000-0000-000000000000';

    await queryInterface.bulkInsert('categories', [
      {
        id: electronicsId,
        name: 'Electronics',
        slug: 'electronics',
        image: JSON.stringify({ url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661' }),
        parent_id: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: fashionId,
        name: 'Fashion',
        slug: 'fashion',
        image: JSON.stringify({ url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b' }),
        parent_id: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: homeLivingId,
        name: 'Home & Living',
        slug: 'home-living',
        image: JSON.stringify({ url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a' }),
        parent_id: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 4. Seed Sub Categories
    await queryInterface.bulkInsert('categories', [
      {
        id: 'e1100000-0000-0000-0000-000000000000',
        name: 'Phones & Tablets',
        slug: 'phones-tablets',
        image: null,
        parent_id: electronicsId,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'e1200000-0000-0000-0000-000000000000',
        name: 'Laptops & Computers',
        slug: 'laptops-computers',
        image: null,
        parent_id: electronicsId,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'e2100000-0000-0000-0000-000000000000',
        name: "Men's Wear",
        slug: 'mens-wear',
        image: null,
        parent_id: fashionId,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'e2200000-0000-0000-0000-000000000000',
        name: "Women's Wear",
        slug: 'womens-wear',
        image: null,
        parent_id: fashionId,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'e3100000-0000-0000-0000-000000000000',
        name: 'Furniture',
        slug: 'furniture',
        image: null,
        parent_id: homeLivingId,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'e3200000-0000-0000-0000-000000000000',
        name: 'Kitchenware',
        slug: 'kitchenware',
        image: null,
        parent_id: homeLivingId,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Delete seeded records in reverse dependency order
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('users', { id: 'a0000000-0000-0000-0000-000000000000' }, {});
  }
};
