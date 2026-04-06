const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
  {
    itemId: String,
    itemName: String,
    action: String,
    quantity: Number,
    note: String,
    timestamp: String,
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
