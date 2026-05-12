import { X } from 'lucide-react';
import { type Supplier } from '@/data/inventory/inventoryData';

interface SupplierFormModalProps {
   editingSupplier: Supplier | null;
   supplierData: { name: string; phone: string; email: string; address: string; items: string[] };
   setSupplierData: (data: any) => void;
   isLocked: (key: string) => boolean;
   runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
   onClose: () => void;
   onSubmit: () => Promise<void>;
}

export function SupplierFormModal({
   editingSupplier, supplierData, setSupplierData, isLocked, runLocked, onClose, onSubmit
}: SupplierFormModalProps) {
   return (
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-lg font-bold text-foreground">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
               </h3>
               <button onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" />
               </button>
            </div>

            <div className="space-y-3">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Business Name</label>
                  <input
                     value={supplierData.name}
                     onChange={e => setSupplierData((p: any) => ({ ...p, name: e.target.value }))}
                     placeholder="Business Name"
                     className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1">Phone</label>
                     <input
                        value={supplierData.phone}
                        onChange={e => setSupplierData((p: any) => ({ ...p, phone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1">Email</label>
                     <input
                        value={supplierData.email}
                        onChange={e => setSupplierData((p: any) => ({ ...p, email: e.target.value }))}
                        placeholder="Email"
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Address</label>
                  <textarea
                     value={supplierData.address}
                     onChange={e => setSupplierData((p: any) => ({ ...p, address: e.target.value }))}
                     placeholder="Address"
                     className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm min-h-[60px] shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
            </div>

            <div className="flex gap-2 pt-2">
               <button onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
               </button>
               <button
                  onClick={() => { void runLocked('inventory-supplier', onSubmit); }}
                  disabled={isLocked('inventory-supplier')}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {isLocked('inventory-supplier') ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Add Supplier'}
               </button>
            </div>
         </div>
      </div>
   );
}