const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("./config");
const { parsePagination, buildPaginatedResponse } = require("./utils/pagination");
const { authRequired, attachPermissions } = require("./middleware");
const {
  User,
  Permission,
  MenuItem,
  Order,
  InventoryItem,
  InventoryLog,
  Supplier,
  Employee,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  SalaryRecord,
  Shift,
  Floor,
  Table,
  Delivery,
  PrinterConfig,
  PosTabConfig,
  GiftCard,
  LoyaltyMember,
  FbrConfig,
  TaxConfig,
  MobileConfig,
} = require("./models");

const router = express.Router();

const stampItemsForKitchen = (items, requestId, requestAt = new Date()) => {
  const list = Array.isArray(items) ? items : [];
  return list.map((item) => ({
    ...item,
    requestId,
    requestAt,
  }));
};

router.get("/health", (_req, res) => res.json({ ok: true }));

router.get("/auth/demo-accounts", async (_req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).lean();
  res.json({
    items: users.map((u) => ({ name: u.name, email: u.email, role: u.role })),
    note: "Passwords: super123, hassaan123, fahad123, cashier123",
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalized = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  const ok = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid email or password" });
  const token = jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: "7d" });
  const permission = await Permission.findOne({ role: user.role }).lean();
  res.json({
    token,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" },
    permissions: permission || null,
  });
});

router.get("/auth/me", authRequired, attachPermissions, async (req, res) => {
  res.json({
    user: { id: String(req.user._id), name: req.user.name, email: req.user.email, role: req.user.role, avatar: req.user.avatar || "" },
    permissions: req.currentPermissions,
  });
});

router.get("/users", authRequired, async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [users, total] = await Promise.all([
    User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, avatar: u.avatar || "" })),
      total,
      page,
      limit,
    })
  );
});

router.post("/users", authRequired, async (req, res) => {
  const { name, email, role, password } = req.body || {};
  const passwordHash = await bcrypt.hash(String(password || ""), 10);
  const user = await User.create({ name, email: String(email || "").toLowerCase(), role, passwordHash });
  res.status(201).json({ id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" });
});

router.delete("/users/:id", authRequired, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/permissions", authRequired, async (_req, res) => {
  const rows = await Permission.find({}).lean();
  const config = {};
  for (const r of rows) config[r.role] = { pageAccess: r.pageAccess || [], actionPermissions: r.actionPermissions || [], dataVisibility: r.dataVisibility || [] };
  res.json(config);
});

router.put("/permissions", authRequired, async (req, res) => {
  const config = req.body || {};
  for (const [role, value] of Object.entries(config)) {
    await Permission.findOneAndUpdate({ role }, { role, ...value }, { upsert: true, new: true });
  }
  res.json({ ok: true });
});

router.get("/menu", authRequired, async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  const [items, total] = await Promise.all([MenuItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), MenuItem.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
});

router.post("/menu", authRequired, async (req, res) => {
  const payload = req.body || {};
  const row = await MenuItem.create(payload);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.put("/menu/:id", authRequired, async (req, res) => {
  const row = await MenuItem.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  res.json({ ...row.toObject(), id: String(row._id) });
});

router.delete("/menu/:id", authRequired, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/orders", authRequired, async (req, res) => {
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
        orderTaker: o.orderTaker || "",
        dbId: String(o._id),
      })),
      total,
      page,
      limit,
    })
  );
});

router.patch("/orders/:id/status", authRequired, async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ ok: true, id: String(order._id), status: order.status });
});

router.get("/inventory/items", authRequired, async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  if (req.query.perishableOnly === "true") where.perishable = true;
  const [items, total] = await Promise.all([InventoryItem.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), InventoryItem.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
});

