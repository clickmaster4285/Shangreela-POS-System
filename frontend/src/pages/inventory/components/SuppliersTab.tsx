import { Search, Truck, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import { type Supplier } from '@/data/inventory/inventoryData';

interface SuppliersTabProps {
   suppliers: Supplier[];
   supplierSearch: string;
   setSupplierSearch: (v: string) => void;
   supplierMeta: { hasNext: boolean; hasPrev: boolean };
   supplierPage: number;
   setSupplierPage: React.Dispatch<React.SetStateAction<number>>;
   onEditSupplier: (supplier: Supplier) => void;
   onDeleteSupplier: (id: string) => Promise<void>;
}

const supplierId = (s: Supplier) => s.id || (s as any)._id || '';

export function SuppliersTab({
   suppliers, supplierSearch, setSupplierSearch, supplierMeta,
   supplierPage, setSupplierPage, onEditSupplier, onDeleteSupplier
}: SuppliersTabProps) {
   return (
      <div className="space-y-4">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
               value={supplierSearch}
               onChange={e => setSupplierSearch(e.target.value)}
               placeholder="Search suppliers..."
               className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm outline-none shadow-sm"
            />
         </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map(s => (
               <div key={supplierId(s)} className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                           <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-foreground">{s.name}</h3>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditSupplier(s)}
                           className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground border border-border">
                           <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteSupplier(supplierId(s))}
                           className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive border border-destructive/20">
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-border/50 text-xs text-muted-foreground">
                     <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone}</div>
                     <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {s.email || '—'}</div>
                     <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {s.address || '—'}</div>
                  </div>
               </div>
            ))}
            {suppliers.length === 0 && (
               <div className="col-span-full py-20 text-center bg-muted/20 border border-dashed border-border rounded-2xl italic text-muted-foreground">
                  No suppliers found matching your criteria.
               </div>
            )}
         </div>
         <div className="flex justify-end gap-2">
            <button disabled={!supplierMeta.hasPrev} onClick={() => setSupplierPage(p => Math.max(1, p - 1))}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Previous
            </button>
            <button disabled={!supplierMeta.hasNext} onClick={() => setSupplierPage(p => p + 1)}
               className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">
               Next
            </button>
         </div>
      </div>
   );
}