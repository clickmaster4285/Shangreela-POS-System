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

const TAX_RATES_TTL_MS = 60_000;
let taxRatesCache = { value: null, fetchedAt: 0 };

const getEffectiveTaxRates = async () => {
  const now = Date.now();
  if (taxRatesCache.value && now - taxRatesCache.fetchedAt < TAX_RATES_TTL_MS) {
    return taxRatesCache.value;
  }
  const row = await TaxConfig.findOne({}).lean();
  const gstRate = Number(row?.salesTaxRate ?? 16) / 100;
  const serviceChargeRate = Number(row?.serviceChargeRate ?? 5) / 100;
  const takeawayChargeRate = Number(row?.takeawayChargeRate ?? 5) / 100;
  const value = {
    gstRate: Number.isFinite(gstRate) ? gstRate : 0.16,
    serviceChargeRate: Number.isFinite(serviceChargeRate) ? serviceChargeRate : 0.05,
    takeawayChargeRate: Number.isFinite(takeawayChargeRate) ? takeawayChargeRate : 0.05,
  };
  taxRatesCache = { value, fetchedAt: now };
  return value;
};

/** Service charge applies only to dine-in; takeaway and delivery use subtotal + GST only. 
 *  Takeaway charge applies only to takeaway if enabled.
 */
const calculateGrandTotal = (
  items = [],
  tax = 0,
  discount = 0,
  gstEnabled = true,
  rates = { gstRate: 0.16, serviceChargeRate: 0.05, takeawayChargeRate: 0.05 },
  orderType = "dine-in",
  takeawayChargeEnabled = true
) => {
  const { subtotal, tax: taxAmount, discount: discountAmount, total: taxableTotal } = calculateOrderTotals(items, tax, discount);
  const gstRate = Number.isFinite(Number(rates.gstRate)) ? Number(rates.gstRate) : 0.16;
  const serviceChargeRate = Number.isFinite(Number(rates.serviceChargeRate)) ? Number(rates.serviceChargeRate) : 0.05;
  const takeawayChargeRate = Number.isFinite(Number(rates.takeawayChargeRate)) ? Number(rates.takeawayChargeRate) : 0.05;

  const applyServiceCharge = String(orderType) === "dine-in";
  const serviceCharge = applyServiceCharge ? Math.round(taxableTotal * serviceChargeRate) : 0;

  const applyTakeawayCharge = String(orderType) === "takeaway" && takeawayChargeEnabled;
  const takeawayCharge = applyTakeawayCharge ? Math.round(taxableTotal * takeawayChargeRate) : 0;

  const subtotalAfterCharges = taxableTotal + serviceCharge + takeawayCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterCharges * gstRate) : 0;
  const grandTotal = subtotalAfterCharges + gstAmount;

  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    gstAmount,
    serviceCharge,
    takeawayCharge,
    grandTotal,
  };
};

const invalidateTaxRatesCache = () => {
  taxRatesCache = { value: null, fetchedAt: 0 };
};

module.exports = {
  calculateOrderTotals,
  getEffectiveTaxRates,
  calculateGrandTotal,
  invalidateTaxRatesCache,
};
