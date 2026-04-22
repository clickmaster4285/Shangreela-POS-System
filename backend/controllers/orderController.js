const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { getEffectiveTaxRates, calculateGrandTotal } = require("../utils/orderTotals");
const { emitPosChange } = require("../utils/realtime");
const { Order, Table, Delivery } = require("../models");
const Fuse = require("fuse.js");

const broadcastOrderDomain = () => emitPosChange(["orders", "tables", "deliveries", "dashboard"]);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyBillingFieldsFromBody = (body, patch) => {
  if (body.gstEnabled !== undefined) {
    patch.gstEnabled = body.gstEnabled === true || body.gstEnabled === "true";
  }
  const numericFields = ["total", "subtotal", "discount", "tax", "gstAmount", "serviceCharge", "amountPaid", "changeDue"];
  for (const f of numericFields) {
    if (body[f] !== undefined && body[f] !== null && body[f] !== "") {
      const n = Number(body[f]);
      if (Number.isFinite(n)) patch[f] = n;
    }
  }
  return patch;
};

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

exports.list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};

    // Status & type filters
    if (req.query.status && req.query.status !== "all") where.status = String(req.query.status);
    if (req.query.type && req.query.type !== "all") where.type = String(req.query.type);
    if (req.query.orderTaker && req.query.orderTaker !== "all") where.orderTaker = String(req.query.orderTaker);

    // Date range filter
    const { from, to, today } = req.query;
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(new Date(from).setHours(0, 0, 0, 0));
      if (to) dateFilter.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
      if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    } else if (today !== "false") {
      const now = new Date();
      where.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      };
    }

    // Search logic with Fuse.js
    if (req.query.search?.trim()) {
      const search = req.query.search.trim();
      const searchNum = Number(search);
      const conditions = [];

      // Order code match
      conditions.push({ code: { $regex: escapeRegex(search), $options: "i" } });

      // Exact table number match
      if (!isNaN(searchNum) && searchNum > 0) conditions.push({ table: searchNum });

      // Fuzzy table name match - fetch all tables once and cache if needed
      const allTables = await Table.find({}, { number: 1, name: 1 }).lean();
      if (allTables.length) {
        const fuse = new Fuse(allTables, {
          keys: ['name'],
          threshold: 0.4,
          ignoreLocation: true,
          minMatchCharLength: 1
        });

        const matchedTables = fuse.search(search).map(r => r.item.number);
        if (matchedTables.length) conditions.push({ table: { $in: matchedTables } });
      }

      if (conditions.length) where.$or = conditions;
    }

    // Floor filter
    if (req.query.floorKey && req.query.floorKey !== "all") {
      const tables = await Table.find({ floorKey: String(req.query.floorKey) }, { number: 1 }).lean();
      const tableNumbers = tables.map(t => t.number).filter(n => Number.isFinite(n));
      if (!tableNumbers.length) return res.json(buildPaginatedResponse({ items: [], total: 0, page, limit }));
      where.table = { $in: tableNumbers };
    }

    // Execute query
    const [items, total, rates] = await Promise.all([
      Order.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(where),
      getEffectiveTaxRates()
    ]);

    // Format response
    res.json(buildPaginatedResponse({
      items: items.map(o => {
        const totals = calculateGrandTotal(o.items || [], o.tax, o.discount, o.gstEnabled, rates, o.type);
        const isPaid = o.status === "completed";
        return {
          id: o.code,
          dbId: String(o._id),
          type: o.type,
          status: o.status,
          table: o.table,
          items: o.items || [],
          total: isPaid && Number.isFinite(o.total) ? Number(o.total) : totals.grandTotal,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: isPaid && Number.isFinite(o.discount) ? Number(o.discount) : totals.discount,
          gstAmount: totals.gstAmount,
          serviceCharge: totals.serviceCharge,
          gstEnabled: o.gstEnabled !== false,
          createdAt: o.createdAt,
          customerName: o.customerName || "",
          orderTaker: o.orderTaker || "",
          cashierName: o.cashierName || "",
          amountPaid: o.amountPaid,
          changeDue: o.changeDue,
          paymentMethod: o.paymentMethod
        };
      }),
      total,
      page,
      limit
    }));
  } catch (error) {
    console.error("List orders error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch orders" });
  }
};

