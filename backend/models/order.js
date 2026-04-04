const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["dine-in", "takeaway", "delivery"], required: true },
    status: { type: String, enum: ["pending", "preparing", "ready", "completed"], required: true },
    table: Number,
    customerName: String,
    notes: String,
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    items: [
      {
        quantity: Number,
        notes: String,
        requestId: String,
        requestAt: Date,
        menuItem: {
          id: String,
          name: String,
          price: Number,
          category: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
