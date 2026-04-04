const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { MenuItem } = require("../models");

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
