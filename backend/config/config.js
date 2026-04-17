const dotenv = require("dotenv");

dotenv.config();

const primary =
  process.env.Frontend_URL ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:8080";

const frontendOrigins = String(primary)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sherazi_pos",
  jwtSecret: process.env.JWT_SECRET || "development_secret",
  /** Single origin string (first of list) for legacy callers */
  frontendOrigin: frontendOrigins[0] || "http://localhost:8080",
  /** Same list Socket.IO uses — set `Frontend_URL` or `FRONTEND_ORIGIN` in `.env` */
  frontendOrigins,
};
