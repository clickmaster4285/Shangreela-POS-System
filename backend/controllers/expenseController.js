const fs = require('fs');
const path = require('path');
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { emitPosChange } = require("../utils/realtime");
const { Expense } = require("../models");

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  const storagePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
};

const normalizePaymentFields = ({ amount, paymentStatus, paidAmount }) => {
  const totalAmount = Math.max(0, Number(amount || 0));
  const status = ["paid", "unpaid", "half"].includes(String(paymentStatus)) ? String(paymentStatus) : "paid";

  let normalizedPaidAmount = Number(paidAmount);
  if (!Number.isFinite(normalizedPaidAmount)) {
    normalizedPaidAmount = status === "paid" ? totalAmount : 0;
  }
  normalizedPaidAmount = Math.max(0, Math.min(totalAmount, normalizedPaidAmount));

  if (status === "paid") normalizedPaidAmount = totalAmount;
  if (status === "unpaid") normalizedPaidAmount = 0;

  return { totalAmount, status, normalizedPaidAmount };
};

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.category && req.query.category !== "all") where.category = String(req.query.category);
  if (req.query.from) where.paymentDate = { $gte: new Date(req.query.from) };
  if (req.query.to) {
    const toDate = new Date(req.query.to);
    toDate.setDate(toDate.getDate() + 1);
    where.paymentDate = { ...where.paymentDate, $lt: toDate };
  }
  const [items, total] = await Promise.all([Expense.find(where).sort({ paymentDate: -1 }).skip(skip).limit(limit).lean(), Expense.countDocuments(where)]);
  res.json(
    buildPaginatedResponse({
      items: items.map((e) => ({ ...e, id: String(e._id) })),
      total,
      page,
      limit,
    })
  );
};

exports.create = async (req, res) => {
  const receiptFile = req.file ? `/uploads/expenses/${req.file.filename}` : req.body.receiptFile || "";
  const { totalAmount, status, normalizedPaidAmount } = normalizePaymentFields({
    amount: req.body.amount,
    paymentStatus: req.body.paymentStatus,
    paidAmount: req.body.paidAmount,
  });
  const row = await Expense.create({
    category: req.body.category || "other",
    title: req.body.title || req.body.description || "Untitled Expense",
    description: req.body.description || "",
    amount: totalAmount,
    paymentStatus: status,
    paidAmount: normalizedPaidAmount,
    paymentMethod: req.body.paymentMethod || "cash",
    paymentDate: req.body.paymentDate || new Date(),
    notes: req.body.notes || "",
    vendor: req.body.vendor || "",
    receiptFile,
  });
  emitPosChange(["expenses", "dashboard"]);
  res.status(201).json({ id: String(row._id), ok: true });
};

exports.getById = async (req, res) => {
  const row = await Expense.findById(req.params.id).lean();
  if (!row) return res.status(404).json({ message: "Expense not found" });
  res.json({ ...row, id: String(row._id) });
};

exports.update = async (req, res) => {
  const expense = await Expense.findById(req.params.id).lean();
  if (!expense) return res.status(404).json({ message: "Expense not found" });

  if (req.file) {
    if (expense.receiptFile) deleteFileIfExists(expense.receiptFile);
    req.body.receiptFile = `/uploads/expenses/${req.file.filename}`;
  }

  if (req.body.amount !== undefined || req.body.paymentStatus !== undefined || req.body.paidAmount !== undefined) {
    const { totalAmount, status, normalizedPaidAmount } = normalizePaymentFields({
      amount: req.body.amount !== undefined ? req.body.amount : expense.amount,
      paymentStatus: req.body.paymentStatus !== undefined ? req.body.paymentStatus : expense.paymentStatus,
      paidAmount: req.body.paidAmount !== undefined ? req.body.paidAmount : expense.paidAmount,
    });
    req.body.amount = totalAmount;
    req.body.paymentStatus = status;
    req.body.paidAmount = normalizedPaidAmount;
  }

  const row = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  emitPosChange(["expenses", "dashboard"]);
  res.json({ ...row, id: String(row._id) });
};

exports.delete = async (req, res) => {
  const row = await Expense.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ message: "Expense not found" });
  if (row.receiptFile) deleteFileIfExists(row.receiptFile);
  emitPosChange(["expenses", "dashboard"]);
  res.json({ ok: true });
};

exports.summary = async (req, res) => {
  const where = {};
  if (req.query.from) where.paymentDate = { $gte: new Date(req.query.from) };
  if (req.query.to) {
    const toDate = new Date(req.query.to);
    toDate.setDate(toDate.getDate() + 1);
    where.paymentDate = { ...where.paymentDate, $lt: toDate };
  }
  const stats = await Expense.aggregate([
    { $match: where },
    {
      $group: {
        _id: "$category",
        amount: { $sum: "$amount" },
        paidAmount: { $sum: "$paidAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byCategory = {};
  let total = 0;
  let totalPaid = 0;
  let count = 0;
  stats.forEach((s) => {
    byCategory[s._id] = s.amount;
    total += s.amount;
    totalPaid += s.paidAmount;
    count += s.count;
  });

  res.json({ total, totalPaid, totalUnpaid: total - totalPaid, byCategory, count });
};
