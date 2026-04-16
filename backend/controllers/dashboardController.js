const { Order, MenuItem, InventoryItem, Employee, Expense, TaxConfig, Table } = require("../models");
const { parseDateRange, parseCustomDateRange, buildPaidOrdersQuery } = require("../utils/reportingQueries");

const getEffectiveTaxRates = async () => {
  const row = await TaxConfig.findOne({}).lean();
  const gstRate = Number(row?.salesTaxRate ?? 16) / 100;
  const serviceChargeRate = Number(row?.serviceChargeRate ?? 5) / 100;
  return {
    gstRate: Number.isFinite(gstRate) ? gstRate : 0.16,
    serviceChargeRate: Number.isFinite(serviceChargeRate) ? serviceChargeRate : 0.05,
  };
};

const getTableNumbers = async (floorKey) => {
  if (!floorKey || floorKey === "all") return null;
  const tables = await Table.find({ floorKey }).select("number").lean();
  return tables.map((t) => t.number);
};

const normalizeOrderFinancials = (order, rates = { gstRate: 0.16, serviceChargeRate: 0.05 }) => {
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const serviceChargeRate = Number.isFinite(Number(rates.serviceChargeRate)) ? Number(rates.serviceChargeRate) : 0.05;
  const gstRate = Number.isFinite(Number(rates.gstRate)) ? Number(rates.gstRate) : 0.16;
  const applyServiceCharge = String(order.type || "dine-in") === "dine-in";
  const computedServiceCharge = applyServiceCharge ? Math.round(Math.max(0, subtotal - discount) * serviceChargeRate) : 0;
  const serviceCharge = order.serviceCharge != null ? Number(order.serviceCharge) : computedServiceCharge;
  const computedGstAmount = order.gstEnabled === false ? 0 : Math.round((Math.max(0, subtotal - discount) + serviceCharge) * gstRate);
  const gstAmount = Number(order.gstAmount ?? computedGstAmount);
  const total = Number(order.total ?? Math.max(0, subtotal - discount) + serviceCharge + gstAmount);
  return { subtotal, discount, serviceCharge, gstAmount, total };
};

const buildTopMenuItems = (orders) => {
  const map = new Map();
  for (const order of orders) {
    for (const it of order.items || []) {
      const key = it.menuItem?.name || "Unknown";
      const prev = map.get(key) || { sold: 0, revenue: 0 };
      const quantity = Number(it.quantity || 0);
      prev.sold += quantity;
      prev.revenue += quantity * Number(it.menuItem?.price || 0);
      map.set(key, prev);
    }
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.sold - a.sold);
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const buildRevenueSeries = (range, orders, from, to) => {
  const now = new Date();
  const r = String(range || "week");
  const orderTotal = (o) => Number(o.total || 0);

  // Custom date range support
  if (from || to) {
    const startDate = from ? new Date(from) : new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = to ? new Date(to) : new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    // Generate date buckets for the range
    const totals = new Map();
    const labels = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().slice(0, 10);
      const label = current.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      labels.push({ key, label });
      totals.set(key, 0);
      current.setDate(current.getDate() + 1);
    }
    
    // Aggregate orders
    for (const o of orders) {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) totals.set(key, totals.get(key) + orderTotal(o));
    }
    
    return labels.map((x) => ({ day: x.label, revenue: totals.get(x.key) || 0 }));
  }

  if (r === "today") {
    const labels = [];
    const totals = new Map();
    for (let i = 6; i >= 0; i -= 1) {
      const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const key = d.toISOString().slice(0, 10);
      labels.push({ key, label: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit" }) });
      totals.set(key, 0);
    }
    for (const o of orders) {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) totals.set(key, totals.get(key) + orderTotal(o));
    }
    return labels.map((x) => ({ day: x.label, revenue: totals.get(x.key) || 0 }));
  }

  if (r === "week") {
    const labels = [];
    const totals = new Map();
    for (let i = 6; i >= 0; i -= 1) {
      const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const key = d.toISOString().slice(0, 10);
      labels.push({ key, label: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit" }) });
      totals.set(key, 0);
    }
    for (const o of orders) {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) totals.set(key, totals.get(key) + orderTotal(o));
    }
    return labels.map((x) => ({ day: x.label, revenue: totals.get(x.key) || 0 }));
  }

  if (r === "month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const totals = new Map();
    for (let d = 1; d <= lastDay; d += 1) {
      const key = new Date(y, m, d).toISOString().slice(0, 10);
      totals.set(key, 0);
    }
    for (const o of orders) {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) totals.set(key, totals.get(key) + orderTotal(o));
    }
    return [...totals.entries()].map(([key, revenue]) => {
      const d = new Date(key);
      return { day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), revenue };
    });
  }

  if (r === "year") {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const rows = labels.map((month) => ({ day: month, revenue: 0 }));
    for (const o of orders) {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === now.getFullYear()) rows[d.getMonth()].revenue += orderTotal(o);
    }
    return rows;
  }

  return [];
};

