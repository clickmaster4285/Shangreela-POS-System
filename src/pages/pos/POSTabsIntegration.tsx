import { useEffect, useState } from 'react';
import { LayoutGrid, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE = 'Shiraz Restaurant_pos_tabs_v1';

export type POSTabSlot = {
  id: string;
  name: string;
  deviceHint: string;
  linkedTerminal: string;
  active: boolean;
};

const DEFAULT_TABS: POSTabSlot[] = [
  { id: 't1', name: 'POS tab 1', deviceHint: 'Front counter — display A', linkedTerminal: 'TERM-01', active: true },
  { id: 't2', name: 'POS tab 2', deviceHint: 'Outdoor kiosk', linkedTerminal: 'TERM-02', active: true },
  { id: 't3', name: 'POS tab 3', deviceHint: 'Manager override station', linkedTerminal: 'TERM-03', active: true },
];

export default function POSTabsIntegration() {
  const [tabs, setTabs] = useState<POSTabSlot[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return DEFAULT_TABS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(tabs));
  }, [tabs]);

  const patch = (id: string, partial: Partial<POSTabSlot>) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, ...partial } : t)));
    toast.success('Tab configuration saved');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">POS tabs integration</h1>
        <p className="text-sm text-muted-foreground">Three concurrent POS tab sessions (qty 3) for multi-register operation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tabs.map(t => (
          <div key={t.id} className="pos-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={t.name}
                  onChange={e => patch(t.id, { name: e.target.value })}
                  className="font-semibold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary w-full text-sm outline-none"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MonitorSmartphone className="w-3 h-3" /> {t.linkedTerminal}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Device / location hint</label>
              <input
                value={t.deviceHint}
                onChange={e => patch(t.id, { deviceHint: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={t.active} onChange={e => patch(t.id, { active: e.target.checked })} className="rounded" />
              Tab session active
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