router.post("/inventory/items", authRequired, async (req, res) => {
  const row = await InventoryItem.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.post("/inventory/items/:id/adjust", authRequired, async (req, res) => {
  const { action, quantity, note } = req.body || {};
  const item = await InventoryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  const qty = Math.max(0, Number(quantity || 0));
  if (action === "add") item.quantity += qty;
  else item.quantity = Math.max(0, item.quantity - qty);
  if (action === "add") item.lastRestocked = new Date().toISOString().slice(0, 10);
  await item.save();
  await InventoryLog.create({
    itemId: String(item._id),
    itemName: item.name,
    action: action === "add" ? "restocked" : action === "waste" ? "wasted" : "used",
    quantity: qty,
    note: note || "",
    timestamp: new Date().toISOString(),
    userId: String(req.user._id),
  });
  res.json({ ok: true });
});

router.get("/inventory/logs", authRequired, async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([InventoryLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), InventoryLog.countDocuments({})]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
});

router.get("/inventory/suppliers", authRequired, async (_req, res) => {
  const rows = await Supplier.find({}).lean();
  res.json({ items: rows.map((s) => ({ ...s, id: String(s._id) })) });
});

router.get("/hr/employees", authRequired, async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.$or = [{ name: { $regex: String(req.query.search), $options: "i" } }, { employeeId: { $regex: String(req.query.search), $options: "i" } }];
  const [items, total] = await Promise.all([Employee.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Employee.countDocuments(where)]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
});

router.post("/hr/employees", authRequired, async (req, res) => {
  const row = await Employee.create(req.body || {});
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
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.get("/hr/attendance", authRequired, async (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const items = await Attendance.find({ date }).lean();
  res.json({ items: items.map((i) => ({ ...i, id: String(i._id) })) });
});

router.get("/hr/leaves", authRequired, async (_req, res) => {
  const rows = await LeaveRequest.find({}).sort({ createdAt: -1 }).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
});

router.patch("/hr/leaves/:id/status", authRequired, async (req, res) => {
  await LeaveRequest.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ ok: true });
});

router.get("/hr/leave-balances", authRequired, async (_req, res) => {
  const rows = await LeaveBalance.find({}).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
});

router.get("/hr/salary", authRequired, async (_req, res) => {
  const rows = await SalaryRecord.find({}).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
});

router.patch("/hr/salary/:employeeId", authRequired, async (req, res) => {
  const row = await SalaryRecord.findOne({ employeeId: req.params.employeeId });
  if (!row) return res.status(404).json({ message: "Salary row not found" });
  row.bonus = Number(req.body.bonus || 0);
  row.deductions = Number(req.body.deductions || 0);
  row.lateFines = Number(req.body.lateFines || 0);
  row.netSalary = row.baseSalary + row.bonus - row.deductions - row.lateFines;
  await row.save();
  res.json({ ok: true });
});

router.patch("/hr/salary/:employeeId/mark-paid", authRequired, async (req, res) => {
  await SalaryRecord.findOneAndUpdate({ employeeId: req.params.employeeId }, { status: "paid", paidOn: new Date().toISOString().slice(0, 10) });
  res.json({ ok: true });
});

router.get("/hr/shifts", authRequired, async (_req, res) => {
  const rows = await Shift.find({}).lean();
  res.json({ items: rows.map((i) => ({ ...i, id: String(i._id) })) });
});

router.get("/dashboard/summary", authRequired, async (_req, res) => {
  const [orders, menuCount, lowStock, staff] = await Promise.all([
    Order.find({}).lean(),
    MenuItem.countDocuments({}),
    InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$minStock"] } }),
    Employee.countDocuments({ status: "active" }),
  ]);
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  res.json({ revenue, totalOrders: orders.length, menuCount, lowStock, staff });
});

router.get("/dashboard/sales-daily", authRequired, async (_req, res) => {
  const orders = await Order.find({}).lean();
  const buckets = new Map();
  for (let i = 9; i <= 20; i += 1) buckets.set(i, 0);
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    if (buckets.has(h)) buckets.set(h, buckets.get(h) + Number(o.total || 0));
  }
  const items = [...buckets.entries()].map(([hour, sales]) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = hour > 12 ? hour - 12 : hour;
    return { hour: `${h12}${suffix}`, sales };
  });
  res.json({ items });
});

router.get("/dashboard/revenue-weekly", authRequired, async (_req, res) => {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rows = labels.map((day) => ({ day, revenue: 0 }));
  const orders = await Order.find({}).lean();
  for (const o of orders) {
    const dayIdx = new Date(o.createdAt).getDay();
    rows[dayIdx].revenue += Number(o.total || 0);
  }
  res.json({ items: rows });
});

router.get("/dashboard/top-items", authRequired, async (_req, res) => {
  const orders = await Order.find({}).lean();
  const map = new Map();
  for (const o of orders) {
    for (const it of o.items || []) {
      const key = it.menuItem?.name || "Unknown";
      const prev = map.get(key) || { sold: 0, revenue: 0 };
      prev.sold += Number(it.quantity || 0);
      prev.revenue += Number(it.quantity || 0) * Number(it.menuItem?.price || 0);
      map.set(key, prev);
    }
  }
  const items = [...map.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);
  res.json({ items });
});

router.get("/dashboard/recent-orders", authRequired, async (_req, res) => {
  const items = await Order.find({}).sort({ createdAt: -1 }).limit(10).lean();
  res.json({ items: items.map((o) => ({ id: o.code, type: o.type, status: o.status, total: o.total, table: o.table, items: o.items || [] })) });
});

