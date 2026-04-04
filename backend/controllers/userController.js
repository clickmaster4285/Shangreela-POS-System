const bcrypt = require("bcryptjs");
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
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
  res.status(201).json({ id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" });
};

exports.remove = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
