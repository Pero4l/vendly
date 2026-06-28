const { Category } = require('../models');

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Digital Services', slug: 'digital-services' },
  { name: 'Apparel & Fashion', slug: 'apparel-fashion' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Health & Beauty', slug: 'health-beauty' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { name: 'Books & Media', slug: 'books-media' },
  { name: 'Art & Collectibles', slug: 'art-collectibles' },
];

async function listCategories(req, res, next) {
  try {
    let categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });

    // Auto-seed if empty
    if (categories.length === 0) {
      await Category.bulkCreate(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, isActive: true, sortOrder: i })));
      categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    }

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function seedCategories(req, res, next) {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOrCreate({ where: { slug: cat.slug }, defaults: { ...cat, isActive: true } });
    }
    const categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    res.status(200).json({ success: true, message: 'Categories seeded', data: categories });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCategories, seedCategories };
