const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
  {
    itemId: String,
    itemName: String,
    action: String,
    quantity: Number,
    price: {
      type: Number,
      default: 0,
    },
    note: String,
    timestamp: String,
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
