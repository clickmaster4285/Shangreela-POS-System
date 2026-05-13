const dotenv = require("dotenv");

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const primary =
  process.env.Frontend_URL ||
  process.env.FRONTEND_ORIGIN;

let frontendOrigins = String(primary)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (!frontendOrigins.length) {
  frontendOrigins = ["http://localhost:8080"];
}

const mongoUri =
  process.env.MONGODB_URI ||
  (isProd ? null : "mongodb://127.0.0.1:27017/sherazi_pos");
if (!mongoUri) {
  throw new Error("MONGODB_URI must be set in the environment for production.");
}

const jwtSecret = process.env.JWT_SECRET || (isProd ? null : "development_secret");
if (!jwtSecret) {
  throw new Error("JWT_SECRET must be set in the environment for production.");
}

const port = Number(process.env.PORT) || 5000;

module.exports = {
  port,
  mongoUri,
  jwtSecret,
  /** Single origin string (first of list) for legacy callers */
  frontendOrigin: frontendOrigins[0],
  /** CORS + Socket.IO — set `Frontend_URL` or `FRONTEND_ORIGIN` in `.env` (comma-separated for multiple) */
  frontendOrigins,
};
