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

// Performance Indexes
loyaltyMemberSchema.index({ phone: 1 }, { unique: true });
loyaltyMemberSchema.index({ name: 1 });

module.exports = mongoose.model("LoyaltyMember", loyaltyMemberSchema);
