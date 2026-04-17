const bcrypt = require("bcryptjs");
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { User } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [users, total] = await Promise.all([
    User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, avatar: u.avatar || "" })),
      total,
      page,
      limit,
    })
  );
};

exports.create = async (req, res) => {
  const { name, email, role, password } = req.body || {};
  const passwordHash = await bcrypt.hash(String(password || ""), 10);
  const user = await User.create({ name, email: String(email || "").toLowerCase(), role, passwordHash });
  emitPosChange(["users"]);
  res.status(201).json({ id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" });
};

exports.remove = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  emitPosChange(["users"]);
  res.json({ ok: true });
};

exports.update = async (req, res) => {
  const { name, email, role, password } = req.body || {};
  const updateData = { name, email: String(email || "").toLowerCase(), role };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(String(password), 10);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  emitPosChange(["users"]);
  res.json({ id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" });
};
