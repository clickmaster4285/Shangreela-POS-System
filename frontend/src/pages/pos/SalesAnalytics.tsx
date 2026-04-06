import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, ArrowUpRight, Calendar, Filter, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const orderTypeDataDefault = [
  { name: 'Dine-in', value: 0, revenue: 0 },
  { name: 'Delivery', value: 0, revenue: 0 },
  { name: 'Takeaway', value: 0, revenue: 0 },
];

const pieColors = ['hsl(340,70%,21%)', 'hsl(40,70%,55%)', 'hsl(142,60%,40%)'];

const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function SalesAnalytics() {
  const analyticsQuery = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const [w, d, top, orders, typeData, month] = await Promise.all([
      api<{ items: { day: string; revenue: number }[] }>('/dashboard/revenue-weekly'),
      api<{ items: { hour: string; sales: number }[] }>('/dashboard/sales-daily'),
      api<{ items: { name: string; sold: number; revenue: number }[] }>('/dashboard/top-items'),
      api<{ items: { type: 'dine-in' | 'delivery' | 'takeaway' | 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' }[] }>('/orders?page=1&limit=200&status=all&type=all'),
      api<{ items: { name: string; value: number; revenue: number }[] }>('/analytics/order-type-breakdown'),
      api<{ items: { month: string; revenue: number }[] }>('/analytics/monthly-trend'),
      ]);
      const cancelledOrders = orders.items.filter((o: any) => o.status === 'cancelled').length;
      return {
        weeklySalesData: w.items,
        dailySalesData: d.items,
        topSellingItems: top.items,
        sampleOrders: orders.items.filter((o: any) => o.status !== 'cancelled'),
        cancelledOrders,
        orderTypeData: typeData.items,
        monthlyTrend: month.items,
      };
    },
  });
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'delivery' | 'takeaway'>('all');

  const weeklySalesData = analyticsQuery.data?.weeklySalesData ?? [];
  const dailySalesData = analyticsQuery.data?.dailySalesData ?? [];
  const topSellingItems = analyticsQuery.data?.topSellingItems ?? [];
  const sampleOrders = analyticsQuery.data?.sampleOrders ?? [];
  const cancelledOrders = analyticsQuery.data?.cancelledOrders ?? 0;
  const orderTypeData = analyticsQuery.data?.orderTypeData ?? orderTypeDataDefault;
  const monthlyTrend = analyticsQuery.data?.monthlyTrend ?? [];

  const totalRevenue = useMemo(() => weeklySalesData.reduce((s, d) => s + d.revenue, 0), [weeklySalesData]);
  const totalOrders = sampleOrders.length;
  const avgOrder = Math.round(totalRevenue / (totalOrders || 1));

  const dineInCount = sampleOrders.filter(o => o.type === 'dine-in').length;
  const deliveryCount = sampleOrders.filter(o => o.type === 'delivery').length;
  const takeawayCount = sampleOrders.filter(o => o.type === 'takeaway').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue insights and performance trends.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Date range filter */}
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(['today', 'week', 'month', 'year'] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${dateRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {r}
              </button>
            ))}
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
          { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: DollarSign, change: '+18.2%' },
          { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingCart, change: '+12.5%' },
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
