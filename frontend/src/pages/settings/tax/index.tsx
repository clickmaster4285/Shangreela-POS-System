import { Percent, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/api';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';

export default function TaxDetails() {
  const [salesTaxRate, setSalesTaxRate] = useState(16);
  const [serviceChargeRate, setServiceChargeRate] = useState(10);
  const [takeawayChargeRate, setTakeawayChargeRate] = useState(5);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);
  const [withholdingLabel, setWithholdingLabel] = useState('As per FBR');

  const loadTax = useCallback(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number; takeawayChargeRate: number; minimumOrderAmount: number; withholdingLabel: string }>('/settings/tax').then(r => {
      setSalesTaxRate(r.salesTaxRate ?? 16);
      setServiceChargeRate(r.serviceChargeRate ?? 10);
      setTakeawayChargeRate(r.takeawayChargeRate ?? 5);
      setMinimumOrderAmount(r.minimumOrderAmount ?? 0);
      setWithholdingLabel(r.withholdingLabel ?? 'As per FBR');
    });
  }, []);

  useEffect(() => {
    loadTax();
  }, [loadTax]);

  usePosRealtimeScopes(['settings'], loadTax);

  const rows = [
    { name: 'Sales tax (provincial)', rate: `${salesTaxRate}%`, applies: 'Taxable food & beverages (configurable by item)' },
    { name: 'Service / service charge', rate: `${serviceChargeRate}%`, applies: 'Optional service charge on dine-in (before tax)' },
    { name: 'Take-away / packaging charge', rate: `${takeawayChargeRate}%`, applies: 'Optional charge on takeaway orders (boxes, bags, etc)' },
    { name: 'Minimum order amount', rate: minimumOrderAmount ? `Rs. ${minimumOrderAmount.toLocaleString()}` : 'No minimum', applies: 'Orders below this amount get no GST, service charge, or takeaway charge' },
    { name: 'Withholding (WHT)', rate: withholdingLabel, applies: 'Corporate billing / invoice mode' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Tax details</h1>
        <p className="text-sm text-muted-foreground">Rates shown for configuration; validate with your accountant and FBR notices.</p>
      </div>

      <div className="pos-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Percent className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Effective tax configuration</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Default rate</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{r.rate}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.applies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pos-card p-4 flex gap-3">
        <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Receipts can show subtotal, discount, each tax line, and grand total for audit.</p>
          <p>FBR integration page links digital invoice references when live API is configured.</p>
        </div>
      </div>
      <div className="pos-card p-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Sales Tax Rate (%)</label>
          <input type="number" value={salesTaxRate} onChange={e => setSalesTaxRate(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="e.g., 16" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Service Charge Rate (%)</label>
          <input type="number" value={serviceChargeRate} onChange={e => setServiceChargeRate(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="e.g., 5" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Takeaway Charge Rate (%)</label>
          <input type="number" value={takeawayChargeRate} onChange={e => setTakeawayChargeRate(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="e.g., 5" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Minimum Order Amount (Rs)</label>
          <input type="number" value={minimumOrderAmount} onChange={e => setMinimumOrderAmount(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="e.g., 1000" />
          <p className="text-[10px] text-muted-foreground mt-1">Orders below this amount get no GST, service charge, or takeaway charge</p>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Withholding Label</label>
          <input value={withholdingLabel} onChange={e => setWithholdingLabel(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="e.g., As per FBR" />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => api('/settings/tax', { method: 'PUT', body: JSON.stringify({ salesTaxRate, serviceChargeRate, takeawayChargeRate, minimumOrderAmount, withholdingLabel }) })}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium"
          >
            Save tax settings
          </button>
        </div>
      </div>
    </div>
  );
}
