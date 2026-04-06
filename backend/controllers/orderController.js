const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Order, Table } = require("../models");

const stampItemsForKitchen = (items, requestId, requestAt = new Date()) => {
  const list = Array.isArray(items) ? items : [];
  return list.map((item) => ({
    ...item,
    menuItem: {
      ...(item.menuItem || {}),
      kitchenRequired: item.menuItem?.kitchenRequired !== false,
    },
    requestId,
    requestAt,
  }));
};

const calculateOrderTotals = (items = [], tax = 0, discount = 0) => {
  const subtotal = Array.isArray(items)
    ? items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.menuItem?.price || 0), 0)
    : 0;
  const taxAmount = Number(tax || 0);
  const discountAmount = Number(discount || 0);
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    total: Math.max(0, subtotal + taxAmount - discountAmount),
  };
};

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.status && req.query.status !== "all") where.status = String(req.query.status);
  if (req.query.type && req.query.type !== "all") where.type = String(req.query.type);
  const [items, total] = await Promise.all([Order.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments(where)]);
  res.json(
    buildPaginatedResponse({
      items: items.map((o) => {
        const totals = calculateOrderTotals(o.items || [], o.tax, o.discount);
        return {
          id: o.code,
          type: o.type,
          status: o.status,
          table: o.table,
          items: o.items || [],
          total: totals.total,
          tax: totals.tax,
          subtotal: totals.subtotal,
          discount: totals.discount,
          notes: o.notes || "",
          createdAt: o.createdAt,
          customerName: o.customerName || "",
          dbId: String(o._id),
        };
      }),
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

  if (payload.type === "dine-in" && payload.table) {
    const tableNumber = Number(payload.table);
    const existingOrder = await Order.findOne({
      table: tableNumber,
      type: "dine-in",
      status: { $nin: ["completed", "cancelled"] },
    });
    if (existingOrder) {
      return res.status(400).json({ message: "This table already has an active order. Complete payment before creating a new order." });
    }
  }

  const code = payload.code || `ORD-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date();
  const requestId = `${code}-R1`;
  const items = stampItemsForKitchen(payload.items, requestId, createdAt);
  const totals = calculateOrderTotals(items, payload.tax, payload.discount);
  const row = await Order.create({
    code,
    type: payload.type || "dine-in",
    status: payload.status || "pending",
    table: payload.table,
    customerName: payload.customerName || "",
    notes: payload.notes || "",
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    items,
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
  if (!includeCompleted) {
    where.status = { $nin: ["completed", "cancelled"] };
  }
  const row = await Order.findOne(where).sort({ createdAt: -1 }).lean();
  if (!row) return res.json({ item: null });
  const totals = calculateOrderTotals(row.items || [], row.tax, row.discount);
  return res.json({
    item: {
      id: row.code,
      dbId: String(row._id),
      type: row.type,
      status: row.status,
      table: row.table,
      items: row.items || [],
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
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
  const totals = calculateOrderTotals(row.items, req.body.tax ?? row.tax, req.body.discount ?? row.discount);
  row.subtotal = totals.subtotal;
  row.tax = totals.tax;
  row.discount = totals.discount;
  row.total = totals.total;
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

  // For dine-in orders, make table available after payment (no auto-creation of new order)
  if (row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "available", currentOrder: "" });
  }

  res.json({ ok: true });
};

exports.cancel = async (req, res) => {
  const row = await Order.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Order not found" });
  if (row.status === "completed") {
    return res.status(400).json({ message: "Cannot cancel a completed/paid order" });
  }
  if (row.status === "served") {
    return res.status(400).json({ message: "Cannot cancel a served order" });
  }
  row.status = "cancelled";
  await row.save();
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
