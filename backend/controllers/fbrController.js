const { FbrConfig } = require("../models");

exports.getConfig = async (_req, res) => {
  let row = await FbrConfig.findOne({});
  if (!row) row = await FbrConfig.create({ ntn: "", posId: "", sandbox: true, linked: false });
  res.json({ id: String(row._id), ntn: row.ntn, posId: row.posId, sandbox: row.sandbox, linked: row.linked });
};

exports.putConfig = async (req, res) => {
  const existing = await FbrConfig.findOne({});
  const row = existing
    ? await FbrConfig.findByIdAndUpdate(existing._id, req.body || {}, { new: true })
    : await FbrConfig.create(req.body || {});
  res.json({ id: String(row._id), ntn: row.ntn, posId: row.posId, sandbox: row.sandbox, linked: row.linked });
};

exports.testConnection = async (_req, res) => {
  const row = await FbrConfig.findOne({});
  if (row) {
    row.linked = true;
    await row.save();
  }
  res.json({ ok: true, message: "Connection successful (simulated)" });
};
