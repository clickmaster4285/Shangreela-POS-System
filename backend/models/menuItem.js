const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
    available: { type: Boolean, default: true },
    perishable: { type: Boolean, default: false },
    kitchenRequired: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Performance Indexes
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ name: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
