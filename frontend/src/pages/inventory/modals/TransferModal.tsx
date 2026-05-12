import { useState } from 'react';
import { X, ArrowRightLeft, Trash2, Plus, Search } from 'lucide-react';
import { type InventoryItem, transferCategories } from '@/data/inventory/inventoryData';
import Fuse from 'fuse.js';

interface TransferModalProps {
   inventory: InventoryItem[];
   locations: string[];
   categories?: string[];
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   onClose: () => void;
   onSubmit: () => Promise<void>;
   newTransfer: {
      fromLocation: string;
      toLocation: string;
      transferCategory: string;
      note: string;
      items: { itemId: string; quantity: string; name: string; unit: string }[];
   };
   setNewTransfer: React.Dispatch<React.SetStateAction<any>>;
   addTransferItem: () => void;
   removeTransferItem: (i: number) => void;
   updateTransferItem: (i: number, itemId: string, quantity?: string) => void;
}

export function TransferModal({
   inventory, locations, categories = transferCategories, isLocked, runLocked, onClose, onSubmit,
   newTransfer, setNewTransfer, addTransferItem, removeTransferItem, updateTransferItem
}: TransferModalProps) {
   const [searchQuery, setSearchQuery] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);

   // Filter and search items (exclude already selected items)
   const fuse = new Fuse(inventory, {
      keys: ['name', 'category'],
      threshold: 0.3,
      minMatchCharLength: 2
   });

   const availableItems = inventory.filter(item => {
      // Don't show already selected items
      return !newTransfer.items.some(selected => selected.itemId === (item.id || item._id));
   });

   const searchResults = searchQuery.trim().length >= 2
      ? fuse.search(searchQuery).map(r => r.item).filter(item =>
         !newTransfer.items.some(selected => selected.itemId === (item.id || item._id))
      )
      : availableItems.slice(0, 10);

   const handleSelectItem = (item: InventoryItem) => {
      const emptySlotIndex = newTransfer.items.findIndex(i => !i.itemId);
      if (emptySlotIndex !== -1) {
         // Update existing empty slot
         updateTransferItem(emptySlotIndex, item.id || item._id || '');
      } else {
         // Add new item
         addTransferItem();
         const newIndex = newTransfer.items.length;
         setTimeout(() => {
            updateTransferItem(newIndex, item.id || item._id || '');
         }, 50);
      }
      setSearchQuery('');
      setShowDropdown(false);
   };

   return (
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-card rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-primary" /> Stock Transfer
               </h3>
               <button type="button" onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" />
               </button>
            </div>

            {/* Transfer Details */}
            <div className="space-y-3">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Section</label>
                  <select
                     value={newTransfer.transferCategory}
                     onChange={e => setNewTransfer((p: any) => ({ ...p, transferCategory: e.target.value }))}
                     className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                  >
                     {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1">From Location</label>
                     <select
                        value={newTransfer.fromLocation}
                        onChange={e => setNewTransfer((p: any) => ({ ...p, fromLocation: e.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                     >
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1">To Location</label>
                     <select
                        value={newTransfer.toLocation}
                        onChange={e => setNewTransfer((p: any) => ({ ...p, toLocation: e.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                     >
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            {/* Item Search Bar */}
            <div className="space-y-2">
               <label className="text-xs font-medium text-muted-foreground ml-1">Search & Add Items</label>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                     }}
                     onFocus={() => setShowDropdown(true)}
                     placeholder="Search by item name (e.g., Chicken, Rice, Tomato)..."
                     className="w-full pl-9 pr-3 py-2.5 bg-background border-2 border-primary/20 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />

                  {/* Dropdown Results */}
                  {showDropdown && searchQuery.trim().length >= 2 && (
                     <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                        {searchResults.length === 0 ? (
                           <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                              No items found matching "{searchQuery}"
                           </div>
                        ) : (
                           searchResults.map(item => (
                              <button
                                 key={item.id || item._id}
                                 type="button"
                                 onClick={() => handleSelectItem(item)}
                                 className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center justify-between group"
                              >
                                 <div className="flex-1">
                                    <div className="font-medium text-foreground">{item.name}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                       {item.category} • {item.quantity} {item.unit} available
                                    </div>
                                 </div>
                                 <div className="text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Add
                                 </div>
                              </button>
                           ))
                        )}
                     </div>
                  )}
               </div>
               <p className="text-[10px] text-muted-foreground ml-1">
                  Type at least 2 characters to search • Click on any item to add to transfer list
               </p>
            </div>

            {/* Transfer Items List */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground ml-1">
                     Items to Transfer ({newTransfer.items.filter(i => i.itemId).length})
                  </label>
                  <button
                     onClick={addTransferItem}
                     className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                     <Plus className="w-3 h-3" /> Add Empty Row
                  </button>
               </div>

               <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {newTransfer.items.length === 0 && (
                     <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                        No items added. Search and click on items above to add.
                     </div>
                  )}

                  {newTransfer.items.map((item, idx) => {
                     const inventoryItem = inventory.find(i => (i.id || i._id) === item.itemId);
                     return (
                        <div key={idx} className="flex gap-2 p-3 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors items-center group">
                           {/* Item Info */}
                           <div className="flex-1 min-w-0">
                              {inventoryItem ? (
                                 <div>
                                    <div className="font-medium text-sm text-foreground">{inventoryItem.name}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                       Available: {inventoryItem.quantity} {inventoryItem.unit} • {inventoryItem.category}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="text-sm text-muted-foreground italic">Select an item</div>
                              )}
                           </div>

                           {/* Quantity Input */}
                           <div className="flex items-center gap-2">
                              <input
                                 type="number"
                                 step="0.01"
                                 min="0.01"
                                 max={inventoryItem?.quantity || undefined}
                                 value={item.quantity}
                                 onChange={(e) => {
                                    const newItems = [...newTransfer.items];
                                    newItems[idx].quantity = e.target.value;
                                    setNewTransfer((p: any) => ({ ...p, items: newItems }));
                                 }}
                                 placeholder="Qty"
                                 disabled={!item.itemId}
                                 className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-xs text-muted-foreground w-12">
                                 {inventoryItem?.unit || 'unit'}
                              </span>

                              {/* Max Quantity Hint */}
                              {inventoryItem && parseFloat(item.quantity) > inventoryItem.quantity && (
                                 <span className="text-[10px] text-destructive whitespace-nowrap">
                                    Exceeds available
                                 </span>
                              )}

                              {/* Remove Button */}
                              <button
                                 onClick={() => removeTransferItem(idx)}
                                 className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 title="Remove item"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Transfer Note */}
            <div className="space-y-1">
               <label className="text-xs font-medium text-muted-foreground ml-1">Reason / Note (Optional)</label>
               <textarea
                  value={newTransfer.note}
                  onChange={e => setNewTransfer((p: any) => ({ ...p, note: e.target.value }))}
                  placeholder="Add a reason for this transfer..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20 resize-none"
               />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
               <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={() => { void runLocked('inventory-transfer', onSubmit); }}
                  disabled={isLocked('inventory-transfer') || newTransfer.items.filter(i => i.itemId && i.quantity).length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {isLocked('inventory-transfer') ? 'Processing...' : 'Complete Transfer'}
               </button>
            </div>
         </div>
      </div>
   );
}
