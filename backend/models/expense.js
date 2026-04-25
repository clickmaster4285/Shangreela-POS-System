const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ["supplies", "utilities", "rent", "wages", "maintenance", "other"], required: true },
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["paid", "unpaid", "half"], default: "paid" },
    paidAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["cash", "bank", "others"], default: "cash" },
    paymentDate: { type: Date, required: true },
    notes: String,
    vendor: String,
    receiptFile: String,
  },
  { timestamps: true }
);

// Performance Indexes
expenseSchema.index({ category: 1 });
expenseSchema.index({ paymentDate: -1 });
expenseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
