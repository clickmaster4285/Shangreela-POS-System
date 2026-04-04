const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Order, Table } = require("../models");

const stampItemsForKitchen = (items, requestId, requestAt = new Date()) => {
  const list = Array.isArray(items) ? items : [];
  return list.map((item) => ({
    ...item,
    requestId,
    requestAt,
  }));
};

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.status && req.query.status !== "all") where.status = String(req.query.status);
  if (req.query.type && req.query.type !== "all") where.type = String(req.query.type);
  const [items, total] = await Promise.all([Order.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments(where)]);
  res.json(
    buildPaginatedResponse({
      items: items.map((o) => ({
        id: o.code,
        type: o.type,
        status: o.status,
        table: o.table,
        items: o.items || [],
        total: o.total,
        tax: o.tax,
        subtotal: o.subtotal,
        discount: o.discount,
        notes: o.notes || "",
        createdAt: o.createdAt,
        customerName: o.customerName || "",
        dbId: String(o._id),
      })),
      total,
      page,
      limit,
    })
  );
};

exports.patchStatus = async (req, res) => {
  const newStatus = String(req.body.status || "");
  if (newStatus === "completed") {
    return res.status(400).json({ message: "Order completion must be processed via payment on the billing panel." });
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ ok: true, id: String(order._id), status: order.status });
};

exports.create = async (req, res) => {
  const payload = req.body || {};
  const code = payload.code || `ORD-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date();
  const requestId = `${code}-R1`;
  const row = await Order.create({
    code,
    type: payload.type || "dine-in",
    status: payload.status || "pending",
    table: payload.table,
    customerName: payload.customerName || "",
    notes: payload.notes || "",
    subtotal: Number(payload.subtotal || 0),
    tax: Number(payload.tax || 0),
    discount: Number(payload.discount || 0),
    total: Number(payload.total || 0),
    items: stampItemsForKitchen(payload.items, requestId, createdAt),
  });
  if (payload.type === "dine-in" && payload.table) {
    await Table.findOneAndUpdate({ number: Number(payload.table) }, { status: "occupied", currentOrder: code });
  }
  res.status(201).json({ id: row.code, dbId: String(row._id) });
};

exports.openByTable = async (req, res) => {
  const tableNumber = Number(req.params.tableNumber);
  const includeCompleted = String(req.query.includeCompleted || "") === "true";
  const where = {
    table: tableNumber,
    type: "dine-in",
  };
  if (!includeCompleted) where.status = { $ne: "completed" };
  const row = await Order.findOne(where).sort({ createdAt: -1 }).lean();
  if (!row) return res.json({ item: null });
  return res.json({
    item: {
      id: row.code,
      dbId: String(row._id),
      type: row.type,
      status: row.status,
      table: row.table,
      items: row.items || [],
      subtotal: row.subtotal || 0,
      tax: row.tax || 0,
      discount: row.discount || 0,
      total: row.total || 0,
      notes: row.notes || "",
      customerName: row.customerName || "",
    },
  });
};

exports.addItems = async (req, res) => {
  const row = await Order.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Order not found" });
  const wasCompleted = row.status === "completed";
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const requestNo = (row.items || []).reduce((max, item) => {
    const match = String(item.requestId || "").match(/-R(\d+)$/);
    const n = match ? Number(match[1]) : 0;
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 1);
  const requestId = `${row.code}-R${requestNo + 1}`;
  row.items = [...(row.items || []), ...stampItemsForKitchen(incoming, requestId)];
  row.subtotal = Number(req.body.subtotal || row.subtotal || 0);
  row.tax = Number(req.body.tax || row.tax || 0);
  row.discount = Number(req.body.discount || row.discount || 0);
  row.total = Number(req.body.total || row.total || 0);
  row.notes = req.body.notes ?? row.notes;
  row.status = "pending";
  await row.save();
  if (wasCompleted && row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "occupied", currentOrder: row.code });
  }
  res.json({ ok: true, id: row.code, dbId: String(row._id) });
};

exports.payment = async (req, res) => {
  const row = await Order.findByIdAndUpdate(req.params.id, { status: "completed", paymentMethod: req.body.paymentMethod || "cash" }, { new: true });
  if (!row) return res.status(404).json({ message: "Order not found" });
  if (row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "available", currentOrder: "" });
  }
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  const row = await Order.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Order not found" });

  if (row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "available", currentOrder: "" });
  }

  await Order.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
