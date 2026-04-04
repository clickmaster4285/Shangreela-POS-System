const mongoose = require("mongoose");

const fbrConfigSchema = new mongoose.Schema(
  {
    ntn: String,
    posId: String,
    sandbox: Boolean,
    linked: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("FbrConfig", fbrConfigSchema);
