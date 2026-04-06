import { useMemo, useState, useCallback } from 'react';
import { type CartItem, type MenuItem, type TableInfo } from '@/data/mockData';
import {
  POSCategoryFolderGrid,
  POSFolderContent,
  POSPakistaniSubGrid,
  categoryLabelToDataCategory,
  type PakistaniSubfolder,
} from '@/components/pos/Form';
import { Plus, Minus, Trash2, ShoppingBag, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { computePakistanTaxTotals, PKR_GST_RATE } from '@/utils/pakistanTax';
import { useEffect } from 'react';
import { api, type PaginatedResponse } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

export default function POSScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [floors, setFloors] = useState<{ id: string; name: string }[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  /** `null` = full-screen category folders; otherwise open that folder’s items */
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  /** Inside **Pakistani**: pick Karahi or Handi before showing items */
  const [pakistaniSub, setPakistaniSub] = useState<PakistaniSubfolder | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string>('ground');
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [gstEnabled, setGstEnabled] = useState(true);
  const menuQuery = useQuery({
    queryKey: ['pos-menu-items'],
    queryFn: () => api<PaginatedResponse<MenuItem & { id: string }>>('/menu?limit=500&page=1'),
  });
  const floorsQuery = useQuery({
    queryKey: ['pos-floors'],
    queryFn: () => api<PaginatedResponse<{ key: string; name: string }>>('/floors?page=1&limit=200'),
  });
  const tablesQuery = useQuery({
    queryKey: ['pos-tables'],
    queryFn: () =>
      api<PaginatedResponse<{ number: number; name: string; seats: number; floorKey: string; status: TableInfo['status']; currentOrder?: string }>>(
        '/tables?page=1&limit=500'
      ),
  });

  useEffect(() => {
    if (menuQuery.data?.items) setMenuItems(menuQuery.data.items);
  }, [menuQuery.data]);

  useEffect(() => {
    if (floorsQuery.data?.items) {
      const fs = floorsQuery.data.items.map(x => ({ id: x.key, name: x.name }));
      setFloors(fs);
      if (fs.length && !fs.some(f => f.id === activeFloorId)) setActiveFloorId(fs[0].id);
    }
  }, [floorsQuery.data]);

  useEffect(() => {
    if (tablesQuery.data?.items) {
      setTables(
        tablesQuery.data.items.map(x => ({
          id: x.number,
          name: x.name,
          seats: x.seats,
          floorId: x.floorKey,
          status: x.status,
          currentOrder: x.currentOrder,
        }))
      );
    }
  }, [tablesQuery.data]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tableParam = searchParams.get('table');
    const tableId = tableParam ? Number(tableParam) : null;
    if (tableId && tables.some(t => t.id === tableId)) {
      setSelectedTableId(tableId);
      setOrderType('dine-in');
    }
  }, [searchParams, tables]);

  const [noteItem, setNoteItem] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const selectedTable: TableInfo | null = useMemo(
    () => (selectedTableId != null ? tables.find(t => t.id === selectedTableId) ?? null : null),
    [selectedTableId, tables]
  );

  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(i => i.category))).sort((a, b) => a.localeCompare(b));
    const hasPakistani = uniqueCategories.includes('Karahi') || uniqueCategories.includes('Handi');
    const remaining = uniqueCategories.filter(c => c !== 'Karahi' && c !== 'Handi');
    return hasPakistani ? ['All', 'Pakistani', ...remaining] : ['All', ...remaining];
  }, [menuItems]);

  const itemCount = useCallback((label: string) => {
    if (label === 'All') return menuItems.length;
    if (label === 'Pakistani') {
      return menuItems.filter(i => i.category === 'Karahi' || i.category === 'Handi').length;
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(label)).length;
  }, [menuItems]);

  const folderItems = useMemo(() => {
    if (!openFolder) return [];
    if (openFolder === 'All') return menuItems;
    if (openFolder === 'Pakistani') {
      if (!pakistaniSub) return [];
      return menuItems.filter(i => i.category === pakistaniSub);
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(openFolder));
  }, [openFolder, pakistaniSub, menuItems]);

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
    setCart(prev =>
      prev
        .map(c =>
          c.menuItem.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
        )
        .filter(c => c.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== id));
  };

  const addCustomItem = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    const quantity = Number(customItemQty);

    if (!name) {
      toast.error('Enter item name');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }

    const customId = `custom:${name.toLowerCase()}:${price}`;
    const customMenuItem: MenuItem = {
      id: customId,
      name,
      price,
      category: 'Custom',
      image: '',
      description: 'Waiter added custom item',
      available: true,
      perishable: false,
    };

    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === customId);
      if (existing) {
        return prev.map(c => (c.menuItem.id === customId ? { ...c, quantity: c.quantity + quantity } : c));
      }
      return [...prev, { menuItem: customMenuItem, quantity, notes: '' }];
    });

    setShowCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    toast.success('Custom item added');
  };

  const subtotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const discountAmt = 0;
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal } = computePakistanTaxTotals(subtotal, discountAmt, gstEnabled);

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
          <POSCategoryFolderGrid categories={categoryLabels} itemCount={itemCount} onOpenFolder={openTopFolder} />
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
        {/* <div className="px-3 py-2 border-b border-border">
          <button
            type="button"
            onClick={() => setShowCustomItemModal(true)}
            className="w-full py-2 rounded-lg text-xs font-medium border border-dashed border-primary/60 text-primary hover:bg-primary/5 transition-colors"
          >
            + Add custom item
          </button>
        </div> */}

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
            <div className="flex items-center gap-2 shrink-0">
              {selectedTable && (
                <button
                  type="button"
                  onClick={() => setSelectedTableId(null)}
                  className="text-[11px] text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  tablesQuery.refetch();
                  setShowTablePicker(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-[11px] font-medium text-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors"
              >
                {selectedTable ? 'Change table' : 'Select table'}
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.map(c => (
            <div
              key={c.menuItem.id}
              className="rounded-2xl border border-border bg-muted/60 px-3 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.menuItem.name}</p>
                  <p className="text-[11px] text-muted-foreground">Rs. {c.menuItem.price.toLocaleString()}</p>
                  {c.notes && (
                    <p className="text-[11px] text-primary mt-0.5 line-clamp-2">
                      <span className="font-semibold">Note:</span> {c.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => removeItem(c.menuItem.id)}
                    className="text-muted-foreground hover:text-destructive/90 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                    aria-label="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setNoteItem(c.menuItem.id);
                      setNoteText(c.notes);
                    }}
                    className="text-muted-foreground hover:text-primary p-1 rounded-full hover:bg-primary/5 transition-colors"
                    aria-label="Add note"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateQty(c.menuItem.id, -1)}
                    className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  >
                    {c.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="text-sm font-semibold min-w-[1.75rem] text-center">{c.quantity}</span>
                  <button
                    onClick={() => updateQty(c.menuItem.id, 1)}
                    className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Rs. {(c.menuItem.price * c.quantity).toLocaleString()}
                </span>
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

        {/* Custom item modal */}
        {showCustomItemModal && (
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-4 w-full max-w-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Add custom item</h3>
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
                placeholder="Item name"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customItemQty}
                  onChange={e => setCustomItemQty(e.target.value)}
                  placeholder="Qty"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customItemPrice}
                  onChange={e => setCustomItemPrice(e.target.value)}
                  placeholder="Price (Rs.)"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={addCustomItem}
                className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium"
              >
                Add to bill
              </button>
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
                      const isOccupied = table.status === 'occupied';
                      const isSelectable = isAvailable || isOccupied;
                      return (
                        <button
                          key={table.id}
                          type="button"
                          disabled={!isSelectable}
                          onClick={() => {
                            if (!isSelectable) return;
                            setSelectedTableId(table.id);
                            setShowTablePicker(false);
                          }}
                          className={`pos-card text-left p-3 rounded-xl border text-xs transition-colors ${
                            !isSelectable
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
                          {isOccupied && (
                            <p className="text-[10px] text-warning mt-0.5">
                              Tap to add-on items
                            </p>
                          )}
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
            <span>GST ({gstEnabled ? Math.round(PKR_GST_RATE * 100) : 0}%)</span><span>Rs. {gstAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
            <span>Total taxes</span><span>Rs. {totalTaxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/60">
            <span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
          </div>

          {/* GST Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="gst-checkbox"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
            />
            <label htmlFor="gst-checkbox" className="text-xs text-muted-foreground cursor-pointer">
              Include GST ({Math.round(PKR_GST_RATE * 100)}%)
            </label>
          </div>

          <div className="pt-2">
            {/* Hold button hidden for waiter-only flow */}
            {/* {hasAction('hold_order') && (
              <button onClick={() => { if (cart.length) { toast.info('Order held'); } }} className="py-2.5 rounded-xl bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors flex items-center justify-center gap-1">
                <Pause className="w-3 h-3" /> Hold
              </button>
            )} */}
            {/* Print button hidden for waiter-only flow */}
            {/* {hasAction('print_bill') && (
              <button onClick={() => {
                if (cart.length) {
                  const orderId = `ORD-${Date.now().toString().slice(-4)}`;
                  printReceipt({
                    orderId,
                    orderType,
                    table: orderType === 'dine-in' && selectedTable ? selectedTable.id : undefined,
                    items: cart,
                    subtotal,
                    discount: 0,
                    discountPercent: 0,
                    paymentMethod,
                  });
                  toast.success('Bill printed');
                }
              }} className="py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1">
                <Printer className="w-3 h-3" /> Print
              </button>
            )} */}
            <button
              onClick={() => {
                if (cart.length) {
                  if (orderType === 'dine-in' && !selectedTable?.id) {
                    toast.error('Select a table first');
                    return;
                  }

                  const createOrAppend = async () => {
                    if (orderType === 'dine-in' && selectedTable?.id) {
                      const existing = await api<{ item: { dbId: string } | null }>(
                        `/orders/open-by-table/${selectedTable.id}`
                      );
                      if (existing.item?.dbId) {
                        await api(`/orders/${existing.item.dbId}/add-items`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            items: cart,
                            subtotal,
                            tax: totalTaxAmount,
                            discount: 0,
                            total: grandTotal,
                          }),
                        });
                        return 'updated';
                      }
                    }

                    await api('/orders', {
                      method: 'POST',
                      body: JSON.stringify({
                        type: orderType,
                        table: selectedTable?.id,
                        status: 'pending',
                        subtotal,
                        tax: totalTaxAmount,
                        discount: 0,
                        total: grandTotal,
                        items: cart,
                      }),
                    });
                    return 'created';
                  };

                  createOrAppend()
                    .then(mode => {
                      toast.success(mode === 'updated' ? 'New items sent to kitchen' : 'Order placed to kitchen');
                      setCart([]);
                    })
                    .catch(() => toast.error('Failed to save order'));
                }
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-secondary transition-colors"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
