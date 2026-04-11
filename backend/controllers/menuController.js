const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { MenuItem, MenuCategory } = require("../models");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  const q = String(req.query.search || "").trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    where.$or = [{ name: rx }, { description: rx }, { category: rx }];
  }
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  const [items, total] = await Promise.all([MenuItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), MenuItem.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.create = async (req, res) => {
  const payload = {
    ...req.body,
    price: Number(req.body.price || 0),
    kitchenRequired: req.body.kitchenRequired === 'true' || req.body.kitchenRequired === true,
    image: req.file ? `/uploads/menu/${req.file.filename}` : req.body.image || '',
  };
  const row = await MenuItem.create(payload);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.update = async (req, res) => {
  const payload = {};
  if (req.body.name !== undefined) payload.name = req.body.name;
  if (req.body.price !== undefined) payload.price = Number(req.body.price || 0);
  if (req.body.category !== undefined) payload.category = req.body.category;
  if (req.body.description !== undefined) payload.description = req.body.description;
  if (req.body.kitchenRequired !== undefined) payload.kitchenRequired = req.body.kitchenRequired === 'true' || req.body.kitchenRequired === true;
  if (req.body.image !== undefined) payload.image = req.body.image;
  if (req.file) {
    payload.image = `/uploads/menu/${req.file.filename}`;
  }
  const row = await MenuItem.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json({ ...row.toObject(), id: String(row._id) });
};

exports.remove = async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

exports.categories = async (req, res) => {
  const [menuCategories, customCategories] = await Promise.all([
    MenuItem.find().select('category').lean(),
    MenuCategory.find().select('name').lean(),
  ]);
  
  const fromMenu = Array.from(new Set(menuCategories.map(item => item.category).filter(Boolean)));
  const custom = customCategories.map(c => c.name);
  const all = Array.from(new Set([...fromMenu, ...custom]));
  
  res.json({ categories: all.sort() });
};

exports.addCategory = async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name required' });
  }
  
  const trimmed = String(name).trim();
  try {
    const existing = await MenuCategory.findOne({ name: trimmed });
    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    
    const category = await MenuCategory.create({ name: trimmed });
    res.status(201).json({ id: String(category._id), name: category.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
