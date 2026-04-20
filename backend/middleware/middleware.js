const jwt = require("jsonwebtoken");
const { User, Permission } = require("../models");

const isProd = process.env.NODE_ENV === "production";
const jwtSecret =
  process.env.JWT_SECRET || (isProd ? null : "development_secret");
if (!jwtSecret) {
  throw new Error("JWT_SECRET must be set in the environment for production.");
}

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
  req.isSuperAdmin = req.user.role === "super-admin";
  next();
}

module.exports = { authRequired, attachPermissions };
