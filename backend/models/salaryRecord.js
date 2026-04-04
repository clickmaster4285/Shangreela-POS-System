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

module.exports = mongoose.model("SalaryRecord", salaryRecordSchema);
