import { useMemo, useState } from 'react';
import { Plus, Edit2, RotateCcw, Trash2 } from 'lucide-react';
import { type InventoryItem, inventoryCategories } from '@/data/inventory/inventoryData';
import { InventoryFilters } from './InventoryFilters';

interface StockTabProps {
   inventory: InventoryItem[];
   stockMeta: { hasNext: boolean; hasPrev: boolean };
   stockPage: number;
   setStockPage: React.Dispatch<React.SetStateAction<number>>;
   search: string;
   setSearch: (v: string) => void;
   catFilter: string;
   setCatFilter: (v: string) => void;
   perishableOnly: boolean;
   setPerishableOnly: (v: boolean) => void;
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   setRestockItem: (item: InventoryItem) => void;
   setRestockData: (d: any) => void;
   openEditItemForm: (item: InventoryItem) => void;
   setAdjustItem: (item: InventoryItem) => void;
   setAdjustAction: (a: 'use' | 'waste') => void;
   handleDeleteItem: (item: InventoryItem) => Promise<void>;
}

const STOCK_ROW_HEIGHT = 66;
const STOCK_VIEWPORT_HEIGHT = 520;
const STOCK_OVERSCAN = 6;

const getExpiryState = (expiryDate?: string) => {
   if (!expiryDate) {
      return { isExpired: false, isExpiringSoon: false };
   }

   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const threshold = new Date(today);
   threshold.setDate(threshold.getDate() + 3);

   const expiry = new Date(expiryDate);
   expiry.setHours(0, 0, 0, 0);

   return {
      isExpired: expiry < today,
      isExpiringSoon: expiry >= today && expiry <= threshold,
   };
};

export function StockTab({
   inventory, stockMeta, setStockPage,
   search, setSearch, catFilter, setCatFilter, perishableOnly, setPerishableOnly,
   isLocked, runLocked, setRestockItem, setRestockData, openEditItemForm,
   setAdjustItem, setAdjustAction, handleDeleteItem,
}: StockTabProps) {
   const [scrollTop, setScrollTop] = useState(0);

   const stockStartIndex = Math.max(0, Math.floor(scrollTop / STOCK_ROW_HEIGHT) - STOCK_OVERSCAN);
   const stockEndIndex = Math.min(
      inventory.length,
      stockStartIndex + Math.ceil(STOCK_VIEWPORT_HEIGHT / STOCK_ROW_HEIGHT) + STOCK_OVERSCAN * 2
   );
   const virtualRows = useMemo(
      () => inventory.slice(stockStartIndex, stockEndIndex),
      [inventory, stockStartIndex, stockEndIndex]
   );

   const expiringSoonCount = useMemo(
      () => inventory.filter((item) => getExpiryState(item.expiryDate).isExpiringSoon).length,
      [inventory]
   );

   return (
      <div className="space-y-3">
         <div className="flex gap-2 flex-wrap">
            <InventoryFilters
               search={search}
               setSearch={(value) => {
                  setSearch(value);
                  setStockPage(1);
               }}
               searchPlaceholder="Search stock..."
               category={catFilter}
               setCategory={(value) => {
                  setCatFilter(value);
                  setStockPage(1);
               }}
               categories={inventoryCategories}
               debounceMs={350}
            />
            <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap cursor-pointer">
               <input
                  type="checkbox"
                  checked={perishableOnly}
                  onChange={e => { setPerishableOnly(e.target.checked); setStockPage(1); }}
                  className="rounded accent-primary"
               />
               Perishable only
            </label>
         </div>

         <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div
               className="overflow-x-auto overflow-y-auto"
               style={{ maxHeight: `${STOCK_VIEWPORT_HEIGHT}px` }}
               onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
            >
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Min</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price/Unit</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{`Expiry (${expiringSoonCount})`}</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {stockStartIndex > 0 && (
                        <tr><td colSpan={8} style={{ height: stockStartIndex * STOCK_ROW_HEIGHT }} /></tr>
                     )}
                     {virtualRows.map(item => {
                        const isLow = item.quantity <= item.minStock;
                        const { isExpired, isExpiringSoon } = getExpiryState(item.expiryDate);
                        const latestPrice = item.restockHistory?.length
                           ? item.restockHistory[item.restockHistory.length - 1].costPerUnit
                           : item.costPerUnit;
                        return (
                           <tr
                              key={item.id || item._id}
                              className={`border-b border-border/50 ${isExpired ? 'bg-destructive/5' : isExpiringSoon ? 'bg-orange-50' : isLow ? 'bg-warning/5' : ''} hover:bg-muted/20 transition-colors`}
                           >
                              <td className="px-4 py-3 font-medium text-foreground">
                                 {item.name}
                                 {item.perishable && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">P</span>}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-warning' : 'text-foreground'}`}>
                                 {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">{item.minStock}</td>
                              <td className="px-4 py-3 text-right font-mono text-primary font-semibold text-xs">
                                 {latestPrice != null && latestPrice > 0 ? `Rs. ${latestPrice}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                 {item.supplier && typeof item.supplier === 'object' ? (item.supplier as any).name : '-'}
                              </td>
                              <td className={`px-4 py-3 text-xs ${isExpired ? 'text-destructive font-semibold' : isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}`}>
                                 {item.expiryDate || '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <button
                                       onClick={() => {
                                          setRestockItem(item);
                                          setRestockData({
                                             quantity: '',
                                             costPerUnit: item.costPerUnit?.toString() || '',
                                             supplier: typeof item.supplier === 'object' ? (item.supplier as any)?._id : '',
                                             note: '',
                                          });
                                       }}
                                       className="bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-success hover:text-white transition-colors"
                                    >
                                       <Plus className="w-3 h-3" /> Restock
                                    </button>
                                    <button
                                       onClick={() => openEditItemForm(item)}
                                       className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                       <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                       onClick={() => { setAdjustItem(item); setAdjustAction('use'); }}
                                       className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground border border-border"
                                       title="Adjustment"
                                    >
                                       <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                       onClick={() => { void runLocked(`inventory-delete-item-${item.id || item._id}`, () => handleDeleteItem(item)); }}
                                       disabled={isLocked(`inventory-delete-item-${item.id || item._id}`)}
                                       className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive border border-destructive/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                       title="Delete item"
                                    >
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     {inventory.length === 0 && (
                        <tr>
                           <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">No items found.</td>
                        </tr>
                     )}
                     {stockEndIndex < inventory.length && (
                        <tr><td colSpan={8} style={{ height: (inventory.length - stockEndIndex) * STOCK_ROW_HEIGHT }} /></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
         <div className="flex justify-end gap-2 p-3">
            <button
               disabled={!stockMeta.hasPrev}
               onClick={() => setStockPage(p => Math.max(1, p - 1))}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted transition-colors shadow-sm"
            >
               Previous
            </button>
            <button
               disabled={!stockMeta.hasNext}
               onClick={() => setStockPage(p => p + 1)}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted transition-colors shadow-sm"
            >
               Next
            </button>
         </div>
      </div>
   );
}
