const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { LoyaltyMember } = require("../models");

exports.listMembers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    LoyaltyMember.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LoyaltyMember.countDocuments({}),
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((r) => ({ ...r, id: String(r._id) })), total, page, limit }));
};

exports.createMember = async (req, res) => {
  const row = await LoyaltyMember.create(req.body || {});
  emitPosChange(["loyalty"]);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.patchPoints = async (req, res) => {
  const row = await LoyaltyMember.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Member not found" });
  row.points = Number(req.body.points || row.points || 0);
  await row.save();
  emitPosChange(["loyalty"]);
  res.json({ ok: true });
};
