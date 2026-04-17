const { emitPosChange } = require("../utils/realtime");
const { PosTabConfig } = require("../models");

exports.list = async (_req, res) => {
  const rows = await PosTabConfig.find({}).lean();
  res.json({ items: rows.map((r) => ({ ...r, id: String(r._id), slotId: r.slotId || r.id })) });
};

exports.replaceAll = async (req, res) => {
  await PosTabConfig.deleteMany({});
  await PosTabConfig.insertMany((req.body.items || []).map((i) => ({ ...i, slotId: i.id || i.slotId })));
  emitPosChange(["settings"]);
  res.json({ ok: true });
};
