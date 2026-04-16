import { DollarSign, ShoppingCart, TrendingUp, XCircle, ArrowUpRight, Percent, ClipboardList, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { formatOrderDateTime, groupOrdersByCalendarDay } from '@/utils/formatOrderDateTime';

type RecentOrderRow = { id: string; type: string; status: string; items: unknown[]; total: number; createdAt: string };

const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function POSDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [showAllItems, setShowAllItems] = useState(false);

  const { data: floorsData } = useQuery({
    queryKey: ['floors-list'],
    queryFn: () => api<{ items: { key: string; name: string }[] }>('/floors'),
  });
  const floors = floorsData?.items ?? [];

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-overview', startDate, endDate, selectedFloor],
    queryFn: async () => {
      const floorParam = selectedFloor !== 'all' ? `&floorKey=${selectedFloor}` : '';
      const [s, d, w, t, r] = await Promise.all([
        api<{ revenue: number; profit: number; totalServiceCharges: number; totalDiscount: number; paymentBreakdown: { cash: number; card: number; easypesa: number; other: number }; totalOrders: number; openOrders: number; cancelledOrders: number; menuCount: number; lowStock: number; staff: number; totalExpenses: number; expenseCount: number; totalMenuOut: number }>(`/dashboard/summary?from=${startDate}&to=${endDate}${floorParam}`),
        api<{ items: { hour: string; sales: number }[] }>(`/dashboard/sales-daily?from=${startDate}&to=${endDate}${floorParam}`),
        api<{ items: { day: string; revenue: number }[] }>(`/dashboard/revenue-weekly?from=${startDate}&to=${endDate}${floorParam}`),
        api<{ items: { name: string; sold: number; revenue: number }[] }>(`/dashboard/top-items?from=${startDate}&to=${endDate}${floorParam}`),
        api<{ items: RecentOrderRow[] }>(`/dashboard/recent-orders?floorKey=${selectedFloor}`),
      ]);
      return { summary: s, dailySalesData: d.items, weeklySalesData: w.items, topSellingItems: t.items, sampleOrders: r.items };
    },
  });

  const summary = dashboardQuery.data?.summary ?? { revenue: 0, profit: 0, totalServiceCharges: 0, totalDiscount: 0, paymentBreakdown: { cash: 0, card: 0, easypesa: 0, other: 0 }, totalOrders: 0, openOrders: 0, cancelledOrders: 0, menuCount: 0, lowStock: 0, staff: 0, totalExpenses: 0, expenseCount: 0, totalMenuOut: 0 };
  const dailySalesData = dashboardQuery.data?.dailySalesData ?? [];
  const weeklySalesData = dashboardQuery.data?.weeklySalesData ?? [];
  const topSellingItems = dashboardQuery.data?.topSellingItems ?? [];
  const sampleOrders = dashboardQuery.data?.sampleOrders ?? [];

  const { dineIn, delivery, takeaway } = useMemo(() => ({
    dineIn: sampleOrders.filter(o => o.type === 'dine-in').length,
    delivery: sampleOrders.filter(o => o.type === 'delivery').length,
    takeaway: sampleOrders.filter(o => o.type === 'takeaway').length,
  }), [sampleOrders]);

  const recentOrdersByDay = useMemo(() => {
    const rows: RecentOrderRow[] = sampleOrders.map((o) => ({
      ...o,
      createdAt: o.createdAt || new Date().toISOString(),
    }));
    return groupOrdersByCalendarDay(rows);
  }, [sampleOrders]);

  const rangeLabel = `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const stats = [
    { label: `${rangeLabel} paid revenue`, value: formatPKR(summary.revenue), icon: DollarSign, change: '' },
    { label: 'Profit', value: formatPKR(summary.profit), icon: TrendingUp, change: '' },
    { label: 'Service Charges', value: formatPKR(summary.totalServiceCharges), icon: Percent, change: '' },
    { label: 'Discounts given', value: formatPKR(summary.totalDiscount), icon: Tag, change: '' },
    { label: 'Total Expenses', value: formatPKR(summary.totalExpenses), icon: TrendingUp, change: '' },
    { label: 'Paid orders', value: String(summary.totalOrders), icon: ShoppingCart, change: '' },
    { label: 'Open bills', value: String(summary.openOrders), icon: ClipboardList, change: '' },
    { label: 'Cancelled Orders', value: String(summary.cancelledOrders), icon: XCircle, change: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's your overview.</p>
        </div>
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
          <div className="w-px h-4 bg-border mx-1" />
          <label className="text-xs font-medium text-muted-foreground">Floor:</label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f.key} value={f.key}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="pos-card flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="font-serif text-2xl font-bold text-foreground">{s.value}</p>
              <span className="inline-flex items-center text-xs text-success font-medium mt-1">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />{s.change}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        ))}
      </div>

      {/* Order Type Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Dine-in', count: dineIn, color: 'text-primary' },
          { label: 'Delivery', count: delivery, color: 'text-warning' },
          { label: 'Takeaway', count: takeaway, color: 'text-success' },
        ].map(t => (
          <div key={t.label} className="pos-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className={`w-5 h-5 ${t.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.label} Orders</p>
              <p className="font-serif text-xl font-bold text-foreground">{t.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="pos-card lg:col-span-2">
          <h3 className="font-semibold text-foreground text-sm mb-4">Payment Breakdown</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Cash', amount: summary.paymentBreakdown.cash },
              { label: 'Card', amount: summary.paymentBreakdown.card },
              { label: 'EasyPesa', amount: summary.paymentBreakdown.easypesa },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatPKR(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Menu Out</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{summary.totalMenuOut}</p>
          <p className="text-sm text-muted-foreground mt-2">Total menu items served during selected range.</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">{rangeLabel} sales (PKR)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailySalesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(340,70%,21%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(340,70%,21%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => [formatPKR(v), 'Sales']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(340,70%,21%)" fill="url(#salesGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">{rangeLabel} revenue breakdown (PKR)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklySalesData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => [formatPKR(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(340,70%,21%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top selling & Recent orders */}
      <div className="grid items-stretch lg:grid-cols-2 gap-4">
        <div className="pos-card flex min-h-0 flex-col">
          <h3 className="font-semibold text-foreground text-sm mb-4 shrink-0">Menu Items Sales</h3>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 max-h-[28rem] scrollbar-thin lg:max-h-[32rem]">
            {topSellingItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">Rs. {item.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-card flex flex-col">
          <div className="mb-2 shrink-0">
            <h3 className="font-semibold text-foreground text-sm">Recent orders</h3>
            <p className="text-[11px] text-muted-foreground">Grouped by day (newest first)</p>
          </div>
          <div className="max-h-[22rem] space-y-4 overflow-y-auto pr-1 scrollbar-thin lg:max-h-[26rem]">
            {recentOrdersByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent orders</p>
            ) : (
              recentOrdersByDay.map((group) => (
                <div key={group.dayKey} className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                    {group.dayLabel}
                  </p>
                  <div className="space-y-2">
                    {group.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-sm font-medium text-foreground">{order.id}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {order.type} • {order.items.length} items
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatOrderDateTime(order.createdAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-foreground">Rs. {order.total.toLocaleString()}</p>
                          <span
                            className={`mt-1 inline-block text-xs font-medium rounded-full px-2 py-0.5 ${
                              order.status === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : order.status === 'preparing'
                                  ? 'bg-primary/10 text-primary'
                                  : order.status === 'ready'
                                    ? 'bg-success/10 text-success'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
