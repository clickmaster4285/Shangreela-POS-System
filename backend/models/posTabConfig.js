const mongoose = require("mongoose");

const posTabConfigSchema = new mongoose.Schema(
  {
    slotId: String,
    name: String,
    deviceHint: String,
    linkedTerminal: String,
    active: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PosTabConfig", posTabConfigSchema);
