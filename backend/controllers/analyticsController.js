const { Order } = require("../models");

exports.summary = async (_req, res) => {
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  res.json({ revenue, totalOrders: orders.length, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0 });
};

exports.orderTypeBreakdown = async (_req, res) => {
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
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
};

exports.monthlyTrend = async (_req, res) => {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rows = labels.map((month) => ({ month, revenue: 0 }));
  const orders = await Order.find({ status: { $ne: "cancelled" } }).lean();
  for (const o of orders) rows[new Date(o.createdAt).getMonth()].revenue += Number(o.total || 0);
  res.json({ items: rows });
};
