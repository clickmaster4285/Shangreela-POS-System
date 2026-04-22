import { type StockTransfer } from '@/data/inventory/inventoryData';

interface TransfersTabProps {
   transfers: StockTransfer[];
   transferMeta: { hasNext: boolean; hasPrev: boolean };
   transferPage: number;
   setTransferPage: React.Dispatch<React.SetStateAction<number>>;
}

const transferId = (t: StockTransfer) => t.id || (t as any)._id || '';

export function TransfersTab({ transfers, transferMeta, transferPage, setTransferPage }: TransfersTabProps) {
   return (
      <div className="space-y-3">
         <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transfer #</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">From</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">To</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {transfers.map(tr => (
                        <tr key={transferId(tr)} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                           <td className="px-4 py-3 font-bold text-foreground">{tr.transferNumber}</td>
                           <td className="px-4 py-3 text-muted-foreground text-xs">{tr.transferCategory}</td>
                           <td className="px-4 py-3 text-muted-foreground">{tr.fromLocation}</td>
                           <td className="px-4 py-3 text-muted-foreground">{tr.toLocation}</td>
                           <td className="px-4 py-3 text-muted-foreground">{tr.items.length} items</td>
                           <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(tr.transferDate).toLocaleDateString()}</td>
                           <td className="px-4 py-3 text-[10px] font-bold uppercase">
                              <span className={tr.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>
                                 {tr.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {transfers.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">No transfers recorded.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
         <div className="flex justify-end gap-2 p-3">
            <button disabled={!transferMeta.hasPrev} onClick={() => setTransferPage(p => Math.max(1, p - 1))}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Previous
            </button>
            <button disabled={!transferMeta.hasNext} onClick={() => setTransferPage(p => p + 1)}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Next
            </button>
         </div>
      </div>
   );
}