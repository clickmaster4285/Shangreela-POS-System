import { X } from 'lucide-react';
import { type InventoryItem, type Supplier, inventoryCategories } from '@/data/inventory/inventoryData';

const BASE_UNITS = ['kg', 'g', 'liter', 'ml', 'dozen', 'tray', 'piece', 'pack', 'box', 'bottle', 'can', 'jar', 'bag', 'sack', 'cup', 'tbsp', 'tsp', 'slice', 'portion', 'plate'] as const;

interface AddItemModalProps {
   editingItem: InventoryItem | null;
   newItem: any;
   setNewItem: (item: any) => void;
   suppliers: Supplier[];
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   onClose: () => void;
   onSubmit: () => Promise<void>;
}

const supplierId = (s: Supplier) => s.id || (s as any)._id || '';

export function AddItemModal({ editingItem, newItem, setNewItem, suppliers, isLocked, runLocked, onClose, onSubmit }: AddItemModalProps) {
   return (
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-lg font-bold text-foreground">
                  {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
               </h3>
               <button type="button" onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" />
               </button>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-medium text-muted-foreground ml-1">Item Name</label>
               <input
                  value={newItem.name}
                  onChange={e => setNewItem((p: any) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Basmati Rice"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
               />
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                  <select
                     value={newItem.category}
                     onChange={e => setNewItem((p: any) => ({ ...p, category: e.target.value }))}
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                     {inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Base Unit</label>
                  <select
                     value={newItem.unit}
                     onChange={e => setNewItem((p: any) => ({ ...p, unit: e.target.value }))}
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                     {BASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Opening Qty</label>
                  <input
                     type="number"
                     value={newItem.quantity}
                     onChange={e => setNewItem((p: any) => ({ ...p, quantity: e.target.value }))}
                     placeholder="0"
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Min Stock</label>
                  <input
                     type="number"
                     value={newItem.minStock}
                     onChange={e => setNewItem((p: any) => ({ ...p, minStock: e.target.value }))}
                     placeholder="5"
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Cost/Unit</label>
                  <input
                     type="number"
                     value={newItem.costPerUnit}
                     onChange={e => setNewItem((p: any) => ({ ...p, costPerUnit: e.target.value }))}
                     placeholder="0.00"
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-medium text-muted-foreground ml-1">Supplier (Optional)</label>
               <select
                  value={newItem.supplier}
                  onChange={e => setNewItem((p: any) => ({ ...p, supplier: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
               >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={supplierId(s)} value={supplierId(s)}>{s.name}</option>)}
               </select>
            </div>

            <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
               <input
                  type="checkbox"
                  checked={newItem.perishable}
                  onChange={e => setNewItem((p: any) => ({ ...p, perishable: e.target.checked }))}
                  className="rounded accent-primary"
               />
               <span className="text-muted-foreground text-xs">Perishable item (has expiry date)</span>
            </label>

            {newItem.perishable && (
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Expiry Date</label>
                  <input
                     type="date"
                     value={newItem.expiryDate}
                     onChange={e => setNewItem((p: any) => ({ ...p, expiryDate: e.target.value }))}
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
            )}

            <div className="flex gap-2 pt-2">
               <button onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
               </button>
               <button
                  onClick={() => { void runLocked('inventory-add-item', onSubmit); }}
                  disabled={isLocked('inventory-add-item')}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {isLocked('inventory-add-item') ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
               </button>
            </div>
         </div>
      </div>
   );
}