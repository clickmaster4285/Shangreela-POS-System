import type { CartItem } from '@/data/mockData';
import { computePakistanTaxTotals, PKR_GST_RATE } from '@/utils/pakistanTax';

/** Config shown on printed tax invoices (align with FBR integration / business registration). */
export const RECEIPT_BUSINESS = {
  name: 'Shangreela Heights',
  tagline: 'Restaurant & Fine Dining',
  address: 'ling Mor Kahuta',
  city: 'Rawalpindi, Pakistan',
  phone: '+92 513314120 / +92 337-5454786',
  ntn: '1234567-8',
  strn: '12-34-5678-901-23',
  posRegistrationId: 'SRZ-POS-001',
  website: 'www.shangreelheights.com',
} as const;

const PRINT_FRAME_ID = 'pos-receipt-print-frame';

export interface ReceiptData {
  orderId: string;
  orderType: string;
  table?: number;
  tableName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  gstEnabled?: boolean;
  serviceCharge?: number;
  /** e.g. 0.16 */
  gstRate?: number;
  /** e.g. 0.05 */
  serviceChargeRate?: number;

  tax?: number;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
  /** ISO — order placed time shown on invoice; print time shown separately when set */
  orderCreatedAt?: string;
}

const fmtPKR = (v: number) =>
  `Rs. ${Math.round(v).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function printReceipt(data: ReceiptData) {
  const printedAt = new Date();
  const printDateStr = printedAt.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  const printTimeStr = printedAt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const orderPlaced = data.orderCreatedAt ? new Date(data.orderCreatedAt) : null;
  const orderValid = orderPlaced && !Number.isNaN(orderPlaced.getTime());
  const orderDateStr = orderValid
    ? orderPlaced!.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    : printDateStr;
  const orderTimeStr = orderValid
    ? orderPlaced!.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : printTimeStr;
  const fbrRef = `FBR-${data.orderId}-${printedAt.getTime().toString().slice(-6)}`;

  const discountAmt = data.discountPercent > 0 ? Math.round((data.subtotal * data.discountPercent) / 100) : Math.round(data.discount);
  const { taxableAmount, gstAmount, furtherTaxAmount, totalTaxAmount, serviceCharge, grandTotal } = computePakistanTaxTotals(
    data.subtotal,
    discountAmt,
    data.gstEnabled ?? true,
    {
      gstRate: data.gstRate ?? PKR_GST_RATE,
      serviceChargeRate: data.serviceChargeRate,
    },
    { applyServiceCharge: String(data.orderType || '').toLowerCase() === 'dine-in' }
  );

  const gstPct = Math.round(((data.gstRate ?? PKR_GST_RATE) || 0) * 100);

  const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice — ${esc(data.orderId)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif;
      width: 72mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 10mm 6mm;
      color: #000;
      background: #fff;
      font-size: 10px;
      line-height: 1.35;
    }
    .doc-title {
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #000;
      border: 1px solid #000;
      padding: 4px 6px;
      margin-bottom: 8px;
    }
    .brand { text-align: center; margin-bottom: 8px; }
    .brand h1 {
      font-family: 'IBM Plex Serif', Georgia, serif;
      font-size: 15px;
      font-weight: 700;
      color: #000;
      margin-bottom: 2px;
    }
    .brand .tag { font-size: 9px; color: #000; }
    .brand .addr { font-size: 9px; color: #000; margin-top: 4px; line-height: 1.4; }
    .fbr-box {
      border: 1px dashed #000;
      padding: 6px 8px;
      margin: 8px 0;
      background: #fff;
    }
    .fbr-box .label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #000; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 3px; }
    .fbr-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; gap: 8px; }
    .fbr-row span:first-child { color: #000; flex-shrink: 0; }
    .fbr-row span:last-child { font-weight: 600; text-align: right; word-break: break-all; }
    .meta { margin: 8px 0; font-size: 9px; }
    .meta .row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #000; }
    .meta .row:last-child { border-bottom: none; }
    .section-h {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #000;
      margin: 10px 0 4px;
      padding-bottom: 2px;
      border-bottom: 2px solid #000;
    }
    .items { margin: 6px 0; }
    .item-row { display: flex; justify-content: space-between; gap: 6px; font-size: 9px; padding: 3px 0; border-bottom: 1px dotted #000; }
    .item-row .qty { color: #000; min-width: 22px; }
    .item-row .name { flex: 1; font-weight: 600; }
    .item-row .amt { font-weight: 600; text-align: right; white-space: nowrap; }
    .item-notes { font-size: 8px; color: #000; font-style: italic; padding-left: 28px; margin-top: -1px; margin-bottom: 2px; }
    .tax-table { width: 100%; margin: 8px 0; font-size: 9px; border-collapse: collapse; }
    .tax-table td { padding: 3px 0; vertical-align: top; }
    .tax-table td:last-child { text-align: right; font-weight: 600; }
    .tax-table tr.sub td { color: #000; }
    .tax-table tr.bold td { font-weight: 700; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; }
    .tax-note { font-size: 7.5px; color: #000; margin-top: 6px; line-height: 1.45; text-align: justify; }
    .payment {
      text-align: center;
      font-size: 9px;
      font-weight: 600;
      padding: 6px;
      margin: 8px 0;
      background: #fff;
      border: 1px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; }
    .footer .thanks { font-family: 'IBM Plex Serif', serif; font-size: 11px; font-weight: 600; color: #000; margin-bottom: 4px; }
    .footer p { font-size: 8px; color: #000; line-height: 1.5; }
    @media print {
      body { width: 72mm; padding: 4mm; }
      @page { margin: 0; size: 72mm auto; }
    }
  </style>
</head>
<body>
  <div class="doc-title">Tax invoice — Computerized POS</div>

  <div class="brand">
    <h1>${esc(RECEIPT_BUSINESS.name)}</h1>
    <div class="tag">${esc(RECEIPT_BUSINESS.tagline)}</div>
    <div class="addr">${esc(RECEIPT_BUSINESS.address)}<br />${esc(RECEIPT_BUSINESS.city)}<br />Tel: ${esc(RECEIPT_BUSINESS.phone)}</div>
  </div>



  <div class="meta">
    <div class="row"><span>Order / bill no.</span><span>${esc(data.orderId)}</span></div>
    <div class="row"><span>Transaction type</span><span style="text-transform:capitalize">${esc(data.orderType)}</span></div>
    ${data.table !== undefined ? `<div class="row"><span>Table</span><span>${data.tableName ?? data.table}</span></div>` : ''}
    ${data.customerName ? `<div class="row"><span>Customer</span><span>${esc(data.customerName)}</span></div>` : ''}
    <div class="row"><span>Order date</span><span>${esc(orderDateStr)}</span></div>
    <div class="row"><span>Order time</span><span>${esc(orderTimeStr)}</span></div>
    ${
      orderValid
        ? `<div class="row"><span>Printed</span><span>${esc(printDateStr)} ${esc(printTimeStr)}</span></div>`
        : ''
    }
  </div>

  <div class="section-h">Line items</div>
  <div class="items">
    ${data.items
      .map(
        item => `
      <div class="item-row">
        <span class="qty">${item.quantity}×</span>
        <span class="name">
          ${esc(item.menuItem.name)}
          ${item.extraName ? `<br/><span style="font-size:8px;font-weight:400;font-style:italic">+ ${esc(item.extraName)} (Rs. ${item.extraPrice})</span>` : ''}
        </span>
        <span class="amt">${fmtPKR((Number(item.menuItem.price) + Number(item.extraPrice || 0)) * item.quantity)}</span>
      </div>
      ${item.notes ? `<div class="item-notes">Note: ${esc(item.notes)}</div>` : ''}
    `
      )
      .join('')}
  </div>

  <div class="section-h">Amount & taxes (PKR)</div>
  <table class="tax-table" role="presentation">
    <tr class="sub"><td>Value of sales (before tax)</td><td>${fmtPKR(data.subtotal)}</td></tr>
    ${
      discountAmt > 0
        ? `<tr class="sub"><td>Discount${data.discountPercent > 0 ? ` (${data.discountPercent}%)` : ''}</td><td>−${fmtPKR(discountAmt)}</td></tr>`
        : ''
    }
    <tr class="sub"><td>Taxable value</td><td>${fmtPKR(taxableAmount)}</td></tr>
    ${
      String(data.orderType || '').toLowerCase() === 'dine-in'
        ? `<tr class="sub"><td>Service charge @ ${Math.round(((data.serviceChargeRate ?? 0.05) || 0) * 100)}%</td><td>${fmtPKR(serviceCharge)}</td></tr>`
        : ''
    }
    ${(data.gstEnabled ?? true) ? `<tr class="sub"><td>Sales tax (GST) @ ${gstPct}%</td><td>${fmtPKR(gstAmount)}</td></tr>` : ''}
    <tr class="sub"><td>Total taxes</td><td>${fmtPKR(totalTaxAmount)}</td></tr>
    <tr class="bold"><td>Total payable</td><td>${fmtPKR(grandTotal)}</td></tr>
  </table>


  ${data.paymentMethod ? `<div class="payment">Payment: ${esc(data.paymentMethod)}</div>` : ''}

  <div class="footer">
    <div class="thanks">Thank you for dining with us</div>
    <p>${esc(RECEIPT_BUSINESS.website)}</p>
    <p style="margin-top:6px">This document is generated electronically and is valid without signature unless required by law.</p>
  </div>
</body>
</html>`;

  let iframe = document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_FRAME_ID;
    iframe.title = 'Print receipt';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;visibility:hidden;';
    document.body.appendChild(iframe);
  }

  const win = iframe.contentWindow;
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(receiptHtml);
  doc.close();

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
  }, 150);
}
