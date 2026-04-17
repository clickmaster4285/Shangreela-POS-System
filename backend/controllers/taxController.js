const { emitPosChange } = require("../utils/realtime");
const { invalidateTaxRatesCache } = require("../utils/orderTotals");
const { TaxConfig } = require("../models");

exports.get = async (_req, res) => {
  let row = await TaxConfig.findOne({});
  if (!row) row = await TaxConfig.create({ salesTaxRate: 16, serviceChargeRate: 5, withholdingLabel: "As per FBR" });
  res.json({ id: String(row._id), salesTaxRate: row.salesTaxRate, serviceChargeRate: row.serviceChargeRate, withholdingLabel: row.withholdingLabel });
};

exports.put = async (req, res) => {
  const existing = await TaxConfig.findOne({});
  const row = existing ? await TaxConfig.findByIdAndUpdate(existing._id, req.body || {}, { new: true }) : await TaxConfig.create(req.body || {});
  invalidateTaxRatesCache();
  emitPosChange(["settings"]);
  res.json({ id: String(row._id), salesTaxRate: row.salesTaxRate, serviceChargeRate: row.serviceChargeRate, withholdingLabel: row.withholdingLabel });
};
