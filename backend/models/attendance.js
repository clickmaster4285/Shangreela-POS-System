const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: String,
    date: String,
    checkIn: String,
    checkOut: String,
    status: String,
    hoursWorked: Number,
    lateMinutes: Number,
  },
  { timestamps: true }
);

// Performance Indexes
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
