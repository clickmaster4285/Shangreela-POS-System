import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type RevenueRow = { day: string; revenue: number };
type TopItemRow = { name: string; sold: number; revenue: number };

export type ReportPdfPayload = {
  range: 'today' | 'week' | 'month' | 'year';
  generatedAt: Date;
  summary: {
    revenue: number;
    profit: number;
    totalExpenses: number;
    totalServiceCharges: number;
    totalMenuOut: number;
    paymentBreakdown: { cash: number; card: number; easypesa: number; other: number };
  };
  revenueSeries: RevenueRow[];
  topItems: TopItemRow[];
  logoPngDataUrl?: string;
  theme?: {
    primaryRgb?: [number, number, number];
    primaryForegroundRgb?: [number, number, number];
    foregroundRgb?: [number, number, number];
    mutedForegroundRgb?: [number, number, number];
    borderRgb?: [number, number, number];
    tableStripeRgb?: [number, number, number];
  };
  business?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    phone?: string;
  };
};

const fmtPKR = (n: number) => `Rs. ${Math.round(Number(n || 0)).toLocaleString('en-PK')}`;
const cap = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

function rangeLabel(range: ReportPdfPayload['range']) {
  if (range === 'today') return 'Today';
  if (range === 'week') return 'This Week (Last 7 Days)';
  if (range === 'month') return 'This Month';
  return 'This Year';
}

export function exportReportPdf(payload: ReportPdfPayload) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const marginTop = 14;
  const primary = payload.theme?.primaryRgb ?? [17, 24, 39];
  const primaryFg = payload.theme?.primaryForegroundRgb ?? [255, 255, 255];
  const fg = payload.theme?.foregroundRgb ?? [17, 24, 39];
  const mutedFg = payload.theme?.mutedForegroundRgb ?? [100, 116, 139];
  const border = payload.theme?.borderRgb ?? [226, 232, 240];
  const stripe = payload.theme?.tableStripeRgb ?? [248, 250, 252];

  const brand = payload.business?.name || 'Restaurant POS';
  const title = 'Sales & Payments Report';
  const sub = `Period: ${rangeLabel(payload.range)}   •   Generated: ${payload.generatedAt.toLocaleString()}`;

  // Header
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(primaryFg[0], primaryFg[1], primaryFg[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);

  const logoSize = 12;
  const logoPad = 2.2;
  let textX = marginX;
  if (payload.logoPngDataUrl) {
    // White rounded card for logo
    doc.setFillColor(255, 255, 255);
    // jsPDF has no rounded rect fill in core; emulate with rect (still looks fine on print)
    doc.rect(marginX, 5.5, logoSize + logoPad * 2, logoSize + logoPad * 2, 'F');
    try {
      doc.addImage(payload.logoPngDataUrl, 'PNG', marginX + logoPad, 5.5 + logoPad, logoSize, logoSize);
    } catch {
      // ignore logo failures, keep PDF generation intact
    }
    textX = marginX + logoSize + logoPad * 2 + 6;
  }

  doc.text(brand, textX, 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, textX, 17);

  doc.setTextColor(fg[0], fg[1], fg[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(sub, marginX, 30);

  const nextY = 36;

  // Optional business lines (printed, not from web UI)
  const infoLines = [
    payload.business?.addressLine1,
    payload.business?.addressLine2,
    payload.business?.phone ? `Phone: ${payload.business.phone}` : undefined,
  ].filter(Boolean) as string[];

  let y = nextY;
  if (infoLines.length) {
    doc.setFontSize(9);
    infoLines.forEach((l) => {
      doc.text(String(l), marginX, y);
      y += 4;
    });
    y += 2;
  }

  const headStyles = { fillColor: primary as unknown as number[], textColor: primaryFg[0], fontStyle: 'bold' as const };
  const bodyStyles = { textColor: fg[0] };
  const alternateRowStyles = { fillColor: stripe as unknown as number[] };

  // Financial Summary
  autoTable(doc, {
    startY: y,
    head: [['Financial Summary', 'Amount (PKR)']],
    body: [
      ['Total revenue', fmtPKR(payload.summary.revenue)],
      ['Profit', fmtPKR(payload.summary.profit)],
      ['Service charges', fmtPKR(payload.summary.totalServiceCharges)],
      ['Total expenses', fmtPKR(payload.summary.totalExpenses)],
      ['Menu out', `${Math.round(payload.summary.totalMenuOut || 0).toLocaleString('en-PK')} units`],
    ],
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.2, lineColor: border as unknown as number[], lineWidth: 0.2 },
    headStyles,
    bodyStyles,
    alternateRowStyles,
    columnStyles: { 1: { halign: 'right' } },
  });

  // Payment Breakdown
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [['Payment Breakdown', 'Amount (PKR)']],
    body: [
      ['Cash', fmtPKR(payload.summary.paymentBreakdown.cash)],
      ['Card', fmtPKR(payload.summary.paymentBreakdown.card)],
      ['EasyPaisa', fmtPKR(payload.summary.paymentBreakdown.easypesa)],
      ['Other', fmtPKR(payload.summary.paymentBreakdown.other)],
    ],
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.2, lineColor: border as unknown as number[], lineWidth: 0.2 },
    headStyles,
    bodyStyles,
    alternateRowStyles,
    columnStyles: { 1: { halign: 'right' } },
  });

  // Revenue breakdown table title depends on range
  const revenueTitle =
    payload.range === 'today'
      ? 'Hourly Revenue Breakdown'
      : payload.range === 'week'
        ? 'Daily Revenue Breakdown (Last 7 Days)'
        : payload.range === 'month'
          ? 'Daily Revenue Breakdown (This Month)'
          : 'Monthly Revenue Breakdown (This Year)';

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [[revenueTitle, 'Revenue (PKR)']],
    body: (payload.revenueSeries || []).map((r) => [String(r.day || ''), fmtPKR(r.revenue)]),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.2, lineColor: border as unknown as number[], lineWidth: 0.2 },
    headStyles,
    bodyStyles,
    alternateRowStyles,
    columnStyles: { 1: { halign: 'right' } },
    didDrawPage: (data) => {
      // Footer on each page
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(mutedFg[0], mutedFg[1], mutedFg[2]);
      doc.text(`Report: ${cap(payload.range)}   •   Page ${doc.getNumberOfPages()}`, marginX, pageH - 8);
      // Keep table away from footer
      data.settings.margin = { top: marginTop, left: marginX, right: marginX, bottom: 14 };
    },
  });

  // Top items
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [['#', 'Item', 'Units', 'Revenue (PKR)']],
    body: (payload.topItems || []).map((it, i) => [
      String(i + 1),
      String(it.name || ''),
      String(Math.round(it.sold || 0)),
      fmtPKR(it.revenue),
    ]),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9.3, cellPadding: 2.1, lineColor: border as unknown as number[], lineWidth: 0.2 },
    headStyles,
    bodyStyles,
    alternateRowStyles,
    columnStyles: { 0: { halign: 'right', cellWidth: 10 }, 2: { halign: 'right', cellWidth: 16 }, 3: { halign: 'right', cellWidth: 34 } },
  });

  const fileName = `report-${payload.range}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

