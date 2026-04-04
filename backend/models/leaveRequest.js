const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: String,
    type: String,
    startDate: String,
    endDate: String,
    reason: String,
    status: String,
    appliedOn: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
