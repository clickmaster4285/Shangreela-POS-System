/** Provincial / federal sales tax (GST) — typical restaurant rate for display; confirm with SRB/FBR notices. */
export const PKR_GST_RATE = 0.16;

/** Service charge rate */
export const SERVICE_CHARGE_RATE = 0.05;

export type PakistanTaxRates = {
  /** e.g. 0.16 for 16% */
  gstRate: number;
  /** e.g. 0.05 for 5% */
  serviceChargeRate: number;
};

export type PakistanTaxOptions = {
  /** If false, service charge will be zero (e.g. takeaway/delivery) */
  applyServiceCharge?: boolean;
};

export type PakistanTaxBreakdown = {
  taxableAmount: number;
  discountAmount: number;
  gstAmount: number;
  furtherTaxAmount: number;
  totalTaxAmount: number;
  serviceCharge: number;
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
  const taxableAmount = Math.max(0, Math.round(subtotal) - Math.round(discountAmount));
  const applyServiceCharge = options.applyServiceCharge !== false;
  const serviceCharge = applyServiceCharge ? Math.round(taxableAmount * serviceChargeRate) : 0;
  const subtotalAfterService = taxableAmount + serviceCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterService * gstRate) : 0;
  const furtherTaxAmount = 0;
  const totalTaxAmount = gstAmount;
  const grandTotal = subtotalAfterService + totalTaxAmount;
  return {
    taxableAmount,
    discountAmount: Math.round(discountAmount),
    gstAmount,
    furtherTaxAmount,
    totalTaxAmount,
    serviceCharge,
    grandTotal,
  };
}
