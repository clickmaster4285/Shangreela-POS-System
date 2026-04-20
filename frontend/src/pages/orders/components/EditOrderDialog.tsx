import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCcw 
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { useOrderStore } from '@/stores/pos/orderStore';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/common/use-debounce';
import Fuse from 'fuse.js';
import { MenuItem } from '@/data/pos/mockData';

interface EditOrderDialogProps {
  menuItems: MenuItem[];
  onSuccess: () => void;
}

export function EditOrderDialog({ menuItems, onSuccess }: EditOrderDialogProps) {
  const { editingOrder, setEditingOrder } = useOrderStore();
  
  // Local state for editing session
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemExtraName, setAddItemExtraName] = useState('');
  const [addItemExtraPrice, setAddItemExtraPrice] = useState<number | ''>('');
  const [replaceItemIndex, setReplaceItemIndex] = useState<number | null>(null);
  
  const debouncedItemSearch = useDebounce(itemSearch, 300);

  // Initialize editing items when order is selected
  useEffect(() => {
    if (editingOrder) {
      setEditingItems(editingOrder.items.map((it: any) => ({ ...it })));
      setItemSearch('');
      setReplaceItemIndex(null);
    }
  }, [editingOrder]);

  const filteredMenuItems = useMemo(() => {
    const q = debouncedItemSearch.trim();
    if (!q) return [];
    const fuse = new Fuse(menuItems, {
      keys: ['name', 'category'],
      threshold: 0.3,
    });
    return fuse.search(q).map(r => r.item);
  }, [menuItems, debouncedItemSearch]);

  const subtotal = useMemo(() => 
    editingItems.reduce((s, it) => s + (it.menuItem.price + (it.extraPrice || 0)) * it.quantity, 0)
  , [editingItems]);

  const handleUpdateQty = (index: number, delta: number) => {
    setEditingItems(prev => prev.map((it, i) => 
      i === index ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
    ));
  };

  const handleRemoveItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = (item: MenuItem) => {
    const newItem = {
      menuItem: item,
      quantity: addItemQty,
      notes: '',
      extraName: addItemExtraName,
      extraPrice: Number(addItemExtraPrice) || 0,
    };

    if (replaceItemIndex !== null) {
      setEditingItems(prev => prev.map((old, i) => i === replaceItemIndex ? newItem : old));
      setReplaceItemIndex(null);
      toast.success('Item replaced');
    } else {
      setEditingItems(prev => [...prev, newItem]);
      toast.success('Item added');
    }
    
    setItemSearch('');
    setAddItemQty(1);
    setAddItemExtraName('');
    setAddItemExtraPrice('');
  };

  const handleSave = async () => {
    if (!editingOrder) return;
    
    try {
      await api(`/orders/${editingOrder.dbId}/edit-items`, {
        method: 'PATCH',
        body: JSON.stringify({
          items: editingItems,
          subtotal: subtotal,
          tax: editingOrder.tax,
          discount: editingOrder.discount,
          total: subtotal + editingOrder.tax - editingOrder.discount,
          gstEnabled: editingOrder.gstEnabled,
        }),
      });
      
      toast.success('Order updated successfully');
      setEditingOrder(null);
      onSuccess();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <AlertDialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
      <AlertDialogContent className="max-h-[90vh] sm:max-w-3xl overflow-hidden flex flex-col p-0">
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <AlertDialogHeader className="relative">
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Order #{editingOrder?.id}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Modify items, quantities, or replace products for this active order.
            </AlertDialogDescription>
            <button 
              onClick={() => setEditingOrder(null)}
              className="absolute -right-2 -top-2 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </AlertDialogHeader>

          <div className="space-y-6">
            {/* Current Items Grid */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1">Current Basket</h4>
              <div className="grid gap-3">
                {editingItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-primary/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm uppercase tracking-tight">{item.menuItem.name}</p>
                      {item.extraName && (
                        <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-widest">
                          + {item.extraName} (Rs. {Number(item.extraPrice || 0).toLocaleString()})
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground font-bold mt-0.5">Rs. {item.menuItem.price.toLocaleString()} / unit</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-border">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, -1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setReplaceItemIndex(index)}
                        className={`p-2 rounded-xl border transition-all ${replaceItemIndex === index ? 'bg-primary text-white border-primary' : 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary hover:text-white'}`}
                        title="Replace Item"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addition / Replacement Section */}
            <div className="pt-6 border-t border-border/50 bg-muted/5 -mx-6 px-6 pb-2">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1 mb-4">
                {replaceItemIndex !== null ? \`Replace Slot #\${replaceItemIndex + 1}\` : 'Search for More Items'}
              </h4>
              
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Type to find menu items..."
                    className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>

                {itemSearch.trim() !== '' && (
                  <div className="rounded-2xl border border-primary/20 bg-card p-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="max-h-[320px] overflow-y-auto scrollbar-thin p-1">
                      {filteredMenuItems.length === 0 ? (
                        <div className="py-12 text-center opacity-40">
                          <p className="text-xs font-black uppercase tracking-widest">No Matches Found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {filteredMenuItems.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleAddItem(item)}
                              className="flex flex-col text-left p-4 rounded-2xl transition-all border border-border hover:border-primary/50 hover:bg-primary/5 group"
                            >
                              <p className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{item.name}</p>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.category}</span>
                                <span className="text-xs font-black text-primary">Rs. {item.price.toLocaleString()}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="bg-muted/10 p-6 border-t border-border/50 gap-4 sm:flex-row-reverse items-center justify-between">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">New Subtotal</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">Rs. {subtotal.toLocaleString()}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <AlertDialogCancel 
              onClick={() => setEditingOrder(null)}
              className="flex-1 sm:flex-none border-border rounded-xl font-bold text-xs uppercase tracking-widest px-8 py-6"
            >
              Discard
            </AlertDialogCancel>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest px-8 py-6 hover:bg-secondary transition-all shadow-xl shadow-primary/20"
            >
              Commit Changes
            </button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

