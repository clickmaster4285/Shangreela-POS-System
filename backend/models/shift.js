const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    label: String,
    start: String,
    end: String,
    supervisorName: String,
    staffCount: Number,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shift", shiftSchema);
