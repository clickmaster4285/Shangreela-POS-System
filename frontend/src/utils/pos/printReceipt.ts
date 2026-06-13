import type { CartItem } from '@/data/pos/mockData';
import { getBackendOrigin } from '@/lib/api/api';
import { computePakistanTaxTotals, PKR_GST_RATE } from '@/utils/pos/pakistanTax';

/** Config shown on printed tax invoices (align with FBR integration / business registration). */
export const RECEIPT_BUSINESS = {
   name: 'Shangreela Heights',
   tagline: 'Restaurant & Fine Dining',
   address: 'ling Mor Kahuta, Rawalpindi',
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
        <div class="pay-split">
          <div class="pay-qr-side">
            ${details.bankQrImageUrl ? `<img src="${esc(resolveUploadUrl(details.bankQrImageUrl))}" alt="Bank QR" class="qr-img" />` : ''}
          </div>
          <div class="pay-values-side">
            ${details.bankName ? `<div class="pay-val">${esc(details.bankName)}</div>` : ''}
            ${details.accountTitle ? `<div class="pay-val">${esc(details.accountTitle)}</div>` : ''}
            ${details.accountNumber ? `<div class="pay-val">${esc(details.accountNumber)}</div>` : ''}
            ${details.iban ? `<div class="pay-val">${esc(details.iban)}</div>` : ''}
          </div>
        </div>
      </div>`
      : '';

   const easypaisaRows = hasEasypaisa
      ? `
      <div class="pay-block">
        <div class="pay-title">EasyPaisa</div>
        <div class="pay-split">
          <div class="pay-qr-side">
            ${details.easypaisaQrImageUrl ? `<img src="${esc(resolveUploadUrl(details.easypaisaQrImageUrl))}" alt="EasyPaisa QR" class="qr-img" />` : ''}
          </div>
          <div class="pay-values-side">
            ${details.easypaisaAccountName ? `<div class="pay-val">${esc(details.easypaisaAccountName)}</div>` : ''}
            ${details.easypaisaNumber ? `<div class="pay-val">${esc(details.easypaisaNumber)}</div>` : ''}
          </div>
        </div>
      </div>`
      : '';

   return `
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

   const discountAmt = data.discountPercent > 0 ? Math.round((data.subtotal * data.discountPercent) / 100) : Math.round(data.discount);
   const { taxableAmount, gstAmount, totalTaxAmount, serviceCharge, takeawayCharge, grandTotal } = computePakistanTaxTotals(
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
         applyTakeawayCharge: String(data.orderType || '').toLowerCase() === 'takeaway' && data.takeawayChargeEnabled !== false,
      }
   );

   const gstPct = Math.round(((data.gstRate ?? PKR_GST_RATE) || 0) * 100);
   const orderTypeLabel = String(data.orderType || '').replace(/-/g, ' ');

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
      padding: 7mm 5mm;
      color: #000;
      background: #fff;
      font-size: 9px;
      line-height: 1.28;
      position: relative;
    }
    .receipt { position: relative; }
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
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #000;
      border: 1px solid #000;
      padding: 3px 5px;
      margin-bottom: 6px;
    }
    .brand {
      text-align: center;
    }
    .brand-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 3px;
    }
    .brand-badge {
      width: 26px;
      height: 26px;
      border: 1px solid #000;
      display: grid;
      place-items: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      flex-shrink: 0;
    }
    .brand-copy { text-align: center; }
    .brand h1 {
      font-family: 'IBM Plex Serif', Georgia, serif;
      font-size: 14px;
      font-weight: 700;
      color: #000;
      margin-bottom: 2px;
      line-height: 1.1;
    }
    .brand .tag { font-size: 7px; color: #000; text-transform: uppercase; letter-spacing: 0.1em; }
    .brand .addr { font-size: 7.8px; color: #000; line-height: 1.35; }
    .info-list {
      margin: 5px 0 6px;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 2px 1px;
      border-bottom: 1px dotted #000;
      font-size: 7.5px;
      line-height: 1.25;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row .label {
      flex-shrink: 0;
      font-size: 6px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
      color: #000;
    }
    .info-row .value {
      text-align: right;
      font-size: 8px;
      font-weight: 700;
      word-break: break-word;
    }
    .info-row.full {
      align-items: flex-start;
      flex-direction: column;
    }
    .info-row.full .value {
      width: 100%;
      text-align: left;
      margin-top: 1px;
    }
    .section-h {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: #000;
      margin: 7px 0 3px;
      padding-bottom: 1px;
      border-bottom: 2px solid #000;
    }
    .items { margin: 4px 0 6px; }
    .item-row {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      gap: 6px;
      font-size: 8px;
      padding: 3px 0;
      border-bottom: 1px dotted #000;
    }
    .item-row .qty { color: #000; text-align: left; font-weight: 700; }
    .item-row .name { min-width: 0; font-weight: 600; }
    .item-row .amt { font-weight: 700; text-align: right; white-space: nowrap; }
    .item-notes {
      font-size: 7px;
      color: #000;
      font-style: italic;
      padding-left: 24px;
      margin-top: -1px;
      margin-bottom: 3px;
    }
    .summary-box {
      border: 1px solid #000;
      padding: 5px 6px;
      margin: 6px 0 3px;
      background: #fff;
    }
    .summary-title {
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding-bottom: 3px;
      margin-bottom: 3px;
      border-bottom: 1px solid #000;
    }
    .tax-table {
      width: 100%;
      margin: 0;
      font-size: 8px;
      border-collapse: collapse;
    }
    .tax-table td { padding: 1px 0; vertical-align: top; }
    .tax-table td:last-child { text-align: right; font-weight: 600; }
    .tax-table tr.sub td { color: #000; }
    .tax-table tr.bold td {
      font-weight: 700;
      border-top: 1px solid #000;
      padding-top: 4px;
      font-size: 9px;
    }
    .payment {
      text-align: center;
      font-size: 7px;
      font-weight: 700;
      padding: 4px 5px;
      margin: 6px 0 3px;
      background: #fff;
      border: 1px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .payment-details { margin: 4px 0 0; font-size: 8px; display: grid; gap: 4px; }
    .pay-block { border: 1px dashed #000; padding: 4px 6px; }
    .pay-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; border-bottom: 1px solid #000; padding-bottom: 1px; }
    .pay-split { display: flex; align-items: center; }
    .pay-qr-side { width: 65%; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }
    .pay-values-side { width: 35%; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .pay-val { font-size: 7.5px; font-weight: 600; text-align: right; word-break: break-all; line-height: 1.3; }
    .qr-img { width: 74px; height: 74px; object-fit: contain; border: 1px solid #000; padding: 2px; background: #fff; }
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #000;
    }
    .footer .thanks { font-family: 'IBM Plex Serif', serif; font-size: 9px; font-weight: 600; color: #000; margin-bottom: 3px; }
    .footer p { font-size: 7px; color: #000; line-height: 1.35; }
    @media print {
      body { width: 72mm; padding: 4mm; }
      @page { margin: 0; size: 72mm auto; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    ${data.isPaid ? '<div class="paid-stamp"><span>PAID</span></div>' : ''}

    <div class="brand">
      <div class="brand-top">
        <div class="brand-copy">
          <h1>${esc(RECEIPT_BUSINESS.name)}</h1>
          <div class="tag">${esc(RECEIPT_BUSINESS.tagline)}</div>
        </div>
      </div>
      <div class="addr">
        ${esc(RECEIPT_BUSINESS.address)}
        <br />Tel: ${esc(RECEIPT_BUSINESS.phone)}
      </div>
    </div>

    <div >
      <div class="info-row"><span class="value" style="text-transform:capitalize">${esc(orderTypeLabel)}</span> <span class="value">${esc(data.orderId)}</span></div>
     ${data.table !== undefined || data.cashierName ? `
  <div class="info-row">
    <span class="value">
      ${data.table !== undefined ? esc(String(data.tableName ?? data.table)) : ''}
    </span>
    <span class="value">
      ${data.cashierName ? esc(data.cashierName) : ''}
    </span>
  </div>
` : ''}
<div class="info-row"><span class="value">${esc(orderDateStr)} ${esc(orderTimeStr)}</span><span class="value">${esc(printDateStr)} ${esc(printTimeStr)}</span></div>
      ${data.customerName ? `<div class="info-row full"><span class="label">Customer</span><span class="value">${esc(data.customerName)}</span></div>` : ''}
      ${data.customerPhone ? `<div class="info-row full"><span class="label">Phone</span><span class="value">${esc(data.customerPhone)}</span></div>` : ''}
      ${data.deliveryAddress ? `<div class="info-row full"><span class="label">Address</span><span class="value">${esc(data.deliveryAddress)}</span></div>` : ''}
    </div>

    <div class="section-h">Line items</div>
    <div class="items">
      ${data.items
         .map(
            item => `
        <div class="item-row">
          <span class="qty">${item.quantity}x</span>
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

    <div class="summary-box">
      <div class="summary-title">Amount & taxes</div>
      <table class="tax-table" role="presentation">
        <tr class="sub"><td>Value of sales (before tax)</td><td>${fmtPKR(data.subtotal)}</td></tr>
        ${discountAmt > 0
         ? `<tr class="sub"><td>Discount${data.discountPercent > 0 ? ` (${data.discountPercent}%)` : ''}</td><td>−${fmtPKR(discountAmt)}</td></tr>`
         : ''
      }
        <tr class="sub"><td>Taxable value</td><td>${fmtPKR(taxableAmount)}</td></tr>
        ${String(data.orderType || '').toLowerCase() === 'dine-in'
         ? `<tr class="sub"><td>Service charge @ ${Math.round(((data.serviceChargeRate ?? 0.05) || 0) * 100)}%</td><td>${fmtPKR(serviceCharge)}</td></tr>`
         : ''
      }
        ${String(data.orderType || '').toLowerCase() === 'takeaway' && takeawayCharge > 0
         ? `<tr class="sub"><td>Takeaway charge @ ${Math.round(((data.takeawayChargeRate ?? 0.05) || 0) * 100)}%</td><td>${fmtPKR(takeawayCharge)}</td></tr>`
         : ''
      }
        ${(data.gstEnabled ?? true) ? `<tr class="sub"><td>Sales tax (GST) @ ${gstPct}%</td><td>${fmtPKR(gstAmount)}</td></tr>` : ''}
        <tr class="sub"><td>Total taxes</td><td>${fmtPKR(totalTaxAmount)}</td></tr>
        <tr class="bold"><td>Total (PKR)</td><td>${fmtPKR(grandTotal)}</td></tr>
        ${data.advanceAmount
         ? `<tr class="sub"><td>Advance paid</td><td>${fmtPKR(data.advanceAmount)}</td></tr>
               <tr class="bold"><td>Balance payable</td><td>${fmtPKR(data.remainingAmount ?? (grandTotal - data.advanceAmount))}</td></tr>`
         : ''
      }
        ${data.amountPaid !== undefined
         ? `<tr class="sub"><td style="padding-top:4px">Receiving amount</td><td style="padding-top:4px">${fmtPKR(data.amountPaid)}</td></tr>`
         : ''
      }
        ${data.changeDue !== undefined
         ? `<tr class="sub"><td>Change due (return)</td><td>${fmtPKR(data.changeDue)}</td></tr>`
         : ''
      }
      </table>
    </div>

    ${data.paymentMethod ? `<div class="payment">Payment: ${esc(data.paymentMethod)}</div>` : ''}

    ${data.isPaid ? '' : buildPaymentDetailsHtml(data.paymentDetails)}

    <div class="footer">
      <div class="thanks">Thank you for dining with us</div>
      <p>${esc(RECEIPT_BUSINESS.website)}</p>
      <p style="margin-top:6px">This document is generated electronically and is valid without signature unless required by law.</p>
    </div>
  </div>
</body>
</html>`;

   let iframe = document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null;
   if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = PRINT_FRAME_ID;
      iframe.title = 'Print receipt';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;visibility:hidden;';
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