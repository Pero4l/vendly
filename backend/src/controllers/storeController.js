const { Store, StoreProfile, User, sequelize } = require('../models');

/**
 * Helper to generate a unique slug for a store.
 */
async function generateUniqueStoreSlug(name) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = 'store';

  let existing = await Store.findOne({ where: { slug } });
  let counter = 1;
  let uniqueSlug = slug;
  while (existing) {
    uniqueSlug = `${slug}-${counter}`;
    existing = await Store.findOne({ where: { slug: uniqueSlug } });
    counter++;
  }
  return uniqueSlug;
}

/**
 * Handle buyer applying to become a seller/vendor.
 */
async function applyVendor(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const { displayName, description, logo, banner } = req.body;

    if (!displayName) {
      return res.status(400).json({ success: false, message: 'displayName is required' });
    }

    // Retrieve user and check role
    const user = await User.findByPk(req.user.id, { transaction });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'seller') {
      return res.status(400).json({ success: false, message: 'User is already a seller' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot apply to be sellers' });
    }

    // Format single image constraints: logo and banner can be strings or simple objects,
    // we enforce storing a single image reference.
    const logoJson = logo ? (typeof logo === 'string' ? { url: logo } : { url: logo.url }) : null;
    const bannerJson = banner ? (typeof banner === 'string' ? { url: banner } : { url: banner.url }) : null;

    // 1. Create Store Profile
    const storeProfile = await StoreProfile.create({
      userId: user.id,
      displayName,
      description,
      logo: logoJson,
      banner: bannerJson,
      isVerified: false,
      rating: 0.00,
      totalSales: 0,
      totalProducts: 0,
      totalReviews: 0
    }, { transaction });

    // 2. Generate slug and create Store
    const slug = await generateUniqueStoreSlug(displayName);
    const store = await Store.create({
      storeProfileId: storeProfile.id,
      name: displayName,
      slug,
      description,
      status: 'active', // Vendor accounts start active upon applying
      isVerified: false
    }, { transaction });

    // 3. Update User's role and link the store profile
    await user.update({
      role: 'seller',
      storeProfileId: storeProfile.id
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Vendor application approved. Your store is now active.',
      data: {
        store,
        storeProfile
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Retrieve the current seller's store and store profile details.
 */
async function getStore(req, res, next) {
  try {
    const storeProfile = await StoreProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: Store, as: 'store' }]
    });

    if (!storeProfile) {
      return res.status(404).json({ success: false, message: 'No store profile found for this user.' });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: storeProfile,
        store: storeProfile.store
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyVendor,
  getStore
};
