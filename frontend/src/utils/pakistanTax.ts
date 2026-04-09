/** Provincial / federal sales tax (GST) — typical restaurant rate for display; confirm with SRB/FBR notices. */
export const PKR_GST_RATE = 0.16;

/** Service charge rate */
export const SERVICE_CHARGE_RATE = 0.05;

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
export function computePakistanTaxTotals(subtotal: number, discountAmount: number, gstEnabled: boolean = true): PakistanTaxBreakdown {
  const taxableAmount = Math.max(0, Math.round(subtotal) - Math.round(discountAmount));
  const serviceCharge = Math.round(taxableAmount * SERVICE_CHARGE_RATE);
  const subtotalAfterService = taxableAmount + serviceCharge;
  const gstAmount = gstEnabled ? Math.round(subtotalAfterService * PKR_GST_RATE) : 0;
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
