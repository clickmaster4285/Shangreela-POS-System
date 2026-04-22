import { X, RotateCcw } from 'lucide-react';
import { type InventoryItem, type Supplier } from '@/data/inventory/inventoryData';

interface RestockModalProps {
   restockItem: InventoryItem;
   restockData: { quantity: string; costPerUnit: string; supplier: string; note: string };
   setRestockData: (data: any) => void;
   suppliers: Supplier[];
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   onClose: () => void;
   onSubmit: () => Promise<void>;
}

const supplierId = (s: Supplier) => s.id || (s as any)._id || '';

export function RestockModal({ restockItem, restockData, setRestockData, suppliers, isLocked, runLocked, onClose, onSubmit }: RestockModalProps) {
   return (
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-primary" /> Restock Item
               </h3>
               <button onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" />
               </button>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
               <p className="text-sm font-bold text-foreground">{restockItem.name}</p>
               <p className="text-xs text-muted-foreground">Current Stock: {restockItem.quantity} {restockItem.unit}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">New Quantity</label>
                  <input
                     type="number"
                     value={restockData.quantity}
                     onChange={e => setRestockData((p: any) => ({ ...p, quantity: e.target.value }))}
                     placeholder="0.00"
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Cost Per {restockItem.unit}</label>
                  <input
                     type="number"
                     value={restockData.costPerUnit}
                     onChange={e => setRestockData((p: any) => ({ ...p, costPerUnit: e.target.value }))}
                     placeholder="0.00"
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Supplier</label>
               <select
                  value={restockData.supplier}
                  onChange={e => setRestockData((p: any) => ({ ...p, supplier: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
               >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={supplierId(s)} value={supplierId(s)}>{s.name}</option>)}
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Note</label>
               <input
                  value={restockData.note}
                  onChange={e => setRestockData((p: any) => ({ ...p, note: e.target.value }))}
                  placeholder="Purchase details..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
               />
            </div>

            <div className="flex gap-2 pt-2">
               <button onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
               </button>
               <button
                  onClick={() => { void runLocked('inventory-restock', onSubmit); }}
                  disabled={isLocked('inventory-restock')}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {isLocked('inventory-restock') ? 'Saving...' : 'Confirm'}
               </button>
            </div>
         </div>
      </div>
   );
}