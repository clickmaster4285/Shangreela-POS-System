const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { getEffectiveTaxRates, calculateGrandTotal } = require("../utils/orderTotals");
const { emitPosChange } = require("../utils/realtime");
const { Delivery, Order } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  const statusQ = String(req.query.status || "").trim();
  if (statusQ && statusQ !== "all") {
    where.status = statusQ;
  }
  const [rows, total, countsAgg] = await Promise.all([
    Delivery.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Delivery.countDocuments(where),
    Delivery.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const statusCounts = {};
  for (const row of countsAgg) {
    if (row._id) statusCounts[row._id] = row.count;
  }

  const orderCodes = rows.map((d) => d.orderId).filter(Boolean);
  const orders = await Order.find({ code: { $in: orderCodes } })
    .select("code status items.quantity items.menuItem.price tax discount gstEnabled type")
    .lean();
  const orderByCode = new Map(orders.map((o) => [o.code, o]));
  const rates = await getEffectiveTaxRates();

  const payload = buildPaginatedResponse({
    items: rows.map((d) => {
      const linked = orderByCode.get(d.orderId);
      const totals = linked
        ? calculateGrandTotal(
            linked.items || [],
            linked.tax,
            linked.discount,
            linked.gstEnabled,
            rates,
            linked.type || "delivery"
          )
        : null;
      const displayTotal = totals ? totals.grandTotal : Number(d.total) || 0;
      return {
        ...d,
        orderStatus: linked?.status || "pending",
        total: displayTotal,
        id: String(d._id),
      };
    }),
    total,
    page,
    limit,
  });
  res.json({ ...payload, statusCounts });
};

exports.create = async (req, res) => {
  const row = await Delivery.create(req.body || {});
  emitPosChange(["deliveries", "orders", "dashboard"]);
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.patchStatus = async (req, res) => {
  await Delivery.findByIdAndUpdate(req.params.id, { status: req.body.status });
  emitPosChange(["deliveries", "orders", "dashboard"]);
  res.json({ ok: true });
};
