import { useMemo, useState, useCallback } from 'react';
import { menuItems, floors, tables, type CartItem, type MenuItem, type TableInfo } from '@/data/mockData';
import {
  POSCategoryFolderGrid,
  POSFolderContent,
  POSPakistaniSubGrid,
  categoryLabelToDataCategory,
  type PakistaniSubfolder,
} from '@/components/pos/Form';
import { Plus, Minus, Trash2, ShoppingBag, Printer, Pause, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { printReceipt } from '@/utils/printReceipt';
import { computePakistanTaxTotals, PKR_FURTHER_TAX_RATE, PKR_GST_RATE } from '@/utils/pakistanTax';

export default function POSScreen() {
  const { hasAction } = useAuth();
  /** `null` = full-screen category folders; otherwise open that folder’s items */
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  /** Inside **Pakistani**: pick Karahi or Handi before showing items */
  const [pakistaniSub, setPakistaniSub] = useState<PakistaniSubfolder | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string>(floors[0]?.id ?? 'ground');
  const [noteItem, setNoteItem] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const selectedTable: TableInfo | null = useMemo(
    () => (selectedTableId != null ? tables.find(t => t.id === selectedTableId) ?? null : null),
    [selectedTableId]
  );

  const itemCount = useCallback((label: string) => {
    if (label === 'All') return menuItems.length;
    if (label === 'Pakistani') {
      return menuItems.filter(i => i.category === 'Karahi' || i.category === 'Handi').length;
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(label)).length;
  }, []);

  const folderItems = useMemo(() => {
    if (!openFolder) return [];
    if (openFolder === 'All') return menuItems;
    if (openFolder === 'Pakistani') {
      if (!pakistaniSub) return [];
      return menuItems.filter(i => i.category === pakistaniSub);
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(openFolder));
  }, [openFolder, pakistaniSub]);

  const openTopFolder = useCallback((label: string) => {
    setOpenFolder(label);
    setPakistaniSub(null);
  }, []);

  const handleFolderBack = useCallback(() => {
    if (openFolder === 'Pakistani' && pakistaniSub) {
      setPakistaniSub(null);
      return;
    }
    setOpenFolder(null);
    setPakistaniSub(null);
  }, [openFolder, pakistaniSub]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const discountAmt = 0;
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal } = computePakistanTaxTotals(subtotal, discountAmt);

  const saveNote = () => {
    if (noteItem) {
      setCart(prev => prev.map(c => c.menuItem.id === noteItem ? { ...c, notes: noteText } : c));
      setNoteItem(null);
      setNoteText('');
    }
  };

  const handleOrderTypeChange = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    setOrderType(type);
    if (type !== 'dine-in') {
      setSelectedTableId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      {/* Full-screen category folders OR items inside the selected folder */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {openFolder === null ? (
          <POSCategoryFolderGrid itemCount={itemCount} onOpenFolder={openTopFolder} />
        ) : openFolder === 'Pakistani' && pakistaniSub === null ? (
          <POSFolderContent title="Pakistani" onBack={handleFolderBack}>
            <POSPakistaniSubGrid itemCount={itemCount} onOpenSubfolder={setPakistaniSub} />
          </POSFolderContent>
        ) : (
          <POSFolderContent
            title={
              openFolder === 'Pakistani' && pakistaniSub
                ? `Pakistani › ${pakistaniSub}`
                : openFolder
            }
            onBack={handleFolderBack}
          >
            {folderItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No items in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {folderItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="pos-card text-left p-3 rounded-xl border border-border hover:border-primary/35 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    disabled={!item.available}
                  >
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    <p className="font-serif text-base font-bold text-primary mt-2">Rs. {item.price.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </POSFolderContent>
        )}
      </div>

      {/* Right: Cart */}
      <div className="lg:w-80 flex flex-col pos-card p-0 overflow-hidden relative">
        {/* Order type */}
        <div className="p-3 border-b border-border flex gap-1">
          {(['dine-in', 'takeaway', 'delivery'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleOrderTypeChange(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                orderType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dine-in table selection */}
        {orderType === 'dine-in' && (
          <div className="px-3 pb-3 border-b border-border flex items-center justify-between gap-2 pt-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Table</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedTable
                  ? `${selectedTable.name} · ${
                      floors.find(f => f.id === selectedTable.floorId)?.name ?? 'Floor'
                    } (${selectedTable.seats} seats)`
                  : 'No table selected'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTablePicker(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-border bg-card text-[11px] font-medium text-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors"
            >
              {selectedTable ? 'Change table' : 'Select table'}
            </button>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.map(c => (
            <div key={c.menuItem.id} className="bg-muted/50 rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.menuItem.name}</p>
                  <p className="text-xs text-muted-foreground">Rs. {c.menuItem.price.toLocaleString()}</p>
                  {c.notes && <p className="text-xs text-primary italic mt-0.5">📝 {c.notes}</p>}
                </div>
                <button onClick={() => { setNoteItem(c.menuItem.id); setNoteText(c.notes); }} className="text-muted-foreground hover:text-primary p-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(c.menuItem.id, -1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors">
                    {c.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{c.quantity}</span>
                  <button onClick={() => updateQty(c.menuItem.id, 1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground">Rs. {(c.menuItem.price * c.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Note modal */}
        {noteItem && (
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-4 w-full max-w-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Add Note</h3>
                <button onClick={() => setNoteItem(null)}><X className="w-4 h-4" /></button>
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="e.g., Less spicy, no onions..." className="w-full border border-border rounded-xl p-3 text-sm bg-background resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={saveNote} className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium">Save Note</button>
            </div>
          </div>
        )}

        {/* Table selection modal */}
        {showTablePicker && (
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-card rounded-2xl p-4 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold text-sm">Select table</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Choose an available table for this dine-in order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTablePicker(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Floor tabs */}
              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-thin pb-1">
                {floors.map(floor => {
                  const isActive = floor.id === activeFloorId;
                  return (
                    <button
                      key={floor.id}
                      type="button"
                      onClick={() => setActiveFloorId(floor.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      {floor.name}
                    </button>
                  );
                })}
              </div>

              {/* Tables grid */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tables
                    .filter(t => t.floorId === activeFloorId)
                    .map(table => {
                      const isSelected = table.id === selectedTableId;
                      const isAvailable = table.status === 'available';
                      return (
                        <button
                          key={table.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            if (!isAvailable) return;
                            setSelectedTableId(table.id);
                            setShowTablePicker(false);
                          }}
                          className={`pos-card text-left p-3 rounded-xl border text-xs transition-colors ${
                            !isAvailable
                              ? 'border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-primary/5'
                          }`}
                        >
                          <p className="font-semibold text-foreground text-sm">{table.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {table.seats} seats · {table.status === 'available' ? 'Available' : table.status}
                          </p>
                          {table.currentOrder && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Current order: {table.currentOrder}
                            </p>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>GST ({Math.round(PKR_GST_RATE * 100)}%)</span><span>Rs. {gstAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Further tax ({Math.round(PKR_FURTHER_TAX_RATE * 100)}%)</span><span>Rs. {furtherTaxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
            <span>Total taxes</span><span>Rs. {totalTaxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border/60">
            <span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {hasAction('hold_order') && (
            <button onClick={() => { if(cart.length) { toast.info('Order held'); } }} className="py-2.5 rounded-xl bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors flex items-center justify-center gap-1">
              <Pause className="w-3 h-3" /> Hold
            </button>
            )}
            {hasAction('print_bill') && (
            <button onClick={() => {
              if(cart.length) {
                const orderId = `ORD-${Date.now().toString().slice(-4)}`;
                printReceipt({
                  orderId,
                  orderType,
                  table: orderType === 'dine-in' && selectedTable ? selectedTable.id : undefined,
                  items: cart,
                  subtotal,
                  discount: 0,
                  discountPercent: 0,
                });
                toast.success('Bill printed');
              }
            }} className="py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </button>
            )}
            <button
              onClick={() => { if(cart.length) { toast.success('Order placed!'); setCart([]); } }}
              className={`py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-secondary transition-colors ${!hasAction('hold_order') && !hasAction('print_bill') ? 'col-span-3' : !hasAction('hold_order') || !hasAction('print_bill') ? 'col-span-2' : ''}`}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
