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

// Performance Indexes
inventoryLogSchema.index({ itemId: 1 });
inventoryLogSchema.index({ createdAt: -1 });
inventoryLogSchema.index({ action: 1 });

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
