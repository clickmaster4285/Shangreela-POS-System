import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, ArrowUpRight, Filter, XCircle, Package, Tag } from 'lucide-react';
import { api } from '@/lib/api/api';
import { useQuery } from '@tanstack/react-query';

const orderTypeDataDefault = [
  { name: 'Dine-in', value: 0, revenue: 0, count: 0 },
  { name: 'Delivery', value: 0, revenue: 0, count: 0 },
  { name: 'Takeaway', value: 0, revenue: 0, count: 0 },
];

const pieColors = ['hsl(340,70%,21%)', 'hsl(40,70%,55%)', 'hsl(142,60%,40%)'];

const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function SalesAnalytics() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const analyticsQuery = useQuery({
    queryKey: ['analytics-dashboard', startDate, endDate],
    queryFn: async () => {
      const [b, month] = await Promise.all([
        api<{
          summary: {
            revenue: number;
            totalOrders: number;
            totalExpenses: number;
            cancelledOrders: number;
            totalDiscount: number;
          };
          salesDaily: { items: { hour: string; sales: number }[] };
          revenueWeekly: { items: { day: string; revenue: number }[] };
          topItems: { items: { name: string; sold: number; revenue: number }[] };
          orderTypeBreakdown: { items: { name: string; value: number; revenue: number; count?: number }[] };
        }>(`/dashboard/bundle?from=${startDate}&to=${endDate}`),
        api<{ items: { month: string; revenue: number }[] }>('/analytics/monthly-trend'),
      ]);
      const summary = b.summary;
      return {
        weeklySalesData: b.revenueWeekly.items,
        dailySalesData: b.salesDaily.items,
        topSellingItems: b.topItems.items,
        cancelledOrders: summary.cancelledOrders,
        orderTypeData: b.orderTypeBreakdown.items,
        monthlyTrend: month.items,
        totalExpenses: summary.totalExpenses,
        paidRevenue: summary.revenue,
        paidOrders: summary.totalOrders,
        avgPaidOrder: summary.totalOrders ? Math.round(summary.revenue / summary.totalOrders) : 0,
        totalDiscount: summary.totalDiscount ?? 0,
      };
    },
  });
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'delivery' | 'takeaway'>('all');

  const weeklySalesData = analyticsQuery.data?.weeklySalesData ?? [];
  const dailySalesData = analyticsQuery.data?.dailySalesData ?? [];
  const topSellingItems = analyticsQuery.data?.topSellingItems ?? [];
  const cancelledOrders = analyticsQuery.data?.cancelledOrders ?? 0;
  const orderTypeData = analyticsQuery.data?.orderTypeData ?? orderTypeDataDefault;
  const monthlyTrend = analyticsQuery.data?.monthlyTrend ?? [];
  const totalExpenses = analyticsQuery.data?.totalExpenses ?? 0;
  const totalRevenue = analyticsQuery.data?.paidRevenue ?? 0;
  const totalOrders = analyticsQuery.data?.paidOrders ?? 0;
  const avgOrder = analyticsQuery.data?.avgPaidOrder ?? 0;
  const totalDiscount = analyticsQuery.data?.totalDiscount ?? 0;
  const dineInCount = orderTypeData.find(o => o.name === 'Dine-in')?.count ?? 0;
  const deliveryCount = orderTypeData.find(o => o.name === 'Delivery')?.count ?? 0;
  const takeawayCount = orderTypeData.find(o => o.name === 'Takeaway')?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue and trends from paid (completed) bills in the selected period.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Date range filter */}
          <div className="flex gap-2 items-center bg-card border border-border rounded-xl p-2">
            <label className="text-xs font-medium text-muted-foreground">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1 text-xs"
            />
            <label className="text-xs font-medium text-muted-foreground">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1 text-xs"
            />
          </div>
          {/* Order type filter */}
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(['all', 'dine-in', 'delivery', 'takeaway'] as const).map(t => (
              <button key={t} onClick={() => setOrderTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${orderTypeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Paid revenue', value: formatPKR(totalRevenue), icon: DollarSign, change: '+18.2%' },
          { label: 'Discounts given', value: formatPKR(totalDiscount), icon: Tag, change: '' },
          { label: 'Total Expenses', value: formatPKR(totalExpenses), icon: Package, change: '' },
          { label: 'Paid orders', value: totalOrders.toString(), icon: ShoppingCart, change: '+12.5%' },
          { label: 'Cancelled Orders', value: String(cancelledOrders), icon: XCircle, change: '' },
          { label: 'Average Order', value: formatPKR(avgOrder), icon: TrendingUp, change: '+5.3%' },
          { label: 'Dine-in / Delivery / Takeaway', value: `${dineInCount} / ${deliveryCount} / ${takeawayCount}`, icon: Filter, change: '' },
        ].map(s => (
          <div key={s.label} className="pos-card flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="font-serif text-xl font-bold text-foreground">{s.value}</p>
              {s.change && (
                <span className="inline-flex items-center text-xs text-success font-medium mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />{s.change}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Daily Sales (PKR)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailySalesData}>
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(340,70%,21%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(340,70%,21%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatPKR(v), 'Sales']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(340,70%,21%)" fill="url(#analyticsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Weekly Revenue (PKR)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklySalesData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatPKR(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(340,70%,21%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Revenue by Order Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={orderTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {orderTypeData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => {
                const item = orderTypeData.find(d => d.name === name);
                return [`${v}% (${formatPKR(item?.revenue || 0)})`, name];
              }} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pos-card lg:col-span-2">
          <h3 className="font-semibold text-foreground text-sm mb-4">Monthly Trend (PKR)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatPKR(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(340,70%,21%)" strokeWidth={2.5} dot={{ fill: 'hsl(340,70%,21%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="pos-card">
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
    </div>
  );
}

