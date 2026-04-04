const mongoose = require("mongoose");

const loyaltyMemberSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    points: Number,
    tier: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyMember", loyaltyMemberSchema);
