const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: String,
    items: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
