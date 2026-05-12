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

// Performance Indexes
tableSchema.index({ number: 1 }, { unique: true });
tableSchema.index({ floorKey: 1 });

module.exports = mongoose.model("Table", tableSchema);
