const { Store, StoreProfile, User, Product, sequelize } = require('../models');

async function generateUniqueStoreSlug(name) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
  let existing = await Store.findOne({ where: { slug } });
  let counter = 1, uniqueSlug = slug;
  while (existing) {
    uniqueSlug = `${slug}-${counter++}`;
    existing = await Store.findOne({ where: { slug: uniqueSlug } });
  }
  return uniqueSlug;
}

async function applyVendor(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    // Accept both `name` and `displayName` from frontend
    const displayName = req.body.displayName || req.body.name;
    const { description, logo, banner } = req.body;

    if (!displayName) {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }

    const user = await User.findByPk(req.user.id, { transaction });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if already has a store
    const existingProfile = await StoreProfile.findOne({ where: { userId: user.id }, transaction });
    if (existingProfile) {
      const existingStore = await Store.findOne({ where: { storeProfileId: existingProfile.id }, transaction });
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You already have a store',
        data: { store: existingStore, storeProfile: existingProfile }
      });
    }

    if (user.role === 'admin') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Admin accounts cannot create stores' });
    }

    const logoJson = logo ? (typeof logo === 'string' ? { url: logo } : logo) : null;
    const bannerJson = banner ? (typeof banner === 'string' ? { url: banner } : banner) : null;

    const storeProfile = await StoreProfile.create({
      userId: user.id,
      displayName,
      description,
      logo: logoJson,
      banner: bannerJson,
      isVerified: false,
      rating: 0,
      totalSales: 0,
      totalProducts: 0,
      totalReviews: 0
    }, { transaction });

    const slug = await generateUniqueStoreSlug(displayName);
    const store = await Store.create({
      storeProfileId: storeProfile.id,
      name: displayName,
      slug,
      description,
      status: 'active',
      isVerified: false
    }, { transaction });

    await user.update({ role: 'seller', storeProfileId: storeProfile.id }, { transaction });
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Store created! You are now a verified seller.',
      data: { store, storeProfile }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getStore(req, res, next) {
  try {
    const storeProfile = await StoreProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: Store, as: 'store' }]
    });

    if (!storeProfile || !storeProfile.store) {
      return res.status(404).json({ success: false, message: 'No store found. Apply to become a vendor first.' });
    }

    // Return a flat structure that's easy to use on the frontend
    res.status(200).json({
      success: true,
      data: {
        id: storeProfile.store.id,
        name: storeProfile.store.name,
        slug: storeProfile.store.slug,
        description: storeProfile.store.description,
        status: storeProfile.store.status,
        isVerified: storeProfile.store.isVerified,
        logo: storeProfile.logo,
        banner: storeProfile.banner,
        rating: storeProfile.rating,
        totalSales: storeProfile.totalSales,
        totalProducts: storeProfile.totalProducts,
        storeProfileId: storeProfile.id
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateStore(req, res, next) {
  try {
    const storeProfile = await StoreProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: Store, as: 'store' }]
    });
    if (!storeProfile || !storeProfile.store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const { name, description, logo, banner } = req.body;
    const logoJson = logo ? (typeof logo === 'string' ? { url: logo } : logo) : storeProfile.logo;
    const bannerJson = banner ? (typeof banner === 'string' ? { url: banner } : banner) : storeProfile.banner;

    await storeProfile.update({ displayName: name || storeProfile.displayName, description: description || storeProfile.description, logo: logoJson, banner: bannerJson });
    await storeProfile.store.update({ name: name || storeProfile.store.name, description: description || storeProfile.store.description });

    res.status(200).json({ success: true, message: 'Store updated', data: storeProfile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = { applyVendor, getStore, updateStore };
