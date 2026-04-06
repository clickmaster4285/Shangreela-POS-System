const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { Delivery, Order } = require("../models");

exports.list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Delivery.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Delivery.countDocuments({}),
  ]);

  const orderCodes = rows.map((d) => d.orderId).filter(Boolean);
  const orderStatuses = await Order.find({ code: { $in: orderCodes } }, { code: 1, status: 1 }).lean();
  const statusByCode = new Map(orderStatuses.map((o) => [o.code, o.status]));

  res.json(
    buildPaginatedResponse({
      items: rows.map((d) => ({
        ...d,
        orderStatus: statusByCode.get(d.orderId) || "pending",
        id: String(d._id),
      })),
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
