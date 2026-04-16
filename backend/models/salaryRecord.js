const mongoose = require("mongoose");

const salaryRecordSchema = new mongoose.Schema(
  {
    employeeId: String,
    month: String,
    baseSalary: Number,
    bonus: Number,
    deductions: Number,
    lateFines: Number,
    netSalary: Number,
    status: String,
    paidOn: String,
  },
  { timestamps: true }
);

// Performance Indexes
salaryRecordSchema.index({ employeeId: 1, month: -1 });
salaryRecordSchema.index({ month: -1 });

module.exports = mongoose.model("SalaryRecord", salaryRecordSchema);
