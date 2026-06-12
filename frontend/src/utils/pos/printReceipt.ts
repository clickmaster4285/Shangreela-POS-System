import type { CartItem } from '@/data/pos/mockData';
import { getBackendOrigin } from '@/lib/api/api';
import { computePakistanTaxTotals, PKR_GST_RATE } from '@/utils/pos/pakistanTax';

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

export interface ReceiptPaymentDetails {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  easypaisaNumber?: string;
  easypaisaAccountName?: string;
  bankQrImageUrl?: string;
  easypaisaQrImageUrl?: string;
  showBankOnReceipt?: boolean;
  showEasypaisaOnReceipt?: boolean;
}

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
  takeawayCharge?: number;
  takeawayChargeEnabled?: boolean;
  gstRate?: number;
  serviceChargeRate?: number;
  takeawayChargeRate?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderCreatedAt?: string;
  amountPaid?: number;
  advanceAmount?: number;
  remainingAmount?: number;
  changeDue?: number;
  isPaid?: boolean;
  cashierName?: string;
  paymentDetails?: ReceiptPaymentDetails;
}

const fmtPKR = (v: number) =>
  `Rs. ${Math.round(v).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const resolveUploadUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getBackendOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};

const buildPaymentDetailsHtml = (details?: ReceiptPaymentDetails) => {
  if (!details) return '';

  const showBank = details.showBankOnReceipt !== false;
  const showEasypaisa = details.showEasypaisaOnReceipt !== false;

  const hasBank = showBank && Boolean(details.bankName || details.accountTitle || details.accountNumber || details.iban || details.bankQrImageUrl);
  const hasEasypaisa = showEasypaisa && Boolean(details.easypaisaNumber || details.easypaisaAccountName || details.easypaisaQrImageUrl);
  if (!hasBank && !hasEasypaisa) return '';

  const bankRows = hasBank
    ? `
      <div class="pay-block">
        <div class="pay-title">Bank transfer</div>
        ${details.bankName ? `<div class="pay-row"><span>Bank</span><span>${esc(details.bankName)}</span></div>` : ''}
        ${details.accountTitle ? `<div class="pay-row"><span>Account title</span><span>${esc(details.accountTitle)}</span></div>` : ''}
        ${details.accountNumber ? `<div class="pay-row"><span>Account no.</span><span>${esc(details.accountNumber)}</span></div>` : ''}
        ${details.iban ? `<div class="pay-row"><span>IBAN</span><span>${esc(details.iban)}</span></div>` : ''}
        ${details.bankQrImageUrl ? `<div class="qr-wrap"><img src="${esc(resolveUploadUrl(details.bankQrImageUrl))}" alt="Bank QR" class="qr-img" /></div>` : ''}
      </div>`
    : '';

  const easypaisaRows = hasEasypaisa
    ? `
      <div class="pay-block">
        <div class="pay-title">EasyPaisa</div>
        ${details.easypaisaAccountName ? `<div class="pay-row"><span>Account name</span><span>${esc(details.easypaisaAccountName)}</span></div>` : ''}
        ${details.easypaisaNumber ? `<div class="pay-row"><span>Mobile no.</span><span>${esc(details.easypaisaNumber)}</span></div>` : ''}
        ${details.easypaisaQrImageUrl ? `<div class="qr-wrap"><img src="${esc(resolveUploadUrl(details.easypaisaQrImageUrl))}" alt="EasyPaisa QR" class="qr-img" /></div>` : ''}
      </div>`
    : '';

  return `
    <div class="section-h">Payment details</div>
    <div class="payment-details">
      ${bankRows}
      ${easypaisaRows}
    </div>`;
};

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
  const { taxableAmount, gstAmount, furtherTaxAmount, totalTaxAmount, serviceCharge, takeawayCharge, grandTotal } = computePakistanTaxTotals(
    data.subtotal,
    discountAmt,
    data.gstEnabled ?? true,
    {
      gstRate: data.gstRate ?? PKR_GST_RATE,
      serviceChargeRate: data.serviceChargeRate,
      takeawayChargeRate: data.takeawayChargeRate,
    },
    { 
      applyServiceCharge: String(data.orderType || '').toLowerCase() === 'dine-in',
      applyTakeawayCharge: String(data.orderType || '').toLowerCase() === 'takeaway' && data.takeawayChargeEnabled !== false
    }
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
      position: relative;
    }
    .paid-stamp {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 20;
    }
    .paid-stamp span {
      font-size: 64px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #b91c1c;
      border: 6px double #b91c1c;
      padding: 4px 24px;
      border-radius: 4px;
      transform: rotate(-25deg);
      opacity: 0.8;
      text-transform: uppercase;
      font-family: sans-serif;
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
    .payment-details { margin: 8px 0; font-size: 9px; }
    .pay-block { border: 1px dashed #000; padding: 6px 8px; margin-bottom: 6px; }
    .pay-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .pay-row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
    .pay-row span:first-child { color: #000; flex-shrink: 0; }
    .pay-row span:last-child { font-weight: 600; text-align: right; word-break: break-all; }
    .qr-wrap { text-align: center; margin-top: 6px; }
    .qr-img { width: 88px; height: 88px; object-fit: contain; border: 1px solid #000; padding: 2px; background: #fff; }
    @media print {
      body { width: 72mm; padding: 4mm; }
      @page { margin: 0; size: 72mm auto; }
    }
  </style>
</head>
<body>
  ${data.isPaid ? '<div class="paid-stamp"><span>PAID</span></div>' : ''}
  <div class="doc-title">Tax invoice — Computerized POS</div>

  <div class="brand">
    <h1>${esc(RECEIPT_BUSINESS.name)}</h1>
    <div class="tag">${esc(RECEIPT_BUSINESS.tagline)}</div>
    <div class="addr">${esc(RECEIPT_BUSINESS.address)}<br />${esc(RECEIPT_BUSINESS.city)}<br />Tel: ${esc(RECEIPT_BUSINESS.phone)}</div>
  </div>



  <div class="meta">
    <div class="row"><span>Order / bill no.</span><span>${esc(data.orderId)}</span></div>
    <div class="row"><span>Transaction type</span><span style="text-transform:capitalize">${esc(data.orderType)}</span></div>
    ${data.table !== undefined ? `<div class="row" style=""><span style="font-weight:700; font-size:10px;">Table</span><span style="font-weight:900; font-size:12px;">${data.tableName ?? data.table}</span></div>` : ''}
    ${data.customerName ? `<div class="row"><span>Customer</span><span>${esc(data.customerName)}</span></div>` : ''}
    ${data.customerPhone ? `<div class="row"><span>Phone</span><span>${esc(data.customerPhone)}</span></div>` : ''}
    ${data.deliveryAddress ? `<div class="row"><span>Address</span><span>${esc(data.deliveryAddress)}</span></div>` : ''}
    <div class="row"><span>Order placed</span><span>${esc(orderDateStr)} ${esc(orderTimeStr)}</span></div>
    ${
      orderValid
        ? `<div class="row"><span>Printed</span><span>${esc(printDateStr)} ${esc(printTimeStr)}</span></div>`
        : ''
    }
    ${data.cashierName ? `<div class="row"><span>Cashier</span><span>${esc(data.cashierName)}</span></div>` : ''}
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
    ${
      String(data.orderType || '').toLowerCase() === 'takeaway' && takeawayCharge > 0
        ? `<tr class="sub"><td>Takeaway charge @ ${Math.round(((data.takeawayChargeRate ?? 0.05) || 0) * 100)}%</td><td>${fmtPKR(takeawayCharge)}</td></tr>`
        : ''
    }
    ${(data.gstEnabled ?? true) ? `<tr class="sub"><td>Sales tax (GST) @ ${gstPct}%</td><td>${fmtPKR(gstAmount)}</td></tr>` : ''}
    <tr class="sub"><td>Total taxes</td><td>${fmtPKR(totalTaxAmount)}</td></tr>
    <tr class="bold"><td>Total (PKR)</td><td>${fmtPKR(grandTotal)}</td></tr>
    ${
      data.advanceAmount 
        ? `<tr class="sub"><td>Advance Paid</td><td>${fmtPKR(data.advanceAmount)}</td></tr>
           <tr class="bold"><td>Balance Payable</td><td>${fmtPKR(data.remainingAmount ?? (grandTotal - data.advanceAmount))}</td></tr>` 
        : ''
    }
    ${
      data.amountPaid !== undefined
        ? `<tr class="sub"><td style="padding-top:4px">Receiving Amount</td><td style="padding-top:4px">${fmtPKR(data.amountPaid)}</td></tr>`
        : ''
    }
    ${
      data.changeDue !== undefined
        ? `<tr class="sub"><td>Change Due (Return)</td><td>${fmtPKR(data.changeDue)}</td></tr>`
        : ''
    }
  </table>


  ${data.paymentMethod ? `<div class="payment">Payment: ${esc(data.paymentMethod)}</div>` : ''}

  ${buildPaymentDetailsHtml(data.paymentDetails)}

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

  const waitForIframeImages = (frameWindow: Window, timeoutMs = 2500) => {
    const images = Array.from(frameWindow.document.images) as HTMLImageElement[];
    if (images.length === 0) return Promise.resolve();

    return new Promise<void>((resolve) => {
      let remaining = images.length;
      let finished = false;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        images.forEach((img) => {
          img.removeEventListener('load', onLoadOrError);
          img.removeEventListener('error', onLoadOrError);
        });
        resolve();
      };

      const onLoadOrError = () => {
        remaining -= 1;
        if (remaining <= 0) cleanup();
      };

      images.forEach((img) => {
        if (img.complete) {
          remaining -= 1;
        } else {
          img.addEventListener('load', onLoadOrError);
          img.addEventListener('error', onLoadOrError);
        }
      });

      if (remaining <= 0) {
        cleanup();
        return;
      }

      const timeoutId = window.setTimeout(cleanup, timeoutMs);
    });
  };

  waitForIframeImages(win)
    .then(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    });
}
