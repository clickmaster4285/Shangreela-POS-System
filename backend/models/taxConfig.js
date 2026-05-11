const mongoose = require("mongoose");

const taxConfigSchema = new mongoose.Schema(
  {
    salesTaxRate: Number,
    serviceChargeRate: Number,
    takeawayChargeRate: Number,
    withholdingLabel: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxConfig", taxConfigSchema);
