const { MobileConfig } = require("../models");

exports.getConfig = async (_req, res) => {
  let row = await MobileConfig.findOne({});
  if (!row) row = await MobileConfig.create({ pairingToken: "", downloadUrl: "", features: [] });
  res.json({ id: String(row._id), pairingToken: row.pairingToken, downloadUrl: row.downloadUrl, features: row.features || [] });
};

exports.newPairingToken = async (_req, res) => {
  let row = await MobileConfig.findOne({});
  const token = `PAIR-${Date.now().toString(36).toUpperCase()}`;
  if (!row) row = await MobileConfig.create({ pairingToken: token, downloadUrl: "", features: [] });
  else {
    row.pairingToken = token;
    await row.save();
  }
  res.json({ pairingToken: token });
};
