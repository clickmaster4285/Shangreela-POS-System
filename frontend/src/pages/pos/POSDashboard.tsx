import { DollarSign, ShoppingCart, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function POSDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const [s, d, w, t, r] = await Promise.all([
      api<{ revenue: number; totalOrders: number; menuCount: number; lowStock: number; staff: number }>('/dashboard/summary'),
      api<{ items: { hour: string; sales: number }[] }>('/dashboard/sales-daily'),
      api<{ items: { day: string; revenue: number }[] }>('/dashboard/revenue-weekly'),
      api<{ items: { name: string; sold: number; revenue: number }[] }>('/dashboard/top-items'),
      api<{ items: { id: string; type: string; status: string; items: unknown[]; total: number }[] }>('/dashboard/recent-orders'),
      ]);
      return { summary: s, dailySalesData: d.items, weeklySalesData: w.items, topSellingItems: t.items, sampleOrders: r.items };
    },
  });

  const summary = dashboardQuery.data?.summary ?? { revenue: 0, totalOrders: 0, menuCount: 0, lowStock: 0, staff: 0 };
  const dailySalesData = dashboardQuery.data?.dailySalesData ?? [];
  const weeklySalesData = dashboardQuery.data?.weeklySalesData ?? [];
  const topSellingItems = dashboardQuery.data?.topSellingItems ?? [];
  const sampleOrders = dashboardQuery.data?.sampleOrders ?? [];

  const { dineIn, delivery, takeaway } = useMemo(() => ({
    dineIn: sampleOrders.filter(o => o.type === 'dine-in').length,
    delivery: sampleOrders.filter(o => o.type === 'delivery').length,
    takeaway: sampleOrders.filter(o => o.type === 'takeaway').length,
  }), [sampleOrders]);

  const stats = [
    { label: "Today's Revenue", value: formatPKR(summary.revenue), icon: DollarSign, change: '' },
    { label: 'Active Orders', value: sampleOrders.filter(o => o.status !== 'completed').length.toString(), icon: ShoppingCart, change: '' },
    { label: 'Total Orders', value: String(summary.totalOrders), icon: TrendingUp, change: '' },
    { label: 'Active Staff', value: String(summary.staff), icon: Users, change: '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's today's overview.</p>
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Today's Sales (PKR)</h3>
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
          <h3 className="font-semibold text-foreground text-sm mb-4">Weekly Revenue (PKR)</h3>
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
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Top Selling Items</h3>
          <div className="space-y-3">
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

        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {sampleOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.type} • {order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">Rs. {order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'pending' ? 'bg-warning/10 text-warning' :
                    order.status === 'preparing' ? 'bg-primary/10 text-primary' :
                    order.status === 'ready' ? 'bg-success/10 text-success' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
