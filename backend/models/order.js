const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["dine-in", "takeaway", "delivery"], required: true },
    status: { type: String, enum: ["pending", "preparing", "ready", "served", "taken away", "completed", "cancelled"], required: true },
    table: Number,
    customerName: String,
    orderTaker: String,
    notes: String,
    subtotal: Number,
    tax: Number,
    discount: Number,
    gstAmount: Number,
    serviceCharge: Number,
    gstEnabled: { type: Boolean, default: true },
    paymentMethod: { type: String, enum: ["cash", "card", "easypesa"], default: "cash" },
    total: Number,
    items: [
      {
        quantity: Number,
        notes: String,
        requestId: String,
        requestAt: Date,
        extraName: String,
        extraPrice: Number,
        menuItem: {
          id: String,
          name: String,
          price: Number,
          category: String,
          kitchenRequired: { type: Boolean, default: true },
        },
      },
    ],
  },
  { timestamps: true }
);

// Performance Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ type: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ table: 1 });
orderSchema.index({ code: 1 }, { unique: true });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
