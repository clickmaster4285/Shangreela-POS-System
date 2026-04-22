import { AlertTriangle, X, Package } from 'lucide-react';
import { type InventoryItem } from '@/data/inventory/inventoryData';

interface AlertsTabProps {
   lowStockItems: InventoryItem[];
   expiredItems: InventoryItem[];
   setRestockItem: (item: InventoryItem) => void;
   setRestockData: (d: any) => void;
   setAdjustItem: (item: InventoryItem) => void;
   setAdjustAction: (a: 'use' | 'waste') => void;
}

export function AlertsTab({
   lowStockItems, expiredItems, setRestockItem, setRestockData,
   setAdjustItem, setAdjustAction
}: AlertsTabProps) {
   return (
      <div className="space-y-4">
         <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Critical Item</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issue</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Current Stock</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     {lowStockItems.map(item => (
                        <tr key={item.id || item._id} className="border-b border-border/50 bg-warning/5">
                           <td className="px-4 py-3 font-bold">{item.name}</td>
                           <td className="px-4 py-3 text-warning text-xs font-bold uppercase tracking-tight">
                              <span className="flex items-center gap-1">
                                 <AlertTriangle className="w-3 h-3" /> Low Stock (Min: {item.minStock})
                              </span>
                           </td>
                           <td className="px-4 py-3 text-right font-bold">{item.quantity} {item.unit}</td>
                           <td className="px-4 py-3 text-center">
                              <button
                                 onClick={() => {
                                    setRestockItem(item);
                                    setRestockData({
                                       quantity: '', costPerUnit: item.costPerUnit?.toString() || '',
                                       supplier: typeof item.supplier === 'object' ? (item.supplier as any)?._id : '',
                                       note: ''
                                    });
                                 }}
                                 className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                 Restock
                              </button>
                           </td>
                        </tr>
                     ))}
                     {expiredItems.map(item => (
                        <tr key={item.id || item._id} className="border-b border-border/50 bg-destructive/5">
                           <td className="px-4 py-3 font-bold">{item.name}</td>
                           <td className="px-4 py-3 text-destructive text-xs font-bold uppercase tracking-tight">
                              <span className="flex items-center gap-1">
                                 <X className="w-3 h-3" /> Expired ({item.expiryDate})
                              </span>
                           </td>
                           <td className="px-4 py-3 text-right font-bold">{item.quantity} {item.unit}</td>
                           <td className="px-4 py-3 text-center">
                              <button
                                 onClick={() => { setAdjustItem(item); setAdjustAction('waste'); }}
                                 className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                 Mark Wasted
                              </button>
                           </td>
                        </tr>
                     ))}
                     {lowStockItems.length === 0 && expiredItems.length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-4 py-20 text-center text-muted-foreground italic">
                              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p>No critical alerts at this time.</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}