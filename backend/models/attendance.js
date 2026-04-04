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

module.exports = mongoose.model("Attendance", attendanceSchema);