router.post("/orders", authRequired, async (req, res) => {
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
    orderTaker: req.user?.name || "",
    notes: payload.notes || "",
    subtotal: Number(payload.subtotal || 0),
    tax: Number(payload.tax || 0),
    discount: Number(payload.discount || 0),
    total: Number(payload.total || 0),
    items: stampItemsForKitchen(payload.items, requestId, createdAt),
  });
  if (payload.type === "dine-in" && payload.table) {
    await Table.findOneAndUpdate(
      { number: Number(payload.table) },
      { status: "occupied", currentOrder: code }
    );
  }
  res.status(201).json({ id: row.code, dbId: String(row._id) });
});

router.get("/orders/open-by-table/:tableNumber", authRequired, async (req, res) => {
  const tableNumber = Number(req.params.tableNumber);
  const includeCompleted = String(req.query.includeCompleted || "") === "true";
  const where = {
    table: tableNumber,
    type: "dine-in",
  };
  if (!includeCompleted) where.status = { $ne: "completed" };
  const row = await Order.findOne(where)
    .sort({ createdAt: -1 })
    .lean();
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
      orderTaker: row.orderTaker || "",
    },
  });
});

router.patch("/orders/:id/add-items", authRequired, async (req, res) => {
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
    await Table.findOneAndUpdate(
      { number: Number(row.table) },
      { status: "occupied", currentOrder: row.code }
    );
  }
  res.json({ ok: true, id: row.code, dbId: String(row._id) });
});

router.post("/orders/:id/payment", authRequired, async (req, res) => {
  const row = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "completed", paymentMethod: req.body.paymentMethod || "cash" },
    { new: true }
  );
  if (!row) return res.status(404).json({ message: "Order not found" });
  if (row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate(
      { number: Number(row.table) },
      { status: "available", currentOrder: "" }
    );
  }
  res.json({ ok: true });
});

router.delete("/orders/:id", authRequired, async (req, res) => {
  const row = await Order.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Order not found" });

  if (row.type === "dine-in" && row.table) {
    await Table.findOneAndUpdate(
      { number: Number(row.table) },
      { status: "available", currentOrder: "" }
    );
  }

  await Order.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/floors", authRequired, async (_req, res) => {
  const { page, limit, skip } = parsePagination(_req.query);
  const [rows, total] = await Promise.all([
    Floor.find({}).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Floor.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: rows.map((f) => ({ id: String(f._id), key: f.key, name: f.name })),
      total,
      page,
      limit,
    })
  );
});

router.post("/floors", authRequired, async (req, res) => {
  const row = await Floor.create({ key: req.body.key, name: req.body.name });
  res.status(201).json({ id: String(row._id), key: row.key, name: row.name });
});

router.put("/floors/:id", authRequired, async (req, res) => {
  const row = await Floor.findByIdAndUpdate(req.params.id, { name: req.body.name, key: req.body.key }, { new: true });
  res.json({ id: String(row._id), key: row.key, name: row.name });
});

router.delete("/floors/:id", authRequired, async (req, res) => {
  await Floor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/tables", authRequired, async (_req, res) => {
  const { page, limit, skip } = parsePagination(_req.query);
  const [rows, total] = await Promise.all([
    Table.find({}).sort({ number: 1 }).skip(skip).limit(limit).lean(),
    Table.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: rows.map((t) => ({
        id: String(t._id),
        number: t.number,
        name: t.name,
        seats: t.seats,
        floorKey: t.floorKey,
        status: t.status,
        currentOrder: t.currentOrder || "",
      })),
      total,
      page,
      limit,
    })
  );
});

router.post("/tables", authRequired, async (req, res) => {
  const row = await Table.create(req.body || {});
  res.status(201).json({ id: String(row._id) });
});

router.put("/tables/:id", authRequired, async (req, res) => {
  const row = await Table.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  res.json({ id: String(row._id) });
});

router.delete("/tables/:id", authRequired, async (req, res) => {
  await Table.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/tables/bulk", authRequired, async (req, res) => {
  const tables = req.body?.tables || [];
  if (!Array.isArray(tables) || tables.length === 0) {
    return res.status(400).json({ error: "Tables array is required" });
  }

  const created = [];
  for (const table of tables) {
    const { number, name, seats, floorKey, status } = table;
    if (!number || !name || !seats || !floorKey) {
      return res.status(400).json({ error: "Each table must include number, name, seats, and floorKey" });
    }
    const existing = await Table.findOne({ number });
    if (existing) {
      return res.status(409).json({ error: `Table ${number} already exists` });
    }
    const newTable = await Table.create({ number, name, seats, floorKey, status: status || "available" });
    created.push({ id: String(newTable._id), number, name });
  }

  res.status(201).json({ created });
});

