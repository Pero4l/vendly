const { Product, Store, StoreProfile, Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper to generate a unique slug for a product.
 */
async function generateUniqueProductSlug(title) {
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = 'product';

  let existing = await Product.findOne({ where: { slug } });
  let counter = 1;
  let uniqueSlug = slug;
  while (existing) {
    uniqueSlug = `${slug}-${counter}`;
    existing = await Product.findOne({ where: { slug: uniqueSlug } });
    counter++;
  }
  return uniqueSlug;
}

async function createProduct(req, res, next) {
  try {
    const { title, description, price, quantity, categoryId, images } = req.body;
    if (!title || !price || !categoryId) {
      return res.status(400).json({ success: false, message: 'Missing product parameters (title, price, and categoryId are required)' });
    }

    // Retrieve user's store
    const storeProfile = await StoreProfile.findOne({ where: { userId: req.user.id } });
    if (!storeProfile) {
      return res.status(400).json({ success: false, message: 'Please apply for a vendor account first' });
    }

    const store = await Store.findOne({ where: { storeProfileId: storeProfile.id } });
    if (!store) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }

    if (store.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Store profile is not active yet' });
    }

    // Enforce 1 single product image
    const imageJson = images ? (typeof images === 'string' ? { url: images } : { url: images.url }) : null;

    const slug = await generateUniqueProductSlug(title);

    const product = await Product.create({
      storeId: store.id,
      title,
      description,
      price,
      quantity: quantity || 0,
      categoryId,
      images: imageJson,
      slug,
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function listProducts(req, res, next) {
  try {
    const { search, categoryId, minPrice, maxPrice, sortBy, order } = req.query;

    const filter = { status: 'active' };

    if (search) {
      filter[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) filter.price[Op.lte] = parseFloat(maxPrice);
    }

    const sortField = sortBy || 'createdAt';
    const sortOrder = order || 'DESC';

    const products = await Product.findAll({
      where: filter,
      include: [
        { 
          model: Store, 
          as: 'store', 
          attributes: ['name', 'slug'],
          include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId'] }]
        },
        { model: Category, as: 'category', attributes: ['name'] }
      ],
      order: [[sortField, sortOrder]]
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
        { 
          model: Store, 
          as: 'store', 
          attributes: ['name', 'description', 'slug'],
          include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId', 'logo', 'banner'] }]
        },
        { model: Category, as: 'category', attributes: ['name'] }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { title, description, price, quantity, status, categoryId, images } = req.body;
    
    const product = await Product.findByPk(req.params.id, {
      include: [
        { 
          model: Store, 
          as: 'store',
          include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId'] }]
        }
      ]
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Validate ownership (check store's profile owner userId)
    if (product.store.storeProfile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized modification' });
    }

    // Enforce 1 single product image if provided
    const imageJson = images ? (typeof images === 'string' ? { url: images } : { url: images.url }) : product.images;

    await product.update({
      title: title || product.title,
      description: description || product.description,
      price: price || product.price,
      quantity: quantity !== undefined ? quantity : product.quantity,
      categoryId: categoryId || product.categoryId,
      images: imageJson,
      status: status || product.status
    });

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { 
          model: Store, 
          as: 'store',
          include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId'] }]
        }
      ]
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.store.storeProfile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized removal' });
    }

    await product.destroy();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProductDetails,
  updateProduct,
  deleteProduct
};
