const mongoose = require("mongoose");

const paymentConfigSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: "" },
    accountTitle: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    iban: { type: String, default: "" },
    easypaisaNumber: { type: String, default: "" },
    easypaisaAccountName: { type: String, default: "" },
    bankQrImageUrl: { type: String, default: "" },
    easypaisaQrImageUrl: { type: String, default: "" },
    showBankOnReceipt: { type: Boolean, default: true },
    showEasypaisaOnReceipt: { type: Boolean, default: true },
    /** @deprecated use showBankOnReceipt / showEasypaisaOnReceipt */
    showOnReceipt: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentConfig", paymentConfigSchema);
