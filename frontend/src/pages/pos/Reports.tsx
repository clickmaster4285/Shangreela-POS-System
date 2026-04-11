import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Package, Percent, FileBarChart, CreditCard, Wallet, Download, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { exportReportPdf } from '@/utils/exportReportPdf';

const pieColors = ['hsl(340,70%,21%)', 'hsl(340,60%,30%)', 'hsl(15,45%,81%)', 'hsl(40,70%,55%)', 'hsl(15,25%,13%)'];
const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  // h: 0..360, s/l: 0..100
  const _s = s / 100;
  const _l = l / 100;
  const c = (1 - Math.abs(2 * _l - 1)) * _s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = _l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
  else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
  else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
  else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
};

const readThemeRgb = () => {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim(); // e.g. "340 70% 21%"
  const parseHslVar = (v: string): [number, number, number] | undefined => {
    const parts = v.split(/\s+/).filter(Boolean);
    if (parts.length < 3) return undefined;
    const h = Number(parts[0]);
    const s = Number(parts[1].replace('%', ''));
    const l = Number(parts[2].replace('%', ''));
    if (![h, s, l].every(Number.isFinite)) return undefined;
    return hslToRgb(h, s, l);
  };
  return {
    primaryRgb: parseHslVar(read('--primary')),
    primaryForegroundRgb: parseHslVar(read('--primary-foreground')),
    foregroundRgb: parseHslVar(read('--foreground')),
    mutedForegroundRgb: parseHslVar(read('--muted-foreground')),
    borderRgb: parseHslVar(read('--border')),
    tableStripeRgb: parseHslVar(read('--muted')),
  };
};

