import { useCallback, useMemo, useState } from 'react';
import { Truck, UserCircle, Banknote, Package } from 'lucide-react';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { usePosRealtimeScopes } from '@/hooks/use-pos-realtime';

type ShiftRow = {
  id: string;
  shiftLabel: string;
  supervisor: string;
  cashCollected: number;
  cardDigital: number;
  deliveriesCompleted: number;
  codPending: number;
};

export default function OutdoorDeliveryReport() {
  const [data, setData] = useState<ShiftRow[]>([]);
  const [filter, setFilter] = useState('');
  const loadOutdoor = useCallback(() => {
    api<{ items: Omit<ShiftRow, 'id'>[] }>('/reports/outdoor-delivery').then(r =>
      setData(r.items.map((x, i) => ({ ...x, id: String(i + 1) })))
    );
  }, []);

  useEffect(() => {
    loadOutdoor();
  }, [loadOutdoor]);

  usePosRealtimeScopes(['orders', 'deliveries', 'dashboard'], loadOutdoor);

  const rows = useMemo(() => data.filter(r => r.supervisor.toLowerCase().includes(filter.toLowerCase()) || r.shiftLabel.toLowerCase().includes(filter.toLowerCase())), [filter, data]);

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
