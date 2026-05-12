require("dotenv").config();

const mongoose = require("mongoose");

const isProd = process.env.NODE_ENV === "production";
const mongoUri =
  process.env.MONGODB_URI ||
  (isProd ? null : "mongodb://127.0.0.1:27017/sherazi_pos");
if (!mongoUri) {
  throw new Error("MONGODB_URI must be set in the environment for production.");
}

async function connectDb() {
  await mongoose.connect(mongoUri);
}

module.exports = { connectDb };
