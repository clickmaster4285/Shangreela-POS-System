import { Percent, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePosRealtimeScopes } from '@/hooks/use-pos-realtime';

export default function TaxDetails() {
  const [salesTaxRate, setSalesTaxRate] = useState(16);
  const [serviceChargeRate, setServiceChargeRate] = useState(10);
  const [withholdingLabel, setWithholdingLabel] = useState('As per FBR');

  const loadTax = useCallback(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number; withholdingLabel: string }>('/settings/tax').then(r => {
      setSalesTaxRate(r.salesTaxRate ?? 16);
      setServiceChargeRate(r.serviceChargeRate ?? 10);
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
      <div className="pos-card p-4 grid sm:grid-cols-2 gap-3">
        <input type="number" value={salesTaxRate} onChange={e => setSalesTaxRate(Number(e.target.value))} className="bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Sales tax %" />
        <input type="number" value={serviceChargeRate} onChange={e => setServiceChargeRate(Number(e.target.value))} className="bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Service charge %" />
        <input value={withholdingLabel} onChange={e => setWithholdingLabel(e.target.value)} className="bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Withholding label" />
        <button
          type="button"
          onClick={() => api('/settings/tax', { method: 'PUT', body: JSON.stringify({ salesTaxRate, serviceChargeRate, withholdingLabel }) })}
          className="sm:col-span-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium"
        >
          Save tax settings
        </button>
      </div>
    </div>
  );
}
