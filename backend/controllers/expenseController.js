const fs = require('fs');
const path = require('path');
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Expense } = require("../models");

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  const storagePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
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
  const row = await Expense.create({
    category: req.body.category || "other",
    description: req.body.description || "",
    amount: Number(req.body.amount || 0),
    paymentMethod: req.body.paymentMethod || "cash",
    paymentDate: req.body.paymentDate || new Date(),
    notes: req.body.notes || "",
    vendor: req.body.vendor || "",
    receiptFile,
  });
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

  const row = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ ...row, id: String(row._id) });
};

exports.delete = async (req, res) => {
  const row = await Expense.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ message: "Expense not found" });
  if (row.receiptFile) deleteFileIfExists(row.receiptFile);
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
  const expenses = await Expense.find(where).lean();
  const byCategory = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  res.json({ total: expenses.reduce((s, e) => s + e.amount, 0), byCategory, count: expenses.length });
};
