const { Order, MenuItem, InventoryItem, Employee } = require("../models");

exports.summary = async (_req, res) => {
  const [orders, menuCount, lowStock, staff, cancelledOrders] = await Promise.all([
    Order.find({ status: { $ne: "cancelled" } }).lean(),
    MenuItem.countDocuments({}),
    InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$minStock"] } }),
    Employee.countDocuments({ status: "active" }),
    Order.countDocuments({ status: "cancelled" }),
  ]);
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  res.json({ revenue, totalOrders: orders.length, cancelledOrders, menuCount, lowStock, staff });
};

exports.salesDaily = async (_req, res) => {
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
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
};

exports.revenueWeekly = async (_req, res) => {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rows = labels.map((day) => ({ day, revenue: 0 }));
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
  for (const o of orders) {
    const dayIdx = new Date(o.createdAt).getDay();
    rows[dayIdx].revenue += Number(o.total || 0);
  }
  res.json({ items: rows });
};

exports.topItems = async (_req, res) => {
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
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
};

exports.recentOrders = async (_req, res) => {
  const items = await Order.find({ status: { $ne: "cancelled" } }).sort({ createdAt: -1 }).limit(10).lean();
  res.json({ items: items.map((o) => ({ id: o.code, type: o.type, status: o.status, total: o.total, table: o.table, items: o.items || [] })) });
};
