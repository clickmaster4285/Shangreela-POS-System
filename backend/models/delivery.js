const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    orderId: String,
    customerName: String,
    phone: String,
    address: String,
    items: [String],
    total: Number,
    status: { type: String, default: "pending" },
    assignedRider: String,
    estimatedTime: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);