router.delete("/tables/bulk", authRequired, async (req, res) => {
  const ids = req.body?.ids || [];
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "IDs array is required" });
  }
  const result = await Table.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: result.deletedCount });
});

router.get("/deliveries", authRequired, async (_req, res) => {
  const { page, limit, skip } = parsePagination(_req.query);
  const [rows, total] = await Promise.all([
    Delivery.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Delivery.countDocuments({}),
  ]);
  res.json(
    buildPaginatedResponse({
      items: rows.map((d) => ({ ...d, id: String(d._id) })),
      total,
      page,
      limit,
    })
  );
});

router.post("/deliveries", authRequired, async (req, res) => {
  const row = await Delivery.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.patch("/deliveries/:id/status", authRequired, async (req, res) => {
  await Delivery.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ ok: true });
});

router.get("/analytics/summary", authRequired, async (_req, res) => {
  const orders = await Order.find({}).lean();
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  res.json({ revenue, totalOrders: orders.length, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0 });
});

router.get("/analytics/order-type-breakdown", authRequired, async (_req, res) => {
  const orders = await Order.find({}).lean();
  const total = orders.length || 1;
  const counts = { "dine-in": 0, delivery: 0, takeaway: 0 };
  const revenue = { "dine-in": 0, delivery: 0, takeaway: 0 };
  for (const o of orders) {
    counts[o.type] += 1;
    revenue[o.type] += Number(o.total || 0);
  }
  res.json({
    items: [
      { name: "Dine-in", value: Math.round((counts["dine-in"] / total) * 100), revenue: revenue["dine-in"] },
      { name: "Delivery", value: Math.round((counts.delivery / total) * 100), revenue: revenue.delivery },
      { name: "Takeaway", value: Math.round((counts.takeaway / total) * 100), revenue: revenue.takeaway },
    ],
  });
});

router.get("/analytics/monthly-trend", authRequired, async (_req, res) => {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rows = labels.map((month) => ({ month, revenue: 0 }));
  const orders = await Order.find({}).lean();
  for (const o of orders) rows[new Date(o.createdAt).getMonth()].revenue += Number(o.total || 0);
  res.json({ items: rows });
});

router.get("/reports/weekly-sales", authRequired, async (_req, res) => {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = labels.map((day) => ({ day, revenue: 0 }));
  const orders = await Order.find({}).lean();
  for (const o of orders) {
    const idx = (new Date(o.createdAt).getDay() + 6) % 7;
    rows[idx].revenue += Number(o.total || 0);
  }
  res.json({ items: rows });
});

router.get("/reports/top-items", authRequired, async (_req, res) => {
  const orders = await Order.find({}).lean();
  const map = new Map();
  for (const o of orders) {
    for (const i of o.items || []) {
      const key = i.menuItem?.name || "Unknown";
      const prev = map.get(key) || { sold: 0, revenue: 0 };
      prev.sold += Number(i.quantity || 0);
      prev.revenue += Number(i.quantity || 0) * Number(i.menuItem?.price || 0);
      map.set(key, prev);
    }
  }
  res.json({ items: [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.sold - a.sold).slice(0, 10) });
});

router.get("/reports/outdoor-delivery", authRequired, async (_req, res) => {
  const rows = await Delivery.find({}).lean();
  const map = new Map();
  for (const r of rows) {
    const supervisor = r.assignedRider || "Unassigned";
    const prev = map.get(supervisor) || { supervisor, shiftLabel: "Current", cashCollected: 0, cardDigital: 0, deliveriesCompleted: 0, codPending: 0 };
    prev.cashCollected += Number(r.total || 0);
    if (r.status === "served") prev.deliveriesCompleted += 1;
    if (r.status !== "served") prev.codPending += 1;
    map.set(supervisor, prev);
  }
  res.json({ items: [...map.values()] });
});

router.get("/settings/printers", authRequired, async (_req, res) => {
  const rows = await PrinterConfig.find({}).lean();
  res.json({ items: rows.map((r) => ({ ...r, id: String(r._id), slotId: r.slotId || r.id })) });
});

router.put("/settings/printers", authRequired, async (req, res) => {
  await PrinterConfig.deleteMany({});
  await PrinterConfig.insertMany((req.body.items || []).map((i) => ({ ...i, slotId: i.id || i.slotId })));
  res.json({ ok: true });
});

router.get("/settings/pos-tabs", authRequired, async (_req, res) => {
  const rows = await PosTabConfig.find({}).lean();
  res.json({ items: rows.map((r) => ({ ...r, id: String(r._id), slotId: r.slotId || r.id })) });
});

