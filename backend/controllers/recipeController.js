const { Recipe, InventoryItem } = require("../models");
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();
  const where = { isActive: true };

  if (search) {
    where.name = { $regex: search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    Recipe.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Recipe.countDocuments(where),
  ]);

  res.json(buildPaginatedResponse({
    items: items.map(i => ({ ...i, id: String(i._id) })),
    total,
    page,
    limit,
  }));
};

exports.getOne = async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate("ingredients.inventoryItem").lean();
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json({ ...recipe, id: String(recipe._id) });
};

exports.create = async (req, res) => {
  const { name, ingredients, description } = req.body;

  if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "Name and ingredients required" });
  }

  // Validate inventory items exist
  const validItems = await InventoryItem.find({ _id: { $in: ingredients.map(i => i.inventoryItem) } }).select("_id").lean();
  const validIds = new Set(validItems.map(v => String(v._id)));

  for (const ing of ingredients) {
    if (!validIds.has(String(ing.inventoryItem))) {
      return res.status(400).json({ error: `Invalid inventory item: ${ing.inventoryItem}` });
    }
  }

  const recipe = await Recipe.create({ name, ingredients, description: description || "" });
  res.status(201).json({ ...recipe.toObject(), id: String(recipe._id) });
};

exports.update = async (req, res) => {
  const { name, ingredients, description, isActive } = req.body;
  const payload = {};

  if (name !== undefined) payload.name = name;
  if (description !== undefined) payload.description = description;
  if (isActive !== undefined) payload.isActive = isActive;
  if (ingredients !== undefined) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Ingredients must be non-empty array" });
    }
    const validItems = await InventoryItem.find({ _id: { $in: ingredients.map(i => i.inventoryItem) } }).select("_id").lean();
    const validIds = new Set(validItems.map(v => String(v._id)));
    for (const ing of ingredients) {
      if (!validIds.has(String(ing.inventoryItem))) {
        return res.status(400).json({ error: `Invalid inventory item: ${ing.inventoryItem}` });
      }
    }
    payload.ingredients = ingredients;
  }

  const recipe = await Recipe.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json({ ...recipe.toObject(), id: String(recipe._id) });
};

exports.remove = async (req, res) => {
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json({ ok: true });
};

exports.getIngredients = async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate("ingredients.inventoryItem").lean();
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json({ ingredients: recipe.ingredients });
};