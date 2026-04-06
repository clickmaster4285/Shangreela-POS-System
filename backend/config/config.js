const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sherazi_pos",
  jwtSecret: process.env.JWT_SECRET || "development_secret",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:8080",
};
