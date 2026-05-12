import { AlertTriangle, X, Package, Clock } from 'lucide-react';
import { type InventoryItem } from '@/data/inventory/inventoryData';

interface AlertsTabProps {
   alertItems: InventoryItem[];
   alertsMeta: { hasNext: boolean; hasPrev: boolean; pages?: number };
   alertsPage: number;
   setAlertsPage: (p: number) => void;
   setRestockItem: (item: InventoryItem) => void;
   setRestockData: (d: any) => void;
   setAdjustItem: (item: InventoryItem) => void;
   setAdjustAction: (a: 'use' | 'waste') => void;
}

export function AlertsTab({
   alertItems, alertsMeta, alertsPage, setAlertsPage,
   setRestockItem, setRestockData, setAdjustItem, setAdjustAction
}: AlertsTabProps) {
   const today = new Date();

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
                     {alertItems.map(item => {
                        const isLowStock = item.quantity <= item.minStock;
                        const isExpired = item.expiryDate && new Date(item.expiryDate) < today;
                        const isExpiringSoon = item.expiryDate && !isExpired && (new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 3;

                        return (
                           <tr key={item.id || item._id} className={`border-b border-border/50 ${isExpired ? 'bg-destructive/5' : 'bg-warning/5'}`}>
                              <td className="px-4 py-3 font-bold">{item.name}</td>
                              <td className="px-4 py-3 text-xs font-bold uppercase tracking-tight">
                                 {isExpired && (
                                    <span className="flex items-center gap-1 text-destructive">
                                       <X className="w-3 h-3" /> Expired ({new Date(item.expiryDate!).toLocaleDateString()})
                                    </span>
                                 )}
                                 {isExpiringSoon && (
                                    <span className="flex items-center gap-1 text-warning">
                                       <Clock className="w-3 h-3" /> Expiring Soon ({new Date(item.expiryDate!).toLocaleDateString()})
                                    </span>
                                 )}
                                 {isLowStock && (
                                    <span className={`flex items-center gap-1 text-warning ${isExpired || isExpiringSoon ? 'mt-1' : ''}`}>
                                       <AlertTriangle className="w-3 h-3" /> Low Stock (Min: {item.minStock})
                                    </span>
                                 )}
                              </td>
                              <td className="px-4 py-3 text-right font-bold">{item.quantity} {item.unit}</td>
                              <td className="px-4 py-3 text-center">
                                 <div className="flex justify-center gap-2">
                                    <button
                                       onClick={() => {
                                          setRestockItem(item);
                                          setRestockData({
                                             quantity: '', costPerUnit: item.costPerUnit?.toString() || '',
                                             supplier: typeof item.supplier === 'object' ? (item.supplier as any)?._id : item.supplier || '',
                                             note: ''
                                          });
                                       }}
                                       className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                    >
                                       Restock
                                    </button>
                                    <button
                                       onClick={() => { setAdjustItem(item); setAdjustAction('waste'); }}
                                       className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                    >
                                       Waste
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     {alertItems.length === 0 && (
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

         {/* Pagination */}
         <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               Page {alertsPage} {alertsMeta.pages ? `of ${alertsMeta.pages}` : ''}
            </div>
            <div className="flex gap-2">
               <button
                  disabled={!alertsMeta.hasPrev}
                  onClick={() => setAlertsPage(alertsPage - 1)}
                  className="px-3 py-1 rounded-lg border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-muted transition-colors"
               >
                  Prev
               </button>
               <button
                  disabled={!alertsMeta.hasNext}
                  onClick={() => setAlertsPage(alertsPage + 1)}
                  className="px-3 py-1 rounded-lg border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-muted transition-colors"
               >
                  Next
               </button>
            </div>
         </div>
      </div>
   );
}
