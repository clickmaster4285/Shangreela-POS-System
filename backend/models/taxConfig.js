const mongoose = require("mongoose");

const taxConfigSchema = new mongoose.Schema(
  {
    salesTaxRate: Number,
    furtherTaxRate: Number,
    serviceChargeRate: Number,
    withholdingLabel: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxConfig", taxConfigSchema);
