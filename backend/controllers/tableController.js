const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Table } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Table.find({}).sort({ number: 1 }).skip(skip).limit(limit).lean(),
    Table.countDocuments({}),
  ]);
  res.set("Cache-Control", "no-store");
  res.json(
    buildPaginatedResponse({
      items: rows.map((t) => ({
        id: String(t._id),
        number: t.number,
        name: t.name,
        seats: t.seats,
        floorKey: t.floorKey,
        status: t.status,
        currentOrder: t.currentOrder || "",
      })),
      total,
      page,
      limit,
    })
  );
};

exports.create = async (req, res) => {
  const row = await Table.create(req.body || {});
  res.status(201).json({ id: String(row._id) });
};

exports.update = async (req, res) => {
  const row = await Table.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  res.json({ id: String(row._id) });
};

exports.remove = async (req, res) => {
  await Table.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

exports.createBulk = async (req, res) => {
  const tables = req.body?.tables || [];
  if (!Array.isArray(tables) || tables.length === 0) {
    return res.status(400).json({ error: "Tables array is required" });
  }

  const created = [];
  for (const table of tables) {
    const { number, name, seats, floorKey, status } = table;
    if (!number || !name || !seats || !floorKey) {
      return res.status(400).json({ error: "Each table must include number, name, seats, and floorKey" });
    }
    const existing = await Table.findOne({ number });
    if (existing) {
      return res.status(409).json({ error: `Table ${number} already exists` });
    }
    const newTable = await Table.create({ number, name, seats, floorKey, status: status || "available" });
    created.push({ id: String(newTable._id), number, name });
  }

  res.status(201).json({ created });
};

exports.removeBulk = async (req, res) => {
  const ids = req.body?.ids || [];
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "IDs array is required" });
  }
  const result = await Table.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: result.deletedCount });
};
