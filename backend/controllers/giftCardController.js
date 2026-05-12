const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { GiftCard } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    GiftCard.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GiftCard.countDocuments({}),
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((r) => ({ ...r, id: String(r._id) })), total, page, limit }));
};

exports.create = async (req, res) => {
  const row = await GiftCard.create(req.body || {});
  emitPosChange(["giftcards"]);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.redeem = async (req, res) => {
  const amount = Number(req.body.amount || 0);
  const row = await GiftCard.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Gift card not found" });
  row.balance = Math.max(0, Number(row.balance || 0) - amount);
  if (row.balance === 0) row.status = "redeemed";
  await row.save();
  emitPosChange(["giftcards"]);
  res.json({ ok: true, balance: row.balance, status: row.status });
};
