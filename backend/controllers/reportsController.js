const { Order, Delivery } = require("../models");

const parseDateRange = (range) => {
  const now = new Date();
  if (!range || range === "all") return null;

  const start = new Date(now);
  switch (String(range)) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return null;
  }
  return { $gte: start };
};

const buildOrderQuery = (range) => {
  const query = { status: { $ne: "cancelled" } };
  const dateFilter = parseDateRange(range);
  if (dateFilter) query.createdAt = dateFilter;
  return query;
};

const sumOrderTotal = (order) => Number(order.total || 0);

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const buildRevenueSeries = (range, orders) => {
  const now = new Date();
  const r = String(range || "week");

  if (r === "today") {
    const buckets = new Map();
    for (let i = 9; i <= 20; i += 1) buckets.set(i, 0);
    for (const o of orders) {
      const h = new Date(o.createdAt).getHours();
      if (buckets.has(h)) buckets.set(h, buckets.get(h) + sumOrderTotal(o));
    }
    return [...buckets.entries()].map(([hour, revenue]) => {
      const suffix = hour >= 12 ? "PM" : "AM";
      const h12 = hour > 12 ? hour - 12 : hour;
      return { day: `${h12}${suffix}`, revenue };
    });
  }

  if (r === "week") {
    const labels = [];
    const totals = new Map();
    for (let i = 6; i >= 0; i -= 1) {
      const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit" });
      labels.push({ key, label });
      totals.set(key, 0);
    }
    for (const o of orders) {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) totals.set(key, totals.get(key) + sumOrderTotal(o));
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
      if (totals.has(key)) totals.set(key, totals.get(key) + sumOrderTotal(o));
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
      if (d.getFullYear() === now.getFullYear()) rows[d.getMonth()].revenue += sumOrderTotal(o);
    }
    return rows;
  }

  // fallback
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = labels.map((day) => ({ day, revenue: 0 }));
  for (const o of orders) {
    const idx = (new Date(o.createdAt).getDay() + 6) % 7;
    rows[idx].revenue += sumOrderTotal(o);
  }
  return rows;
};

exports.weeklySales = async (req, res) => {
  const orders = await Order.find(buildOrderQuery(req.query.range)).lean();
  res.json({ items: buildRevenueSeries(req.query.range, orders) });
};

exports.topItems = async (req, res) => {
  const orders = await Order.find(buildOrderQuery(req.query.range)).lean();
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
};

exports.outdoorDelivery = async (_req, res) => {
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
};