exports.summary = async (req, res) => {
  const range = String(req.query.range || "all");
  const from = req.query.from;
  const to = req.query.to;
  const floorKey = req.query.floorKey;
  const tableNumbers = await getTableNumbers(floorKey);
  const dateFilter = from || to ? parseCustomDateRange(from, to) : parseDateRange(range);
  const paidQuery = buildPaidOrdersQuery(range, from, to, tableNumbers);
  const expenseQuery = dateFilter ? { createdAt: dateFilter } : {};
  const rates = await getEffectiveTaxRates();
  const [orders, menuCount, lowStock, staff, cancelledOrders, openOrders, expenses] = await Promise.all([
    Order.find(paidQuery).lean(),
    MenuItem.countDocuments({}),
    InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$minStock"] } }),
    Employee.countDocuments({ status: "active" }),
    Order.countDocuments({ status: "cancelled", ...(dateFilter ? { createdAt: dateFilter } : {}) }),
    Order.countDocuments({ status: { $nin: ["completed", "cancelled"] } }),
    Expense.find(expenseQuery).lean(),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const revenue = orders.reduce((sum, o) => sum + normalizeOrderFinancials(o, rates).total, 0);
  const totalServiceCharges = orders.reduce((sum, o) => sum + normalizeOrderFinancials(o, rates).serviceCharge, 0);
  const paymentBreakdown = orders.reduce(
    (acc, o) => {
      const amount = normalizeOrderFinancials(o, rates).total;
      const method = String(o.paymentMethod || "cash").toLowerCase();
      if (method === "card") acc.card += amount;
      else if (method === "easypesa") acc.easypesa += amount;
      else if (method === "cash") acc.cash += amount;
      else acc.other += amount;
      return acc;
    },
    { cash: 0, card: 0, easypesa: 0, other: 0 }
  );
  const totalMenuOut = orders.reduce((sum, o) => sum + (o.items || []).reduce((count, it) => count + Number(it.quantity || 0), 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + normalizeOrderFinancials(o, rates).discount, 0);
  const topMenuItems = buildTopMenuItems(orders);
  const profit = revenue - totalExpenses;

  res.json({
    revenue,
    profit,
    totalServiceCharges,
    totalDiscount,
    paymentBreakdown,
    totalOrders: orders.length,
    openOrders,
    cancelledOrders,
    menuCount,
    lowStock,
    staff,
    totalExpenses,
    expenseCount: expenses.length,
    totalMenuOut,
    topMenuItems,
  });
};

exports.salesDaily = async (req, res) => {
  const rates = await getEffectiveTaxRates();
  const tableNumbers = await getTableNumbers(req.query.floorKey);
  const orders = await Order.find(buildPaidOrdersQuery(req.query.range, req.query.from, req.query.to, tableNumbers)).lean();
  const buckets = new Map();
  for (let i = 9; i <= 20; i += 1) buckets.set(i, 0);
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    if (buckets.has(h)) buckets.set(h, buckets.get(h) + normalizeOrderFinancials(o, rates).total);
  }
  const items = [...buckets.entries()].map(([hour, sales]) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = hour > 12 ? hour - 12 : hour;
    return { hour: `${h12}${suffix}`, sales };
  });
  res.json({ items });
};

exports.revenueWeekly = async (req, res) => {
  const tableNumbers = await getTableNumbers(req.query.floorKey);
  const orders = await Order.find(buildPaidOrdersQuery(req.query.range, req.query.from, req.query.to, tableNumbers)).lean();
  res.json({ items: buildRevenueSeries(req.query.range, orders, req.query.from, req.query.to) });
};

exports.topItems = async (req, res) => {
  const tableNumbers = await getTableNumbers(req.query.floorKey);
  const [orders] = await Promise.all([
    Order.find(buildPaidOrdersQuery(req.query.range, req.query.from, req.query.to, tableNumbers)).lean(),
  ]);
  const items = buildTopMenuItems(orders);
  res.json({ items });
};

exports.recentOrders = async (req, res) => {
  const floorKey = req.query.floorKey;
  const tableNumbers = await getTableNumbers(floorKey);
  const query = { status: { $ne: "cancelled" } };
  if (tableNumbers) query.table = { $in: tableNumbers };

  const items = await Order.find(query).sort({ createdAt: -1 }).limit(10).lean();
  res.json({
    items: items.map((o) => ({
      id: o.code,
      type: o.type,
      status: o.status,
      total: o.total,
      table: o.table,
      items: o.items || [],
      createdAt: o.createdAt,
    })),
  });
};
