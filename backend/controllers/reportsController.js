const { Order, Delivery } = require("../models");

exports.weeklySales = async (_req, res) => {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = labels.map((day) => ({ day, revenue: 0 }));
  const orders = await Order.find({}).lean();
  for (const o of orders) {
    const idx = (new Date(o.createdAt).getDay() + 6) % 7;
    rows[idx].revenue += Number(o.total || 0);
  }
  res.json({ items: rows });
};

exports.topItems = async (_req, res) => {
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
};

exports.outdoorDelivery = async (_req, res) => {
  const rows = await Delivery.find({}).lean();
  const map = new Map();
  for (const r of rows) {
    const supervisor = r.assignedRider || "Unassigned";
    const prev = map.get(supervisor) || { supervisor, shiftLabel: "Current", cashCollected: 0, cardDigital: 0, deliveriesCompleted: 0, codPending: 0 };
    prev.cashCollected += Number(r.total || 0);
    if (r.status === "delivered") prev.deliveriesCompleted += 1;
    if (r.status !== "delivered") prev.codPending += 1;
    map.set(supervisor, prev);
  }
  res.json({ items: [...map.values()] });
};
