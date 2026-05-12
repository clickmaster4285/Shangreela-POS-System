import { Package, AlertTriangle, Clock, TrendingDown, Archive } from 'lucide-react';

interface SummaryCardsProps {
   totalItems: number;
   lowStockCount: number;
   expiringCount: number;
   expiredCount: number;
   perishableCount: number;
}

export function SummaryCards({ totalItems, lowStockCount, expiringCount, expiredCount, perishableCount }: SummaryCardsProps) {
   return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
         <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
               <Package className="w-3.5 h-3.5" /> Total Items
            </div>
            <p className="text-2xl font-bold text-foreground">{totalItems}</p>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-warning text-xs mb-1">
               <TrendingDown className="w-3.5 h-3.5" /> Low Stock
            </div>
            <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-orange-500 text-xs mb-1">
               <Clock className="w-3.5 h-3.5" /> Expiring Soon
            </div>
            <p className="text-2xl font-bold text-orange-500">{expiringCount}</p>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-destructive text-xs mb-1">
               <AlertTriangle className="w-3.5 h-3.5" /> Expired
            </div>
            <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border col-span-2 lg:col-span-1 shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 text-xs mb-1">
               <Archive className="w-3.5 h-3.5" /> Perishable SKUs
            </div>
            <p className="text-2xl font-bold text-foreground">{perishableCount}</p>
         </div>
      </div>
   );
}