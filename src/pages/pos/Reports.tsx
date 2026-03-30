import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { weeklySalesData, topSellingItems } from '@/data/mockData';
import { TrendingUp, DollarSign, Package, Percent, MapPinned, FileBarChart } from 'lucide-react';

const pieColors = ['hsl(340,70%,21%)', 'hsl(340,60%,30%)', 'hsl(15,45%,81%)', 'hsl(40,70%,55%)', 'hsl(15,25%,13%)'];
const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function Reports() {
  const totalRevenue = weeklySalesData.reduce((s, d) => s + d.revenue, 0);
  const totalSold = topSellingItems.reduce((s, i) => s + i.sold, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Reporting</h1>
        <p className="text-sm text-muted-foreground">Weekly sales, tax-oriented summaries, and links to specialised reports.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link
          to="/pos/tax"
          className="pos-card flex items-center gap-3 hover:border-primary/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Percent className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Tax details</p>
            <p className="text-xs text-muted-foreground">Rates, components, receipt lines</p>
          </div>
        </Link>
        <Link
          to="/pos/outdoor-delivery-report"
          className="pos-card flex items-center gap-3 hover:border-primary/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPinned className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Outdoor delivery report</p>
            <p className="text-xs text-muted-foreground">Shift supervisor · cash & deliveries</p>
          </div>
        </Link>
        <Link
          to="/pos/fbr"
          className="pos-card flex items-center gap-3 hover:border-primary/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">FBR POS</p>
            <p className="text-xs text-muted-foreground">Digital invoice integration status</p>
          </div>
        </Link>
      </div>

      <div className="pos-card">
        <h3 className="font-semibold text-foreground text-sm mb-2">Tax snapshot (demo)</h3>
        <p className="text-xs text-muted-foreground">
          Estimated sales tax on weekly revenue ({formatPKR(totalRevenue)}):{' '}
          <span className="font-semibold text-foreground">{formatPKR(Math.round(totalRevenue * 0.16))}</span> at 16% (adjust in Tax details).
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Weekly Revenue', value: formatPKR(totalRevenue), icon: DollarSign },
          { label: 'Items Sold', value: totalSold.toString(), icon: Package },
          { label: 'Avg Order', value: formatPKR(Math.round(totalRevenue / 48)), icon: TrendingUp },
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card">
          <h3 className="font-semibold text-foreground text-sm mb-4">Revenue by Day (PKR)</h3>
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
