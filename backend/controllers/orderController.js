const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Order, Table, Delivery } = require("../models");

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

const calculateGrandTotal = (items = [], tax = 0, discount = 0, gstEnabled = true) => {
  const { subtotal, tax: taxAmount, discount: discountAmount, total: taxableTotal } = calculateOrderTotals(items, tax, discount);
  const gstRate = 0.16;
  const serviceChargeRate = 0.05;
  const serviceCharge = Math.round(taxableTotal * serviceChargeRate);
  const subtotalAfterService = taxableTotal + serviceCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterService * gstRate) : 0;
  const grandTotal = subtotalAfterService + gstAmount;
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    gstAmount,
    serviceCharge,
    grandTotal,
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
        const totals = calculateGrandTotal(o.items || [], o.tax, o.discount, o.gstEnabled);
        return {
          id: o.code,
          type: o.type,
          status: o.status,
          table: o.table,
          items: o.items || [],
          total: totals.grandTotal,
          tax: totals.tax,
          subtotal: totals.subtotal,
          discount: totals.discount,
          gstAmount: totals.gstAmount,
          serviceCharge: totals.serviceCharge,
          createdAt: o.createdAt,
          customerName: o.customerName || "",
          orderTaker: o.orderTaker || "",
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

exports.changeTable = async (req, res) => {
  const newTableNumber = Number(req.body.table);
  if (!Number.isInteger(newTableNumber) || newTableNumber <= 0) {
    return res.status(400).json({ message: "Provide a valid table number." });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.type !== "dine-in") {
    return res.status(400).json({ message: "Only dine-in orders can be reassigned to a table." });
  }
  if (order.status === "completed" || order.status === "cancelled") {
    return res.status(400).json({ message: "Cannot switch table for a completed or cancelled order." });
  }

  const currentTableNumber = Number(order.table || 0);
  if (currentTableNumber === newTableNumber) {
    return res.json({ ok: true, table: newTableNumber });
  }

  const targetTable = await Table.findOne({ number: newTableNumber });
  if (!targetTable) {
    return res.status(404).json({ message: "Target table not found." });
  }
  if (targetTable.status === "occupied" && targetTable.currentOrder !== order.code) {
    return res.status(400).json({ message: "Target table is currently occupied." });
  }

  if (currentTableNumber) {
    await Table.findOneAndUpdate(
      { number: currentTableNumber, currentOrder: order.code },
      { status: "available", currentOrder: "" }
    );
  }

  await Table.findOneAndUpdate({ number: newTableNumber }, { status: "occupied", currentOrder: order.code });
  order.table = newTableNumber;
  await order.save();

  res.json({ ok: true, table: newTableNumber });
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
    orderTaker: req.user.name || req.user.email || "Unknown",
    notes: payload.notes || "",
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    gstEnabled: payload.gstEnabled ?? true,
    paymentMethod: payload.paymentMethod || "cash",
    total: totals.total,
    items,
  });
  if (payload.type === "dine-in" && payload.table) {
    await Table.findOneAndUpdate({ number: Number(payload.table) }, { status: "occupied", currentOrder: code });
  }

  if (payload.type === "delivery") {
    await Delivery.create({
      orderId: code,
      customerName: payload.customerName || "",
      phone: payload.phone || "",
      address: payload.deliveryAddress || "",
      items: Array.isArray(payload.items) ? payload.items.map((item) => item.menuItem?.name || "Unknown") : [],
      total: totals.total,
      status: "pending",
      assignedRider: payload.assignedRider || "",
      estimatedTime: payload.estimatedTime || "30 mins",
    });
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
      orderTaker: row.orderTaker || "",
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
  if (!row.orderTaker || row.orderTaker === "Unknown") {
    row.orderTaker = req.user.name || req.user.email || "Unknown";
  }
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
