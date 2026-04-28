const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { MenuItem, MenuCategory, Recipe } = require("../models");
const Fuse = require("fuse.js");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Cache for menu items to avoid repeated DB queries
let cachedMenuItems = null;
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

const getMenuItemsWithCache = async () => {
  const now = Date.now();
  if (!cachedMenuItems || (now - lastCacheTime) > CACHE_TTL) {
    cachedMenuItems = await MenuItem.find().lean();
    lastCacheTime = now;
  }
  return cachedMenuItems;
};

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const q = String(req.query.search || "").trim();
  const categoryFilter = req.query.category && req.query.category !== "All" ? String(req.query.category) : null;

  let items = [];
  let total = 0;

  // If no search query, use regular filtering
  if (!q) {
    const where = {};
    if (categoryFilter) where.category = categoryFilter;

    [items, total] = await Promise.all([
      MenuItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().populate("recipe"),
      MenuItem.countDocuments(where)
    ]);

    return res.json(buildPaginatedResponse({
      items: items.map((i) => ({ ...i, id: String(i._id) })),
      total,
      page,
      limit
    }));
  }

  // Fuzzy search with Fuse.js
  const allItems = await getMenuItemsWithCache();

  // Apply category filter first if specified
  let itemsToSearch = allItems;
  if (categoryFilter) {
    itemsToSearch = allItems.filter(item => item.category === categoryFilter);
  }

  const fuseOptions = {
    keys: ['name', 'description', 'category'],
    threshold: 0.4,
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
    includeMatches: true
  };

  const fuse = new Fuse(itemsToSearch, fuseOptions);
  const results = fuse.search(q);

  // Paginate results
  const start = skip;
  const end = start + limit;
  const paginatedResults = results.slice(start, end);

  const populated = await MenuItem.populate(paginatedResults.map(r => r.item), { path: "recipe" });

  res.json(buildPaginatedResponse({
    items: populated.map((item) => ({
      ...item,
      id: String(item._id),
      score: results.find(r => String(r.item._id) === String(item._id))?.score,
    })),
    total: results.length,
    page,
    limit
  }));
};

exports.create = async (req, res) => {
  const payload = {
    ...req.body,
    price: Number(req.body.price || 0),
    kitchenRequired: req.body.kitchenRequired === 'true' || req.body.kitchenRequired === true,
    image: req.file ? `/uploads/menu/${req.file.filename}` : req.body.image || '',
    recipe: req.body.recipe || null,
    scale: Number(req.body.scale || 1),
    ingredientOverrides: req.body.ingredientOverrides || [],
  };
  const row = await MenuItem.create(payload);
  // Invalidate cache
  cachedMenuItems = null;
  emitPosChange(["menu", "dashboard"]);
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
  if (req.body.recipe !== undefined) payload.recipe = req.body.recipe || null;
  if (req.body.scale !== undefined) payload.scale = Number(req.body.scale || 1);
  if (req.body.ingredientOverrides !== undefined) payload.ingredientOverrides = req.body.ingredientOverrides;

  const row = await MenuItem.findByIdAndUpdate(req.params.id, payload, { new: true }).populate("recipe");
  // Invalidate cache
  cachedMenuItems = null;
  emitPosChange(["menu", "dashboard"]);
  res.json({ ...row.toObject(), id: String(row._id) });
};

exports.remove = async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  // Invalidate cache
  cachedMenuItems = null;
  emitPosChange(["menu", "dashboard"]);
  res.json({ ok: true });
};

exports.categories = async (req, res) => {
  const [fromMenu, customCategories] = await Promise.all([
    MenuItem.distinct("category", { category: { $nin: [null, ""] } }),
    MenuCategory.find().select("name").lean(),
  ]);
  const custom = customCategories.map((c) => c.name);
  const all = Array.from(new Set([...(fromMenu || []).filter(Boolean), ...custom]));

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
    emitPosChange(["menu"]);
    res.status(201).json({ id: String(category._id), name: category.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};