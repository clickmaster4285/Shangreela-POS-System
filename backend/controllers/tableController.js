const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Table } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Table.find({}).sort({ number: 1 }).skip(skip).limit(limit).lean(),
    Table.countDocuments({}),
  ]);
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
