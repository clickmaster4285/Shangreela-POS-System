import { Percent, FileText } from 'lucide-react';

const rows = [
  { name: 'Sales tax (provincial)', rate: '16%', applies: 'Taxable food & beverages (configurable by item)' },
  { name: 'Further tax', rate: '4%', applies: 'Unregistered supplier scenarios (if applicable)' },
  { name: 'Service / service charge', rate: '10%', applies: 'Optional service charge on dine-in (before tax)' },
  { name: 'Withholding (WHT)', rate: 'As per FBR', applies: 'Corporate billing / invoice mode' },
];

export default function TaxDetails() {
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
    </div>
  );
}