exports.patchStatus = async (req, res) => {
  try {
    const newStatus = String(req.body.status || "");
    if (newStatus === "completed") {
      return res.status(400).json({ message: "Order completion must be processed via payment on the billing panel." });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    broadcastOrderDomain();
    res.json({ ok: true, id: String(order._id), status: order.status });
  } catch (error) {
    console.error("Patch status error:", error);
    res.status(500).json({ message: error.message || "Failed to update order status" });
  }
};

exports.changeTable = async (req, res) => {
  try {
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

    broadcastOrderDomain();
    res.json({ ok: true, table: newTableNumber });
  } catch (error) {
    console.error("Change table error:", error);
    res.status(500).json({ message: error.message || "Failed to change table" });
  }
};

exports.create = async (req, res) => {
  try {
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
    const rates = await getEffectiveTaxRates();
    const totals = calculateGrandTotal(items, payload.tax, payload.discount, payload.gstEnabled ?? true, rates, payload.type || "dine-in");
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
      gstAmount: totals.gstAmount,
      serviceCharge: totals.serviceCharge,
      gstEnabled: payload.gstEnabled ?? true,
      paymentMethod: payload.paymentMethod || "cash",
      total: totals.grandTotal,
      items,
    });
    
    if (payload.type === "dine-in" && payload.table) {
      const tableUpdateResult = await Table.findOneAndUpdate(
        { number: Number(payload.table) },
        { status: "occupied", currentOrder: code },
        { new: true }
      );
      if (!tableUpdateResult) {
        await Order.findByIdAndDelete(row._id);
        return res.status(404).json({ message: "Table not found. Order cancelled." });
      }
    }

    if (payload.type === "delivery") {
      try {
        await Delivery.create({
          orderId: code,
          customerName: payload.customerName || "",
          phone: payload.phone || "",
          address: payload.deliveryAddress || "",
          items: Array.isArray(payload.items) ? payload.items.map((item) => item.menuItem?.name || "Unknown") : [],
          total: totals.grandTotal,
          status: "pending",
          assignedRider: payload.assignedRider || "",
          estimatedTime: payload.estimatedTime || "30 mins",
        });
      } catch (deliveryError) {
        console.error("Delivery creation failed:", deliveryError);
        return res.status(400).json({ message: "Failed to create delivery record for this order." });
      }
    }

    broadcastOrderDomain();
    res.status(201).json({ id: row.code, dbId: String(row._id) });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: error.message || "Failed to create order" });
  }
};

exports.openByTable = async (req, res) => {
  try {
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
    const rates = await getEffectiveTaxRates();
    const totals = calculateGrandTotal(row.items || [], row.tax, row.discount, row.gstEnabled, rates, row.type);
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
        gstAmount: totals.gstAmount,
        serviceCharge: totals.serviceCharge,
        gstEnabled: row.gstEnabled !== false,
        total: totals.grandTotal,
        notes: row.notes || "",
        customerName: row.customerName || "",
        orderTaker: row.orderTaker || "",
        amountPaid: row.amountPaid,
        changeDue: row.changeDue,
        paymentMethod: row.paymentMethod,
        cashierName: row.cashierName || "",
      },
    });
  } catch (error) {
    console.error("Open by table error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch order by table" });
  }
};

exports.addItems = async (req, res) => {
  try {
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
    const rates = await getEffectiveTaxRates();
    const totals = calculateGrandTotal(row.items, req.body.tax ?? row.tax, req.body.discount ?? row.discount, req.body.gstEnabled ?? row.gstEnabled, rates, row.type);
    row.subtotal = totals.subtotal;
    row.tax = totals.tax;
    row.discount = totals.discount;
    row.gstAmount = totals.gstAmount;
    row.serviceCharge = totals.serviceCharge;
    row.gstEnabled = req.body.gstEnabled ?? row.gstEnabled;
    row.total = totals.grandTotal;
    row.notes = req.body.notes ?? row.notes;
    row.table = req.body.table ?? row.table;
    row.status = "pending";
    if (!row.orderTaker || row.orderTaker === "Unknown") {
      row.orderTaker = req.user.name || req.user.email || "Unknown";
    }
    await row.save();
    if (row.type === "delivery") {
      await Delivery.findOneAndUpdate({ orderId: row.code }, { total: totals.grandTotal });
    }
    if (wasCompleted && row.type === "dine-in" && row.table) {
      await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "occupied", currentOrder: row.code });
    }
    broadcastOrderDomain();
    res.json({ ok: true, id: row.code, dbId: String(row._id) });
  } catch (error) {
    console.error("Add items error:", error);
    res.status(500).json({ message: error.message || "Failed to add items" });
  }
};

