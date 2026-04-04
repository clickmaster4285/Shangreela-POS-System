const mongoose = require("mongoose");

const mobileConfigSchema = new mongoose.Schema(
  {
    pairingToken: String,
    downloadUrl: String,
    features: [{ icon: String, title: String, text: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MobileConfig", mobileConfigSchema);
