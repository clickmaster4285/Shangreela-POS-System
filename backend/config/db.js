const mongoose = require("mongoose");
const { mongoUri } = require("./config");

async function connectDb() {
  await mongoose.connect(mongoUri);
}

module.exports = { connectDb };
