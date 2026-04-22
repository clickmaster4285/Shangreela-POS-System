import { X } from 'lucide-react';
import { type InventoryItem } from '@/data/inventory/inventoryData';

interface AdjustmentModalProps {
   adjustItem: InventoryItem;
   adjustQty: string;
   setAdjustQty: (qty: string) => void;
   adjustAction: 'use' | 'waste';
   setAdjustAction: (action: 'use' | 'waste') => void;
   adjustNote: string;
   setAdjustNote: (note: string) => void;
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   onClose: () => void;
   onSubmit: () => Promise<void>;
}

export function AdjustmentModal({
   adjustItem, adjustQty, setAdjustQty, adjustAction, setAdjustAction,
   adjustNote, setAdjustNote, isLocked, runLocked, onClose, onSubmit
}: AdjustmentModalProps) {
   return (
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-lg font-bold text-foreground">Stock Adjustment</h3>
               <button onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" />
               </button>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl">
               <p className="text-sm font-bold text-foreground">{adjustItem.name}</p>
               <p className="text-xs text-muted-foreground">Current Balance: {adjustItem.quantity} {adjustItem.unit}</p>
            </div>

            <div className="flex gap-1 bg-muted rounded-xl p-1">
               {(['use', 'waste'] as const).map(a => (
                  <button
                     key={a}
                     onClick={() => setAdjustAction(a)}
                     className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${adjustAction === a ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                  >
                     {a}
                  </button>
               ))}
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Quantity to {adjustAction}</label>
               <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
               />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Reason / Note</label>
               <input
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="e.g. Daily prep..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
               />
            </div>

            <div className="flex gap-2 pt-2">
               <button onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
               </button>
               <button
                  onClick={() => { void runLocked('inventory-adjust', onSubmit); }}
                  disabled={isLocked('inventory-adjust')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold text-primary-foreground transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${adjustAction === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-foreground hover:bg-black'
                     }`}
               >
                  {isLocked('inventory-adjust') ? 'Saving...' : 'Confirm'}
               </button>
            </div>
         </div>
      </div>
   );
}