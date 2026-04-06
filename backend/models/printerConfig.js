const mongoose = require("mongoose");

const printerConfigSchema = new mongoose.Schema(
  {
    slotId: String,
    label: String,
    role: String,
    connection: String,
    address: String,
    enabled: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrinterConfig", printerConfigSchema);