exports.editItems = async (req, res) => {
  try {
    const row = await Order.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Order not found" });
    const invalidStatuses = ["completed", "cancelled"];
    if (invalidStatuses.includes(row.status)) {
      return res.status(400).json({ message: "Cannot edit a completed or cancelled order." });
    }

    const incoming = Array.isArray(req.body.items) ? req.body.items : [];
    const requestNo = (row.items || []).reduce((max, item) => {
      const match = String(item.requestId || "").match(/-R(\d+)$/);
      const n = match ? Number(match[1]) : 0;
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 1);
    const requestId = `${row.code}-R${requestNo + 1}`;
    row.items = stampItemsForKitchen(incoming, requestId);
    const rates = await getEffectiveTaxRates();
    const totals = calculateGrandTotal(
      row.items,
      req.body.tax ?? row.tax,
      req.body.discount ?? row.discount,
      req.body.gstEnabled ?? row.gstEnabled,
      rates,
      row.type
    );
    row.subtotal = totals.subtotal;
    row.tax = totals.tax;
    row.discount = totals.discount;
    row.gstAmount = totals.gstAmount;
    row.serviceCharge = totals.serviceCharge;
    row.gstEnabled = req.body.gstEnabled ?? row.gstEnabled;
    row.total = totals.grandTotal;
    row.notes = req.body.notes ?? row.notes;
    row.table = req.body.table ?? row.table;
    if (!row.orderTaker || row.orderTaker === "Unknown") {
      row.orderTaker = req.user.name || req.user.email || "Unknown";
    }
    await row.save();
    if (row.type === "delivery") {
      await Delivery.findOneAndUpdate({ orderId: row.code }, { total: totals.grandTotal });
    }
    broadcastOrderDomain();
    res.json({ ok: true, id: row.code, dbId: String(row._id) });
  } catch (error) {
    console.error("Edit items error:", error);
    res.status(500).json({ message: error.message || "Failed to edit order items" });
  }
};

exports.patchBillingTotals = async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found" });
    if (existing.status === "completed") {
      return res.status(400).json({ message: "Cannot update billing on a paid order" });
    }
    const patch = {};
    applyBillingFieldsFromBody(req.body, patch);
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: "Provide gstEnabled and/or numeric billing fields to update" });
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (updated.type === "delivery" && updated.code) {
      await Delivery.findOneAndUpdate({ orderId: updated.code }, { total: Number(updated.total || 0) });
    }
    broadcastOrderDomain();
    res.json({ ok: true });
  } catch (error) {
    console.error("Patch billing totals error:", error);
    res.status(500).json({ message: error.message || "Failed to update billing" });
  }
};

exports.payment = async (req, res) => {
  try {
    const patch = { status: "completed", paymentMethod: req.body.paymentMethod || "cash" };
    applyBillingFieldsFromBody(req.body, patch);
    
    // Explicitly set cashierName if provided
    if (req.user) {
      patch.cashierName = req.user.name || req.user.email;
    }

    const row = await Order.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!row) return res.status(404).json({ message: "Order not found" });

    if (row.type === "delivery" && row.code) {
      await Delivery.findOneAndUpdate({ orderId: row.code }, { total: Number(row.total || 0) });
    }

    // For dine-in orders, make table available after payment (no auto-creation of new order)
    if (row.type === "dine-in" && row.table) {
      await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "available", currentOrder: "" });
    }

    broadcastOrderDomain();
    res.json({ ok: true });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: error.message || "Failed to process payment" });
  }
};

exports.cancel = async (req, res) => {
  try {
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
    broadcastOrderDomain();
    res.json({ ok: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: error.message || "Failed to cancel order" });
  }
};

exports.remove = async (req, res) => {
  try {
    const row = await Order.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Order not found" });

    if (row.type === "dine-in" && row.table) {
      await Table.findOneAndUpdate({ number: Number(row.table) }, { status: "available", currentOrder: "" });
    }

    await Order.findByIdAndDelete(req.params.id);
    broadcastOrderDomain();
    res.json({ ok: true });
  } catch (error) {
    console.error("Remove order error:", error);
    res.status(500).json({ message: error.message || "Failed to remove order" });
  }
};
