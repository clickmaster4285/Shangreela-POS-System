const { TaxConfig } = require("../models");

const calculateOrderTotals = (items = [], tax = 0, discount = 0) => {
  const subtotal = Array.isArray(items)
    ? items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.menuItem?.price || 0), 0)
    : 0;
  const taxAmount = Number(tax || 0);
  const discountAmount = Number(discount || 0);
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    total: Math.max(0, subtotal + taxAmount - discountAmount),
  };
};

const getEffectiveTaxRates = async () => {
  const row = await TaxConfig.findOne({}).lean();
  const gstRate = Number(row?.salesTaxRate ?? 16) / 100;
  const serviceChargeRate = Number(row?.serviceChargeRate ?? 5) / 100;
  return {
    gstRate: Number.isFinite(gstRate) ? gstRate : 0.16,
    serviceChargeRate: Number.isFinite(serviceChargeRate) ? serviceChargeRate : 0.05,
  };
};

/** Service charge applies only to dine-in; takeaway and delivery use subtotal + GST only. */
const calculateGrandTotal = (
  items = [],
  tax = 0,
  discount = 0,
  gstEnabled = true,
  rates = { gstRate: 0.16, serviceChargeRate: 0.05 },
  orderType = "dine-in"
) => {
  const { subtotal, tax: taxAmount, discount: discountAmount, total: taxableTotal } = calculateOrderTotals(items, tax, discount);
  const gstRate = Number.isFinite(Number(rates.gstRate)) ? Number(rates.gstRate) : 0.16;
  const serviceChargeRate = Number.isFinite(Number(rates.serviceChargeRate)) ? Number(rates.serviceChargeRate) : 0.05;
  const applyServiceCharge = String(orderType) === "dine-in";
  const serviceCharge = applyServiceCharge ? Math.round(taxableTotal * serviceChargeRate) : 0;
  const subtotalAfterService = taxableTotal + serviceCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterService * gstRate) : 0;
  const grandTotal = subtotalAfterService + gstAmount;
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    gstAmount,
    serviceCharge,
    grandTotal,
  };
};

module.exports = {
  calculateOrderTotals,
  getEffectiveTaxRates,
  calculateGrandTotal,
};
