const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { Floor } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Floor.find({}).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Floor.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: rows.map((f) => ({ id: String(f._id), key: f.key, name: f.name })),
      total,
      page,
      limit,
    })
  );
};

exports.create = async (req, res) => {
  const row = await Floor.create({ key: req.body.key, name: req.body.name });
  emitPosChange(["floors", "tables"]);
  res.status(201).json({ id: String(row._id), key: row.key, name: row.name });
};

exports.update = async (req, res) => {
  const row = await Floor.findByIdAndUpdate(req.params.id, { name: req.body.name, key: req.body.key }, { new: true });
  emitPosChange(["floors", "tables"]);
  res.json({ id: String(row._id), key: row.key, name: row.name });
};

exports.remove = async (req, res) => {
  await Floor.findByIdAndDelete(req.params.id);
  emitPosChange(["floors", "tables"]);
  res.json({ ok: true });
};
