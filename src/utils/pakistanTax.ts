/** Provincial / federal sales tax (GST) — typical restaurant rate for display; confirm with SRB/FBR notices. */
export const PKR_GST_RATE = 0.16;
/** Further tax (FBR) on taxable value. */
export const PKR_FURTHER_TAX_RATE = 0.04;

export type PakistanTaxBreakdown = {
  taxableAmount: number;
  discountAmount: number;
  gstAmount: number;
  furtherTaxAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
};

/**
 * Pakistan-style breakdown: taxable value → GST @16% + Further tax @4% (on same base).
 * Rounds each tax line to whole rupees for receipt display.
 */
export function computePakistanTaxTotals(subtotal: number, discountAmount: number): PakistanTaxBreakdown {
  const taxableAmount = Math.max(0, Math.round(subtotal) - Math.round(discountAmount));
  const gstAmount = Math.round(taxableAmount * PKR_GST_RATE);
  const furtherTaxAmount = Math.round(taxableAmount * PKR_FURTHER_TAX_RATE);
  const totalTaxAmount = gstAmount + furtherTaxAmount;
  const grandTotal = taxableAmount + totalTaxAmount;
  return {
    taxableAmount,
    discountAmount: Math.round(discountAmount),
    gstAmount,
    furtherTaxAmount,
    totalTaxAmount,
    grandTotal,
  };
}
