'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Users Table
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      username: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      email: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      phone: { type: Sequelize.STRING(20), unique: true, allowNull: true },
      password_hash: { type: Sequelize.TEXT, allowNull: false },
      profile_image: { type: Sequelize.JSONB, allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      role: { type: Sequelize.ENUM('buyer', 'seller', 'admin'), defaultValue: 'buyer', allowNull: false },
      status: { type: Sequelize.ENUM('active', 'suspended', 'banned'), defaultValue: 'active', allowNull: false },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      email_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      phone_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      store_profile_id: { type: Sequelize.UUID, allowNull: true },
      is_online: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      last_seen_at: { type: Sequelize.DATE, allowNull: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 2. Store Profiles Table
    await queryInterface.createTable('store_profiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      display_name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      logo: { type: Sequelize.JSONB, allowNull: true },
      banner: { type: Sequelize.JSONB, allowNull: true },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      rating: { type: Sequelize.DECIMAL(3, 2), defaultValue: 0, allowNull: false },
      total_sales: { type: Sequelize.BIGINT, defaultValue: 0, allowNull: false },
      total_products: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      total_reviews: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 3. Stores Table
    await queryInterface.createTable('stores', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      store_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store_profiles', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active', allowNull: false },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 4. Wallets Table
    await queryInterface.createTable('wallets', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      username: { type: Sequelize.STRING(50), allowNull: true },
      address: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      encrypted_private_key: { type: Sequelize.TEXT, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. Categories Table
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      slug: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      image: { type: Sequelize.JSONB, allowNull: true },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onDelete: 'SET NULL'
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 6. Products Table
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'stores', key: 'id' },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'RESTRICT'
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      sku: { type: Sequelize.STRING(100), allowNull: true },
      images: { type: Sequelize.JSONB, allowNull: true },
      price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      quantity: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      weight: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      featured: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      views_count: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      average_rating: { type: Sequelize.DECIMAL(3, 2), defaultValue: 0, allowNull: false },
      total_reviews: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      status: { type: Sequelize.ENUM('draft', 'active', 'out_of_stock', 'suspended', 'deleted'), defaultValue: 'draft', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 7. Addresses Table
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      label: { type: Sequelize.ENUM('HOME', 'OFFICE', 'FAMILY', 'FRIEND', 'OTHER'), defaultValue: 'HOME', allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      country: { type: Sequelize.STRING(100), allowNull: false },
      state: { type: Sequelize.STRING(100), allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },
      address_line_1: { type: Sequelize.STRING(255), allowNull: false },
      address_line_2: { type: Sequelize.STRING(255), allowNull: true },
      postal_code: { type: Sequelize.STRING(50), allowNull: true },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Orders Table
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      escrow_id: { type: Sequelize.UUID, allowNull: true },
      tracking_id: { type: Sequelize.UUID, allowNull: true },
      order_number: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      shipping_address: { type: Sequelize.JSONB, allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      shipping_fee: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      payment_method: { type: Sequelize.STRING(50), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded'),
        defaultValue: 'pending',
        allowNull: false
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. Order Items Table
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'RESTRICT'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      total_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 10. Escrows Table
    await queryInterface.createTable('escrows', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      released_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0.00, allowNull: false },
      remaining_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0.00, allowNull: false },
      stage: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
      status: {
        type: Sequelize.ENUM('active', 'released', 'completed', 'refunded', 'disputed'),
        defaultValue: 'active',
        allowNull: false
      },
      contract_tx_hash: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 11. Transactions Table
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'wallets', key: 'id' },
        onDelete: 'CASCADE'
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'orders', key: 'id' },
        onDelete: 'SET NULL'
      },
      escrow_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'escrows', key: 'id' },
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('deposit', 'purchase', 'escrow_release', 'withdrawal', 'refund', 'transfer'),
        allowNull: false
      },
      token: { type: Sequelize.STRING(50), allowNull: false },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tx_hash: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 12. Withdrawals Table
    await queryInterface.createTable('withdrawals', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      token: { type: Sequelize.STRING(50), allowNull: false },
      wallet_address: { type: Sequelize.STRING(255), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'processing', 'completed', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 13. Reviews Table
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 14. Disputes Table
    await queryInterface.createTable('disputes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      reason: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      evidence: { type: Sequelize.JSONB, allowNull: true },
      resolution: { type: Sequelize.TEXT, allowNull: true },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('open', 'under_review', 'resolved', 'rejected'),
        defaultValue: 'open',
        allowNull: false
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 15. Tracking Table
    await queryInterface.createTable('tracking', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      tracking_number: { type: Sequelize.STRING(255), allowNull: false },
      courier_name: { type: Sequelize.STRING(255), allowNull: false },
      current_status: { type: Sequelize.STRING(100), allowNull: false },
      estimated_delivery_date: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 16. Tracking Events Table
    await queryInterface.createTable('tracking_events', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      tracking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tracking', key: 'id' },
        onDelete: 'CASCADE'
      },
      status: { type: Sequelize.STRING(100), allowNull: false },
      location: { type: Sequelize.STRING(255), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 17. Notifications Table
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING(100), allowNull: true },
      reference_type: { type: Sequelize.STRING(100), allowNull: true },
      reference_id: { type: Sequelize.UUID, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 18. Favorites Table
    await queryInterface.createTable('favorites', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 19. Conversations Table
    await queryInterface.createTable('conversations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      type: { type: Sequelize.ENUM('buyer_seller', 'support'), defaultValue: 'buyer_seller', allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'orders', key: 'id' },
        onDelete: 'SET NULL'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'products', key: 'id' },
        onDelete: 'SET NULL'
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      support_agent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      last_message_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 20. Conversation Participants Table
    await queryInterface.createTable('conversation_participants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      role: { type: Sequelize.STRING(50), allowNull: false },
      joined_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 21. Messages Table
    await queryInterface.createTable('messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      message: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: Sequelize.JSONB, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 22. Admin Actions Table
    await queryInterface.createTable('admin_actions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      action: { type: Sequelize.STRING(255), allowNull: false },
      target_type: { type: Sequelize.STRING(100), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 23. Settings Table
    await queryInterface.createTable('settings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      key: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      value: { type: Sequelize.JSONB, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to handle foreign keys
    await queryInterface.dropTable('settings');
    await queryInterface.dropTable('admin_actions');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversation_participants');
    await queryInterface.dropTable('conversations');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('tracking_events');
    await queryInterface.dropTable('tracking');
    await queryInterface.dropTable('disputes');
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('withdrawals');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('escrows');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('wallets');
    await queryInterface.dropTable('stores');
    await queryInterface.dropTable('store_profiles');
    await queryInterface.dropTable('users');

    // Drop native enums if they exist (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_stores_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_addresses_label";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_escrows_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_withdrawals_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_disputes_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_conversations_type";');
  }
};
