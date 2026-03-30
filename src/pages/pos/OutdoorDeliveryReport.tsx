import { useMemo, useState } from 'react';
import { Truck, UserCircle, Banknote, Package } from 'lucide-react';

type ShiftRow = {
  id: string;
  shiftLabel: string;
  supervisor: string;
  cashCollected: number;
  cardDigital: number;
  deliveriesCompleted: number;
  codPending: number;
};

const DEMO: ShiftRow[] = [
  { id: '1', shiftLabel: 'Lunch — Mon', supervisor: 'Hassaan shb', cashCollected: 18500, cardDigital: 42200, deliveriesCompleted: 14, codPending: 2 },
  { id: '2', shiftLabel: 'Evening — Mon', supervisor: 'Fahad shb', cashCollected: 24600, cardDigital: 68100, deliveriesCompleted: 22, codPending: 1 },
  { id: '3', shiftLabel: 'Lunch — Sun', supervisor: 'Hassaan shb', cashCollected: 22100, cardDigital: 31500, deliveriesCompleted: 11, codPending: 0 },
];

export default function OutdoorDeliveryReport() {
  const [filter, setFilter] = useState('');
  const rows = useMemo(() => DEMO.filter(r => r.supervisor.toLowerCase().includes(filter.toLowerCase()) || r.shiftLabel.toLowerCase().includes(filter.toLowerCase())), [filter]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          cash: a.cash + r.cashCollected,
          digital: a.digital + r.cardDigital,
          del: a.del + r.deliveriesCompleted,
          cod: a.cod + r.codPending,
        }),
        { cash: 0, digital: 0, del: 0, cod: 0 }
      ),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Outdoor delivery report</h1>
        <p className="text-sm text-muted-foreground">Per shift supervisor: cash collection, digital/card, and delivery counts (including COD pending).</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="pos-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Banknote className="w-3.5 h-3.5" /> Cash collected
          </div>
          <p className="text-xl font-bold text-foreground">Rs {totals.cash.toLocaleString()}</p>
        </div>
        <div className="pos-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Truck className="w-3.5 h-3.5" /> Deliveries
          </div>
          <p className="text-xl font-bold text-foreground">{totals.del}</p>
        </div>
        <div className="pos-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">Card / digital</div>
          <p className="text-xl font-bold text-foreground">Rs {totals.digital.toLocaleString()}</p>
        </div>
        <div className="pos-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Package className="w-3.5 h-3.5" /> COD pending
          </div>
          <p className="text-xl font-bold text-warning">{totals.cod}</p>
        </div>
      </div>

      <div className="pos-card p-4">
        <label className="text-xs text-muted-foreground">Filter by supervisor or shift</label>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="e.g. Hassaan or Lunch"
          className="mt-1 w-full max-w-md bg-background border border-border rounded-xl px-3 py-2 text-sm"
        />
      </div>

      <div className="pos-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Shift</th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <UserCircle className="w-3.5 h-3.5" /> Supervisor
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-right">Cash collection</th>
                <th className="px-4 py-3 font-medium text-right">Card / digital</th>
                <th className="px-4 py-3 font-medium text-right">Deliveries</th>
                <th className="px-4 py-3 font-medium text-right">COD pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{r.shiftLabel}</td>
                  <td className="px-4 py-3 text-foreground">{r.supervisor}</td>
                  <td className="px-4 py-3 text-right">Rs {r.cashCollected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">Rs {r.cardDigital.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.deliveriesCompleted}</td>
                  <td className="px-4 py-3 text-right text-warning font-medium">{r.codPending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
