const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Delivery } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Delivery.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Delivery.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: rows.map((d) => ({ ...d, id: String(d._id) })),
      total,
      page,
      limit,
    })
  );
};

exports.create = async (req, res) => {
  const row = await Delivery.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.patchStatus = async (req, res) => {
  await Delivery.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ ok: true });
};
