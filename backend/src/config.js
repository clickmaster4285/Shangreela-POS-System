const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sherazi_pos",
  jwtSecret: process.env.JWT_SECRET || "development_secret",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:8080",
  superadminName: process.env.SUPERADMIN_NAME || "Superadmin",
  superadminEmail: process.env.SUPERADMIN_EMAIL || "superadmin@shirazre.com",
  superadminPassword: process.env.SUPERADMIN_PASSWORD || "super123",
  superadminRole: process.env.SUPERADMIN_ROLE || "superadmin",
};
