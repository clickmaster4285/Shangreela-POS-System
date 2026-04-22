import { type InventoryLog } from '@/data/inventory/inventoryData';

interface LogsTabProps {
   logs: InventoryLog[];
   logsMeta: { hasNext: boolean; hasPrev: boolean };
   logsPage: number;
   setLogsPage: React.Dispatch<React.SetStateAction<number>>;
}

const logId = (l: InventoryLog) => l.id || (l as any)._id || '';

export function LogsTab({ logs, logsMeta, logsPage, setLogsPage }: LogsTabProps) {
   return (
      <div className="space-y-3">
         <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                     </tr>
                  </thead>
                  <tbody>
                     {logs.map(log => (
                        <tr key={logId(log)} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                           <td className="px-4 py-3 text-muted-foreground text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                           <td className="px-4 py-3 font-bold">{log.itemName}</td>
                           <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${log.action === 'restocked' ? 'bg-green-100 text-green-700' :
                                    log.action === 'wasted' ? 'bg-red-100 text-red-700' :
                                       'bg-muted text-muted-foreground'
                                 }`}>
                                 {log.action}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-right font-mono font-bold">{log.quantity}{(log as any).unit ? ` ${(log as any).unit}` : ''}</td>
                           <td className="px-4 py-3 text-right font-mono text-primary font-bold">{log.price ? `Rs. ${log.price}` : '—'}</td>
                           <td className="px-4 py-3 text-muted-foreground text-xs italic">{log.note}</td>
                        </tr>
                     ))}
                     {logs.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">No activities recorded yet.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
         <div className="flex justify-end gap-2 p-3">
            <button disabled={!logsMeta.hasPrev} onClick={() => setLogsPage(p => Math.max(1, p - 1))}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Previous
            </button>
            <button disabled={!logsMeta.hasNext} onClick={() => setLogsPage(p => p + 1)}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Next
            </button>
         </div>
      </div>
   );
}