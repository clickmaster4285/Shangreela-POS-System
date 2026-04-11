const { Order } = require("../models");
const { buildPaidOrdersQuery } = require("../utils/reportingQueries");

exports.summary = async (req, res) => {
  const range = String(req.query.range || "all");
  const orders = await Order.find(buildPaidOrdersQuery(range)).lean();
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discount || 0), 0);
  const n = orders.length;
  res.json({ revenue, totalOrders: n, avgOrder: n ? Math.round(revenue / n) : 0, totalDiscount });
};

exports.orderTypeBreakdown = async (req, res) => {
  const range = String(req.query.range || "all");
  const orders = await Order.find(buildPaidOrdersQuery(range)).lean();
  const total = orders.length || 1;
  const counts = { "dine-in": 0, delivery: 0, takeaway: 0 };
  const revenue = { "dine-in": 0, delivery: 0, takeaway: 0 };
  for (const o of orders) {
    counts[o.type] += 1;
    revenue[o.type] += Number(o.total || 0);
  }
  res.json({
    items: [
      {
        name: "Dine-in",
        value: Math.round((counts["dine-in"] / total) * 100),
        revenue: revenue["dine-in"],
        count: counts["dine-in"],
      },
      {
        name: "Delivery",
        value: Math.round((counts.delivery / total) * 100),
        revenue: revenue.delivery,
        count: counts.delivery,
      },
      {
        name: "Takeaway",
        value: Math.round((counts.takeaway / total) * 100),
        revenue: revenue.takeaway,
        count: counts.takeaway,
      },
    ],
  });
};

exports.monthlyTrend = async (_req, res) => {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rows = labels.map((month) => ({ month, revenue: 0 }));
  const now = new Date();
  const y = now.getFullYear();
  const orders = await Order.find({
    status: "completed",
    createdAt: { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59, 999) },
  }).lean();
  for (const o of orders) rows[new Date(o.createdAt).getMonth()].revenue += Number(o.total || 0);
  res.json({ items: rows });
};
