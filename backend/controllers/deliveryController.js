const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { getEffectiveTaxRates, calculateGrandTotal } = require("../utils/orderTotals");
const { Delivery, Order } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Delivery.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Delivery.countDocuments({}),
  ]);

  const orderCodes = rows.map((d) => d.orderId).filter(Boolean);
  const orders = await Order.find({ code: { $in: orderCodes } }).lean();
  const orderByCode = new Map(orders.map((o) => [o.code, o]));
  const rates = await getEffectiveTaxRates();

  res.json(
    buildPaginatedResponse({
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
    })
  );
};

exports.create = async (req, res) => {
  const row = await Delivery.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

exports.patchStatus = async (req, res) => {
  await Delivery.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ ok: true });
};
