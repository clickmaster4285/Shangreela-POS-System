const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    balance: Number,
    issued: String,
    status: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiftCard", giftCardSchema);
