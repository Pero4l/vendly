const { Product, Store, StoreProfile, Category } = require('../models');
const { Op } = require('sequelize');

async function generateUniqueProductSlug(title) {
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
  let existing = await Product.findOne({ where: { slug } });
  let counter = 1, uniqueSlug = slug;
  while (existing) {
    uniqueSlug = `${slug}-${counter++}`;
    existing = await Product.findOne({ where: { slug: uniqueSlug } });
  }
  return uniqueSlug;
}

// Normalise images to always be [{url:'...'}] array stored as JSONB
function normaliseImages(images) {
  if (!images) return null;
  if (Array.isArray(images)) {
    return images.map(img => (typeof img === 'string' ? { url: img } : { url: img.url || img.imageUrl || '' }));
  }
  if (typeof images === 'string') return [{ url: images }];
  if (typeof images === 'object' && (images.url || images.imageUrl)) return [{ url: images.url || images.imageUrl }];
  return null;
}

async function createProduct(req, res, next) {
  try {
    const { title, description, price, quantity, categoryId, images, quality } = req.body;
    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'title and price are required' });
    }

    const storeProfile = await StoreProfile.findOne({ where: { userId: req.user.id } });
    if (!storeProfile) return res.status(400).json({ success: false, message: 'Apply for a vendor account first' });

    const store = await Store.findOne({ where: { storeProfileId: storeProfile.id } });
    if (!store) return res.status(400).json({ success: false, message: 'Store not found' });
    if (store.status === 'pending') return res.status(403).json({ success: false, message: 'Your store is pending admin approval. You can list products once approved.' });
    if (store.status === 'rejected') return res.status(403).json({ success: false, message: 'Your store application was rejected. Please contact support.' });
    if (store.status === 'suspended') return res.status(403).json({ success: false, message: 'Store is suspended' });

    // Resolve category: if categoryId not provided or looks like a number, find or use first available
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const firstCat = await Category.findOne({ where: { isActive: true } });
      if (!firstCat) return res.status(400).json({ success: false, message: 'No categories available. Seed categories first.' });
      resolvedCategoryId = firstCat.id;
    }

    const slug = await generateUniqueProductSlug(title);
    const VALID_QUALITIES = ['new', 'neatly_used', 'old_used'];
    const product = await Product.create({
      storeId: store.id,
      categoryId: resolvedCategoryId,
      title,
      description,
      price,
      quantity: quantity !== undefined ? parseInt(quantity) : 0,
      images: normaliseImages(images),
      slug,
      quality: VALID_QUALITIES.includes(quality) ? quality : null,
      status: 'active'
    });

    await storeProfile.increment('totalProducts');

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function listProducts(req, res, next) {
  try {
    const { search, categoryId, storeId, minPrice, maxPrice, minRating, sortBy, order } = req.query;
    const filter = { status: ['active', 'out_of_stock'] };

    if (search) filter[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
    if (categoryId) filter.categoryId = categoryId;
    if (storeId) filter.storeId = storeId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) filter.price[Op.lte] = parseFloat(maxPrice);
    }
    if (minRating) filter.averageRating = { [Op.gte]: parseFloat(minRating) };

    const products = await Product.findAll({
      where: filter,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [[sortBy || 'createdAt', order || 'DESC']]
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

async function getProductDetails(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'description', 'slug'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { title, description, price, quantity, status, categoryId, images, quality } = req.body;
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store', include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId'] }] }]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.store.storeProfile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const VALID_QUALITIES = ['new', 'neatly_used', 'old_used'];
    await product.update({
      title: title || product.title,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      quantity: quantity !== undefined ? parseInt(quantity) : product.quantity,
      categoryId: categoryId || product.categoryId,
      images: images !== undefined ? normaliseImages(images) : product.images,
      quality: quality !== undefined ? (VALID_QUALITIES.includes(quality) ? quality : null) : product.quality,
      status: status || product.status
    });

    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store', include: [{ model: StoreProfile, as: 'storeProfile' }] }]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.store.storeProfile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await product.destroy();
    // Decrement counter (floor at 0)
    const sp = product.store.storeProfile;
    if (sp && sp.totalProducts > 0) await sp.decrement('totalProducts');
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = { createProduct, listProducts, getProductDetails, updateProduct, deleteProduct };