const svgToPngDataUrl = async (svgUrl: string, size = 256) => {
  const svgText = await fetch(svgUrl).then((r) => r.text());
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load svg image'));
      i.src = blobUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

export default function Reports() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  const reportsQuery = useQuery({
    queryKey: ['reports-dashboard', dateRange],
    queryFn: async () => {
      const [w, t, s] = await Promise.all([
        api<{ items: { day: string; revenue: number }[] }>(`/reports/weekly-sales?range=${dateRange}`),
        api<{ items: { name: string; sold: number; revenue: number }[] }>(`/reports/top-items?range=${dateRange}`),
        api<{
          revenue: number;
          profit: number;
          totalExpenses: number;
          totalServiceCharges: number;
          totalDiscount: number;
          paymentBreakdown: { cash: number; card: number; easypesa: number; other: number };
          totalMenuOut: number;
        }>(`/dashboard/summary?range=${dateRange}`),
      ]);
      return { weeklySalesData: w.items, topSellingItems: t.items, summary: s };
    },
  });
  const weeklySalesData = reportsQuery.data?.weeklySalesData ?? [];
  const topSellingItems = reportsQuery.data?.topSellingItems ?? [];
  const summary = reportsQuery.data?.summary ?? {
    revenue: 0,
    profit: 0,
    totalExpenses: 0,
    totalServiceCharges: 0,
    totalDiscount: 0,
    paymentBreakdown: { cash: 0, card: 0, easypesa: 0, other: 0 },
    totalMenuOut: 0,
  };
  const totalRevenue = summary.revenue;
  const totalSold = useMemo(() => topSellingItems.reduce((s, i) => s + i.sold, 0), [topSellingItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    const theme = readThemeRgb();
    let logoPngDataUrl: string | undefined;
    try {
      logoPngDataUrl = await svgToPngDataUrl('/logo.svg', 256);
    } catch {
      logoPngDataUrl = undefined;
    }
    exportReportPdf({
      range: dateRange,
      generatedAt: new Date(),
      summary,
      revenueSeries: weeklySalesData,
      topItems: topSellingItems,
      logoPngDataUrl,
      theme,
      business: {
        name: 'Shangreela Heights',
        addressLine1: 'Ling Mor Kahuta',
        addressLine2: 'Rawalpindi, Pakistan',
        phone: '+92 513314120 / +92 337-5454786',
      },
    });
  };

  const revenueBreakdownLabel =
    dateRange === 'today' ? 'Hourly Revenue Breakdown' :
    dateRange === 'week' ? 'Daily Revenue Breakdown (Last 7 Days)' :
    dateRange === 'month' ? 'Daily Revenue Breakdown (This Month)' :
    'Monthly Revenue Breakdown (This Year)';

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .pos-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          .grid {
            display: grid;
            gap: 1rem;
          }
          
          .grid-cols-4 {
            grid-template-columns: repeat(4, 1fr);
          }
          
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          h1, h2, h3, h4 {
            page-break-after: avoid;
          }
          
          table {
            page-break-inside: avoid;
            width: 100%;
            border-collapse: collapse;
          }
          
          table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          table th {
            background-color: #f2f2f2;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #000;
          }
          
          .print-footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
          }
          
          .tabular-report {
            width: 100%;
            margin-bottom: 20px;
          }
          
          .tabular-report caption {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
          }
        }
        
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header with Print Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Reporting</h1>
            <p className="text-sm text-muted-foreground">Sales, profit, and payment breakdowns from paid (completed) bills in the selected period.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
              {(['today', 'week', 'month', 'year'] as const).map(r => (
                <button key={r} onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${dateRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/5 transition"
            >
              <Download className="w-4 h-4" /> Export PDF (A4)
            </button>
            {/* <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/5 transition">
              <FileBarChart className="w-4 h-4" /> Print report
            </button> */}
          </div>
        </div>

        {/* Print Header */}
        <div className="print-only print-header">
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Restaurant Sales Report</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Period: {dateRange.charAt(0).toUpperCase() + dateRange.slice(1)} 
            | Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Summary Cards - Visible on screen */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
          {[
            { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: DollarSign },
            { label: 'Profit', value: formatPKR(summary.profit), icon: TrendingUp },
            { label: 'Service Charges', value: formatPKR(summary.totalServiceCharges), icon: Percent },
            { label: 'Discounts given', value: formatPKR(summary.totalDiscount ?? 0), icon: Tag },
            { label: 'Total Expenses', value: formatPKR(summary.totalExpenses), icon: Wallet },
            { label: 'Cash Sales', value: formatPKR(summary.paymentBreakdown.cash), icon: DollarSign },
            { label: 'Card Sales', value: formatPKR(summary.paymentBreakdown.card), icon: CreditCard },
            { label: 'EasyPesa Sales', value: formatPKR(summary.paymentBreakdown.easypesa), icon: Wallet },
            { label: 'Menu Out', value: summary.totalMenuOut.toString(), icon: Package },
          ].map(s => (
            <div key={s.label} className="pos-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-serif text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabular Report for Printing */}
        <div className="print-only">
          {/* Summary Table */}
          <table className="tabular-report">
            <caption>Financial Summary</caption>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue</td>
                <td>{formatPKR(totalRevenue)}</td>
              </tr>
              <tr>
                <td>Profit</td>
                <td>{formatPKR(summary.profit)}</td>
              </tr>
              <tr>
                <td>Service Charges</td>
                <td>{formatPKR(summary.totalServiceCharges)}</td>
              </tr>
              <tr>
                <td>Discounts given</td>
                <td>{formatPKR(summary.totalDiscount ?? 0)}</td>
              </tr>
              <tr>
                <td>Total Expenses</td>
                <td>{formatPKR(summary.totalExpenses)}</td>
              </tr>
              <tr>
                <td>Menu Out</td>
                <td>{summary.totalMenuOut} units</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Breakdown Table */}
          <table className="tabular-report">
            <caption>Payment Breakdown</caption>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cash</td>
                <td>{formatPKR(summary.paymentBreakdown.cash)}</td>
              </tr>
              <tr>
                <td>Card</td>
                <td>{formatPKR(summary.paymentBreakdown.card)}</td>
              </tr>
              <tr>
                <td>EasyPesa</td>
                <td>{formatPKR(summary.paymentBreakdown.easypesa)}</td>
              </tr>
              <tr>
                <td>Other</td>
                <td>{formatPKR(summary.paymentBreakdown.other)}</td>
              </tr>
            </tbody>
          </table>

          {/* Daily Revenue Table */}
          <table className="tabular-report">
            <caption>{revenueBreakdownLabel}</caption>
            <thead>
              <tr>
                <th>Period</th>
                <th>Revenue (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {weeklySalesData.map((day) => (
                <tr key={day.day}>
                  <td>{day.day}</td>
                  <td>{formatPKR(day.revenue)}</td>
                </tr>
              ))}
              {weeklySalesData.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Top Selling Items Table */}
          <table className="tabular-report">
            <caption>Top Selling Items</caption>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Item Name</th>
                <th>Units Sold</th>
                <th>Revenue (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {topSellingItems.map((item, i) => (
                <tr key={item.name}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.sold}</td>
                  <td>{formatPKR(item.revenue)}</td>
                </tr>
              ))}
              {topSellingItems.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Charts - Visible on screen only */}
        <div className="grid lg:grid-cols-2 gap-4 no-print">
          <div className="pos-card">
            <h3 className="font-semibold text-foreground text-sm mb-4">{revenueBreakdownLabel} (PKR)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklySalesData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPKR(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(340,70%,21%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pos-card">
            <h3 className="font-semibold text-foreground text-sm mb-4">Top Items Breakdown</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={topSellingItems} dataKey="sold" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {topSellingItems.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Selling Items Table - Visible on screen */}
        <div className="pos-card no-print">
          <h3 className="font-semibold text-foreground text-sm mb-4">Top Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 px-2 font-medium">#</th>
                  <th className="py-3 px-2 font-medium">Item</th>
                  <th className="py-3 px-2 font-medium">Units Sold</th>
                  <th className="py-3 px-2 font-medium">Revenue</th>
                 </tr>
              </thead>
              <tbody>
                {topSellingItems.map((item, i) => (
                  <tr key={item.name} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                     </td>
                    <td className="py-3 px-2 font-medium text-foreground">{item.name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{item.sold}</td>
                    <td className="py-3 px-2 font-semibold text-foreground">Rs. {item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Breakdown - Visible on screen */}
        <div className="pos-card no-print">
          <h3 className="font-semibold text-foreground text-sm mb-4">Payment Breakdown</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Cash', amount: summary.paymentBreakdown.cash },
              { label: 'Card', amount: summary.paymentBreakdown.card },
              { label: 'EasyPesa', amount: summary.paymentBreakdown.easypesa },
              { label: 'Other', amount: summary.paymentBreakdown.other },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatPKR(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links Section - Hidden in Print */}
        <div className="pos-card no-print">
          <h3 className="font-semibold text-foreground text-sm mb-4">View Detailed Reports</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/pos/expenses" className="px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Expenses
            </Link>
            <Link to="/pos/sales-analytics" className="px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Sales Analytics
            </Link>
          </div>
        </div>

        {/* Print Footer */}
        <div className="print-only print-footer">
          <p>This is a computer-generated report. No signature required.</p>
          <p>Page 1 of 1</p>
        </div>
      </div>
    </>
  );
}
