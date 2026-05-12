const { emitPosChange } = require("../utils/realtime");
const { Permission } = require("../models");

exports.getAll = async (_req, res) => {
  const rows = await Permission.find({}).lean();
  const config = {};
  for (const r of rows) config[r.role] = { pageAccess: r.pageAccess || [], actionPermissions: r.actionPermissions || [], dataVisibility: r.dataVisibility || [] };
  res.json(config);
};

exports.putAll = async (req, res) => {
  const config = req.body || {};
  for (const [role, value] of Object.entries(config)) {
    await Permission.findOneAndUpdate({ role }, { role, ...value }, { upsert: true, new: true });
  }
  emitPosChange(["permissions"]);
  res.json({ ok: true });
};
