const { emitPosChange } = require("../utils/realtime");
const { PrinterConfig } = require("../models");

exports.list = async (_req, res) => {
  const rows = await PrinterConfig.find({}).lean();
  res.json({ items: rows.map((r) => ({ ...r, id: String(r._id), slotId: r.slotId || r.id })) });
};

exports.replaceAll = async (req, res) => {
  await PrinterConfig.deleteMany({});
  await PrinterConfig.insertMany((req.body.items || []).map((i) => ({ ...i, slotId: i.id || i.slotId })));
  emitPosChange(["settings"]);
  res.json({ ok: true });
};
