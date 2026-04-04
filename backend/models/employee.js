const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    name: String,
    phone: String,
    email: String,
    role: String,
    department: String,
    joinDate: String,
    salary: Number,
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
