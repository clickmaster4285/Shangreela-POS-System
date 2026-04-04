const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema(
  {
    key: { type: String, index: true },
    name: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Floor", floorSchema);
