const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    baseQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: [arr => arr.length > 0, "Recipe must have at least one ingredient"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster lookups
recipeSchema.index({ name: 1 });
recipeSchema.index({ isActive: 1 });

module.exports = mongoose.model("Recipe", recipeSchema);