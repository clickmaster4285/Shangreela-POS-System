import { RECEIPT_BUSINESS } from '../pos/printReceipt';

interface Expense {
  id?: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  paymentStatus: string;
  paidAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
  vendor: string;
}

const PRINT_FRAME_ID = 'expense-report-print-frame';

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function printExpenseReport(expenses: Expense[], summary: any, startDate: string, endDate: string) {
  const printedAt = new Date();
  const printDateStr = printedAt.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  const printTimeStr = printedAt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const dateRangeStr = startDate === endDate 
    ? new Date(startDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    : `${new Date(startDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}`;

  const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Expense Report — ${esc(dateRangeStr)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
      background: #fff;
      font-size: 11px;
      line-height: 1.5;
      padding: 20mm 15mm;
    }

    @page {
      size: A4;
      margin: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }

    .brand h1 {
      font-size: 24px;
      font-weight: 800;
      color: #000;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .brand p {
      font-size: 12px;
      color: #666;
    }

    .report-info {
      text-align: right;
    }

    .report-info h2 {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .report-info p {
      font-size: 11px;
      color: #666;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      padding: 12px;
      border-radius: 8px;
    }

    .summary-card label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      display: block;
      margin-bottom: 4px;
    }

    .summary-card span {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    thead {
      display: table-header-group;
    }

    th {
      background: #f9fafb;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }

    .amount {
      text-align: right;
      font-weight: 600;
    }

    .status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-paid { background: #dcfce7; color: #166534; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .status-half { background: #fef9c3; color: #854d0e; }

    .footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }

    @media print {
      body { padding: 20mm 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${esc(RECEIPT_BUSINESS.name)}</h1>
      <p>${esc(RECEIPT_BUSINESS.address)}, ${esc(RECEIPT_BUSINESS.city)}</p>
      <p>${esc(RECEIPT_BUSINESS.phone)}</p>
    </div>
    <div class="report-info">
      <h2>Expense Report</h2>
      <p>Period: <strong>${esc(dateRangeStr)}</strong></p>
      <p>Generated: ${esc(printDateStr)} at ${esc(printTimeStr)}</p>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <label>Total Expenses</label>
      <span>Rs. ${summary.total.toLocaleString()}</span>
    </div>
    <div class="summary-card">
      <label>Total Paid</label>
      <span>Rs. ${summary.totalPaid.toLocaleString()}</span>
    </div>
    <div class="summary-card">
      <label>Total Unpaid</label>
      <span>Rs. ${summary.totalUnpaid.toLocaleString()}</span>
    </div>
    <div class="summary-card">
      <label>Expense Count</label>
      <span>${summary.count}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Expense Title</th>
        <th>Category</th>
        <th>Vendor</th>
        <th>Status</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(e => `
        <tr>
          <td>${new Date(e.paymentDate).toLocaleDateString('en-PK')}</td>
          <td>
            <strong>${esc(e.title)}</strong>
            ${e.description ? `<br/><small style="color:#666">${esc(e.description)}</small>` : ''}
          </td>
          <td style="text-transform:capitalize">${esc(e.category)}</td>
          <td>${esc(e.vendor || '-')}</td>
          <td>
            <span class="status status-${e.paymentStatus || 'paid'}">
              ${esc(e.paymentStatus || 'paid')}
            </span>
          </td>
          <td class="amount">Rs. ${e.amount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This is a computer-generated report. Printed on ${esc(printDateStr)} ${esc(printTimeStr)}</p>
  </div>
</body>
</html>`;

  let iframe = document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_FRAME_ID;
    iframe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;';
    document.body.appendChild(iframe);
  }

  const win = iframe.contentWindow;
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(reportHtml);
  doc.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}
