const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");
const { User, Permission } = require("../models");

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  } catch (_err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

async function attachPermissions(req, res, next) {
  if (!req.user?.role) return next();
  const p = await Permission.findOne({ role: req.user.role }).lean();
  req.currentPermissions = p || null;
  next();
}

module.exports = { authRequired, attachPermissions };
