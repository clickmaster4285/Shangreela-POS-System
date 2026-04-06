const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    number: Number,
    name: String,
    seats: Number,
    floorKey: String,
    status: { type: String, default: "available" },
    currentOrder: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
