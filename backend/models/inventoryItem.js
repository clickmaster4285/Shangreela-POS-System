const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    minStock: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    costPerUnit: {
      type: Number,
      default: 0,
    },
    perishable: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: String,
      default: null,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
    restockHistory: [
      {
        quantity: {
          type: Number,
          required: true,
        },
        costPerUnit: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        supplier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Supplier",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
inventoryItemSchema.index({ name: "text", category: 1 });
inventoryItemSchema.index({ category: 1, isActive: 1 });
inventoryItemSchema.index({ isActive: 1, createdAt: -1 });
inventoryItemSchema.index({ supplier: 1, isActive: 1 });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
