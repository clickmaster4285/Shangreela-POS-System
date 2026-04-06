const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { MenuItem, MenuCategory } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  const [items, total] = await Promise.all([MenuItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), MenuItem.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.create = async (req, res) => {
  const payload = req.body || {};
  const row = await MenuItem.create(payload);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.update = async (req, res) => {
  const row = await MenuItem.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
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
