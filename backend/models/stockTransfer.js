const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
    },
    fromLocation: {
      type: String,
      required: true,
      trim: true,
    },
    toLocation: {
      type: String,
      required: true,
      trim: true,
    },
    transferCategory: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unit: {
          type: String,
          required: true,
        },
        itemCategory: {
          type: String,
          trim: true,
        },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate transfer number with daily resetting sequence
stockTransferSchema.pre("save", async function (next) {
  if (this.isNew && !this.transferNumber) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Count transfers created today
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2); // YYMMDD
    const sequence = (count + 1).toString().padStart(3, "0");
    this.transferNumber = `TRF-${dateStr}-${sequence}`;
  }
  
  // Calculate total items count
  if (this.items && this.items.length > 0) {
    this.totalItems = this.items.length;
  }
  
  next();
});

// Indexes for efficient queries
stockTransferSchema.index({ transferNumber: 1 });
stockTransferSchema.index({ fromLocation: 1, toLocation: 1, transferDate: -1 });
stockTransferSchema.index({ status: 1, transferDate: -1 });
stockTransferSchema.index({ "items.itemId": 1 });

module.exports = mongoose.model("StockTransfer", stockTransferSchema);
