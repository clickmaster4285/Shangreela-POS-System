const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { InventoryItem, InventoryLog, Supplier } = require("../models");

exports.listItems = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  if (req.query.perishableOnly === "true") where.perishable = true;
  const [items, total] = await Promise.all([InventoryItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), InventoryItem.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.createItem = async (req, res) => {
  const row = await InventoryItem.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.adjustItem = async (req, res) => {
  const { action, quantity, note } = req.body || {};
  const item = await InventoryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  const qty = Math.max(0, Number(quantity || 0));
  if (action === "add") item.quantity += qty;
  else item.quantity = Math.max(0, item.quantity - qty);
  if (action === "add") item.lastRestocked = new Date().toISOString().slice(0, 10);
  await item.save();
  await InventoryLog.create({
    itemId: String(item._id),
    itemName: item.name,
    action: action === "add" ? "restocked" : action === "waste" ? "wasted" : "used",
    quantity: qty,
    note: note || "",
    timestamp: new Date().toISOString(),
    userId: String(req.user._id),
  });
  res.json({ ok: true });
};

exports.listLogs = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([InventoryLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), InventoryLog.countDocuments({})]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.listSuppliers = async (_req, res) => {
  const rows = await Supplier.find({}).lean();
  res.json({ items: rows.map((s) => ({ ...s, id: String(s._id) })) });
};
