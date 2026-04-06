const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    minStock: Number,
    costPerUnit: Number,
    perishable: Boolean,
    expiryDate: String,
    supplier: String,
    lastRestocked: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
