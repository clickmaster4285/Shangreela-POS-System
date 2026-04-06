/** Provincial / federal sales tax (GST) — typical restaurant rate for display; confirm with SRB/FBR notices. */
export const PKR_GST_RATE = 0.16;

export type PakistanTaxBreakdown = {
  taxableAmount: number;
  discountAmount: number;
  gstAmount: number;
  furtherTaxAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
};

/**
 * Pakistan-style breakdown: taxable value → GST @16% (optional).
 * Rounds each tax line to whole rupees for receipt display.
 */
export function computePakistanTaxTotals(subtotal: number, discountAmount: number, gstEnabled: boolean = true): PakistanTaxBreakdown {
  const taxableAmount = Math.max(0, Math.round(subtotal) - Math.round(discountAmount));
  const gstAmount = gstEnabled ? Math.round(taxableAmount * PKR_GST_RATE) : 0;
  const furtherTaxAmount = 0;
  const totalTaxAmount = gstAmount;
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
