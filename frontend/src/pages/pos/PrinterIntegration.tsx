import { useCallback, useEffect, useState } from 'react';
import { Printer, Usb, Wifi, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { usePosRealtimeScopes } from '@/hooks/use-pos-realtime';

export type PrinterSlot = {
  id: string;
  label: string;
  role: string;
  connection: 'usb' | 'network';
  address: string;
  enabled: boolean;
};

const DEFAULT_PRINTERS: PrinterSlot[] = [
  { id: 'p1', label: 'Receipt printer', role: 'Customer receipt & FBR slip', connection: 'network', address: '192.168.1.201:9100', enabled: true },
  { id: 'p2', label: 'Kitchen printer', role: 'KOT / kitchen tickets', connection: 'usb', address: 'USB001', enabled: true },
  { id: 'p3', label: 'Bar / cold station', role: 'Beverages & desserts', connection: 'network', address: '192.168.1.202:9100', enabled: true },
];

export default function PrinterIntegration() {
  const [slots, setSlots] = useState<PrinterSlot[]>(DEFAULT_PRINTERS);

  const loadPrinters = useCallback(() => {
    api<{ items: PrinterSlot[] }>('/settings/printers')
      .then(r => setSlots(r.items.length ? r.items : DEFAULT_PRINTERS))
      .catch(() => setSlots(DEFAULT_PRINTERS));
  }, []);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  usePosRealtimeScopes(['settings'], loadPrinters);

  const update = (id: string, patch: Partial<PrinterSlot>) => {
    setSlots(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...patch } : p));
      api('/settings/printers', { method: 'PUT', body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
    toast.success('Printer settings saved');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Printer integration</h1>
        <p className="text-sm text-muted-foreground">Three printer channels (qty 3) — receipt, kitchen, and bar. Connect hardware drivers on the POS workstation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {slots.map(p => (
          <div key={p.id} className="pos-card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.label}</h3>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => update(p.id, { enabled: !p.enabled })}
                className="text-muted-foreground hover:text-foreground"
                title="Toggle enabled"
              >
                {p.enabled ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5" />}
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Connection</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => update(p.id, { connection: 'usb' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border ${p.connection === 'usb' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  <Usb className="w-3.5 h-3.5" /> USB
                </button>
                <button
                  type="button"
                  onClick={() => update(p.id, { connection: 'network' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border ${p.connection === 'network' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  <Wifi className="w-3.5 h-3.5" /> Network
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Address / port</label>
              <input
                value={p.address}
                onChange={e => update(p.id, { address: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                placeholder="IP:port or USB id"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
