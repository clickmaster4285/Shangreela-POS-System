const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");
const { User, Permission } = require("../models");

exports.getDemoAccounts = async (_req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).lean();
  res.json({
    items: users.map((u) => ({ name: u.name, email: u.email, role: u.role })),
    note: "Passwords: super123, hassaan123, fahad123, cashier123",
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  const normalized = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  const ok = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid email or password" });
  const token = jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: "7d" });
  const permission = await Permission.findOne({ role: user.role }).lean();
  res.json({
    token,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" },
    permissions: permission || null,
  });
};

exports.me = async (req, res) => {
  res.json({
    user: { id: String(req.user._id), name: req.user.name, email: req.user.email, role: req.user.role, avatar: req.user.avatar || "" },
    permissions: req.currentPermissions,
  });
};
