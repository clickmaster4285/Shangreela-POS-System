const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { Employee, Attendance, LeaveRequest, LeaveBalance, SalaryRecord, Shift } = require("../models");

exports.listEmployees = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.$or = [{ name: { $regex: String(req.query.search), $options: "i" } }, { employeeId: { $regex: String(req.query.search), $options: "i" } }];
  const [items, total] = await Promise.all([Employee.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Employee.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.createEmployee = async (req, res) => {
  const payload = {
    ...req.body,
    salary: Number(req.body.salary || 0),
    joinDate: req.body.joinDate || new Date().toISOString().slice(0, 10),
    avatar: req.file ? `/uploads/staff/${req.file.filename}` : req.body.avatar || undefined,
  };
  const row = await Employee.create(payload);
  await LeaveBalance.create({ employeeId: String(row._id), sick: 8, casual: 6, annual: 10, emergency: 2 });
  await SalaryRecord.create({
    employeeId: String(row._id),
    month: new Date().toISOString().slice(0, 7),
    baseSalary: row.salary || 0,
    bonus: 0,
    deductions: 0,
    lateFines: 0,
    netSalary: row.salary || 0,
    status: "pending",
  });
  emitPosChange(["hr", "dashboard"]);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.updateEmployee = async (req, res) => {
  const updateData = {
    ...req.body,
    salary: req.body.salary !== undefined ? Number(req.body.salary || 0) : undefined,
  };
  if (req.file) {
    updateData.avatar = `/uploads/staff/${req.file.filename}`;
  }
  const row = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
  if (!row) return res.status(404).json({ message: 'Employee not found' });
  emitPosChange(["hr", "dashboard"]);
  res.json({ ...row, id: String(row._id) });
};

exports.getAttendanceByDate = async (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const items = await Attendance.find({ date }).lean();
  res.json({ items: items.map((i) => ({ ...i, id: String(i._id) })) });
};

exports.listLeaves = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    LeaveRequest.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LeaveRequest.countDocuments({})
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.patchLeaveStatus = async (req, res) => {
  await LeaveRequest.findByIdAndUpdate(req.params.id, { status: req.body.status });
  emitPosChange(["hr"]);
  res.json({ ok: true });
};

exports.listLeaveBalances = async (_req, res) => {
  const rows = await LeaveBalance.find({}).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
};

exports.listSalary = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    SalaryRecord.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SalaryRecord.countDocuments({})
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

exports.patchSalary = async (req, res) => {
  const row = await SalaryRecord.findOne({ employeeId: req.params.employeeId });
  if (!row) return res.status(404).json({ message: "Salary row not found" });
  row.bonus = Number(req.body.bonus || 0);
  row.deductions = Number(req.body.deductions || 0);
  row.lateFines = Number(req.body.lateFines || 0);
  row.netSalary = row.baseSalary + row.bonus - row.deductions - row.lateFines;
  await row.save();
  emitPosChange(["hr"]);
  res.json({ ok: true });
};

exports.markSalaryPaid = async (req, res) => {
  await SalaryRecord.findOneAndUpdate({ employeeId: req.params.employeeId }, { status: "paid", paidOn: new Date().toISOString().slice(0, 10) });
  emitPosChange(["hr"]);
  res.json({ ok: true });
};

exports.listShifts = async (_req, res) => {
  const rows = await Shift.find({}).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
};