router.put("/settings/pos-tabs", authRequired, async (req, res) => {
  await PosTabConfig.deleteMany({});
  await PosTabConfig.insertMany((req.body.items || []).map((i) => ({ ...i, slotId: i.id || i.slotId })));
  res.json({ ok: true });
});

router.get("/gift-cards", authRequired, async (_req, res) => {
  const { page, limit, skip } = parsePagination(_req.query);
  const [rows, total] = await Promise.all([
    GiftCard.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GiftCard.countDocuments({}),
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((r) => ({ ...r, id: String(r._id) })), total, page, limit }));
});

router.post("/gift-cards", authRequired, async (req, res) => {
  const row = await GiftCard.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.patch("/gift-cards/:id/redeem", authRequired, async (req, res) => {
  const amount = Number(req.body.amount || 0);
  const row = await GiftCard.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Gift card not found" });
  row.balance = Math.max(0, Number(row.balance || 0) - amount);
  if (row.balance === 0) row.status = "redeemed";
  await row.save();
  res.json({ ok: true, balance: row.balance, status: row.status });
});

router.get("/loyalty/members", authRequired, async (_req, res) => {
  const { page, limit, skip } = parsePagination(_req.query);
  const [rows, total] = await Promise.all([
    LoyaltyMember.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LoyaltyMember.countDocuments({}),
  ]);
  res.json(buildPaginatedResponse({ items: rows.map((r) => ({ ...r, id: String(r._id) })), total, page, limit }));
});

router.post("/loyalty/members", authRequired, async (req, res) => {
  const row = await LoyaltyMember.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
});

router.patch("/loyalty/members/:id/points", authRequired, async (req, res) => {
  const row = await LoyaltyMember.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Member not found" });
  row.points = Number(req.body.points || row.points || 0);
  await row.save();
  res.json({ ok: true });
});

router.get("/integrations/fbr/config", authRequired, async (_req, res) => {
  let row = await FbrConfig.findOne({});
  if (!row) row = await FbrConfig.create({ ntn: "", posId: "", sandbox: true, linked: false });
  res.json({ id: String(row._id), ntn: row.ntn, posId: row.posId, sandbox: row.sandbox, linked: row.linked });
});

router.put("/integrations/fbr/config", authRequired, async (req, res) => {
  const existing = await FbrConfig.findOne({});
  const row = existing
    ? await FbrConfig.findByIdAndUpdate(existing._id, req.body || {}, { new: true })
    : await FbrConfig.create(req.body || {});
  res.json({ id: String(row._id), ntn: row.ntn, posId: row.posId, sandbox: row.sandbox, linked: row.linked });
});

router.post("/integrations/fbr/test-connection", authRequired, async (_req, res) => {
  const row = await FbrConfig.findOne({});
  if (row) {
    row.linked = true;
    await row.save();
  }
  res.json({ ok: true, message: "Connection successful (simulated)" });
});

router.get("/settings/tax", authRequired, async (_req, res) => {
  let row = await TaxConfig.findOne({});
  if (!row) row = await TaxConfig.create({ salesTaxRate: 16, serviceChargeRate: 10, withholdingLabel: "As per FBR" });
  res.json({ id: String(row._id), salesTaxRate: row.salesTaxRate, serviceChargeRate: row.serviceChargeRate, withholdingLabel: row.withholdingLabel });
});

router.put("/settings/tax", authRequired, async (req, res) => {
  const existing = await TaxConfig.findOne({});
  const row = existing ? await TaxConfig.findByIdAndUpdate(existing._id, req.body || {}, { new: true }) : await TaxConfig.create(req.body || {});
  res.json({ id: String(row._id), salesTaxRate: row.salesTaxRate, serviceChargeRate: row.serviceChargeRate, withholdingLabel: row.withholdingLabel });
});

router.get("/mobile/config", authRequired, async (_req, res) => {
  let row = await MobileConfig.findOne({});
  if (!row) row = await MobileConfig.create({ pairingToken: "", downloadUrl: "", features: [] });
  res.json({ id: String(row._id), pairingToken: row.pairingToken, downloadUrl: row.downloadUrl, features: row.features || [] });
});

router.post("/mobile/pairing-token", authRequired, async (_req, res) => {
  let row = await MobileConfig.findOne({});
  const token = `PAIR-${Date.now().toString(36).toUpperCase()}`;
  if (!row) row = await MobileConfig.create({ pairingToken: token, downloadUrl: "", features: [] });
  else {
    row.pairingToken = token;
    await row.save();
  }
  res.json({ pairingToken: token });
});

module.exports = router;
