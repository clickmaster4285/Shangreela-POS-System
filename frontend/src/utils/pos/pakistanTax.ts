/** Provincial / federal sales tax (GST) — typical restaurant rate for display; confirm with SRB/FBR notices. */
export const PKR_GST_RATE = 0.16;

/** Service charge rate */
export const SERVICE_CHARGE_RATE = 0.05;

/** Takeaway charge rate */
export const TAKEAWAY_CHARGE_RATE = 0.05;

export type PakistanTaxRates = {
  /** e.g. 0.16 for 16% */
  gstRate: number;
  /** e.g. 0.05 for 5% */
  serviceChargeRate: number;
  /** e.g. 0.05 for 5% */
  takeawayChargeRate: number;
};

export type PakistanTaxOptions = {
  /** If false, service charge will be zero (e.g. takeaway/delivery) */
  applyServiceCharge?: boolean;
  /** If true, takeaway charge will be applied */
  applyTakeawayCharge?: boolean;
};

export type PakistanTaxBreakdown = {
  taxableAmount: number;
  discountAmount: number;
  gstAmount: number;
  furtherTaxAmount: number;
  totalTaxAmount: number;
  serviceCharge: number;
  takeawayCharge: number;
  grandTotal: number;
};

/**
 * Pakistan-style breakdown: taxable value → service charge @5% → GST @16% on total.
 * Rounds each tax line to whole rupees for receipt display.
 */
export function computePakistanTaxTotals(
  subtotal: number,
  discountAmount: number,
  gstEnabled: boolean = true,
  rates: Partial<PakistanTaxRates> = {}
  ,
  options: PakistanTaxOptions = {}
): PakistanTaxBreakdown {
  const gstRate = Number.isFinite(rates.gstRate as number) ? Number(rates.gstRate) : PKR_GST_RATE;
  const serviceChargeRate = Number.isFinite(rates.serviceChargeRate as number) ? Number(rates.serviceChargeRate) : SERVICE_CHARGE_RATE;
  const takeawayChargeRate = Number.isFinite(rates.takeawayChargeRate as number) ? Number(rates.takeawayChargeRate) : TAKEAWAY_CHARGE_RATE;

  const taxableAmount = Math.max(0, Math.round(subtotal) - Math.round(discountAmount));

  const applyServiceCharge = options.applyServiceCharge !== false;
  const serviceCharge = applyServiceCharge ? Math.round(taxableAmount * serviceChargeRate) : 0;

  const applyTakeawayCharge = !!options.applyTakeawayCharge;
  const takeawayCharge = applyTakeawayCharge ? Math.round(taxableAmount * takeawayChargeRate) : 0;

  const subtotalAfterCharges = taxableAmount + serviceCharge + takeawayCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterCharges * gstRate) : 0;
  const furtherTaxAmount = 0;
  const totalTaxAmount = gstAmount;
  const grandTotal = subtotalAfterCharges + totalTaxAmount;

  return {
    taxableAmount,
    discountAmount: Math.round(discountAmount),
    gstAmount,
    furtherTaxAmount,
    totalTaxAmount,
    serviceCharge,
    takeawayCharge,
    grandTotal,
  };
}

/** Grand total for list cards — same rules as POS / Billing receipt (items, stored discount, GST, dine-in service). */
export function billBreakdownForOrder(
  order: {
    items: { menuItem: { price: number }; quantity: number }[];
    discount?: number;
    gstEnabled?: boolean;
    type: string;
    takeawayChargeEnabled?: boolean;
  },
  rates: Partial<PakistanTaxRates> = {}
): PakistanTaxBreakdown {
  const subtotal = order.items.reduce((s, i: any) => s + (Number(i.menuItem.price) + Number(i.extraPrice || 0)) * Number(i.quantity), 0);
  return computePakistanTaxTotals(
    subtotal,
    Number(order.discount || 0),
    order.gstEnabled !== false,
    rates,
    { 
      applyServiceCharge: order.type === 'dine-in',
      applyTakeawayCharge: order.type === 'takeaway' && order.takeawayChargeEnabled !== false
    }
  );
}
