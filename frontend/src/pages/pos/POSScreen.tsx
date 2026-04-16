import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type CartItem, type MenuItem, type TableInfo } from '@/data/mockData';
import {
  PAKISTANI_SUBFOLDERS,
  categoryLabelToDataCategory,
  type PakistaniSubfolder,
} from '@/components/pos/Form';
import { X, MessageSquare, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { computePakistanTaxTotals } from '@/utils/pakistanTax';
import { useEffect } from 'react';
import { api, type PaginatedResponse } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/contexts/CartContext';
import { useDebounce } from '@/hooks/use-debounce';
import { COMMON_ADDONS } from '@/data/mockData';
import Fuse from 'fuse.js';
import { POSMenuArea } from './components/POSMenuArea';
import { POSCartArea } from './components/POSCartArea';

export default function POSScreen() {
  const { cart, setCart, showDiscardPopup, setShowDiscardPopup, pendingNavigation, setPendingNavigation } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [floors, setFloors] = useState<{ id: string; name: string }[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  /** `null` = full-screen category folders; otherwise open that folder’s items */
  const [openFolder, setOpenFolder] = useState<string | null>('All');
  /** Inside **Pakistani**: pick Karahi or Handi before showing items */
  const [pakistaniSub, setPakistaniSub] = useState<PakistaniSubfolder | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [currentOrderForEdit, setCurrentOrderForEdit] = useState<{ dbId: string; id: string } | null>(null);
  const [deliveryCustomerName, setDeliveryCustomerName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string>(() => {
    return localStorage.getItem('pos_active_floor_id') || 'ground';
  });

  useEffect(() => {
    localStorage.setItem('pos_active_floor_id', activeFloorId);
  }, [activeFloorId]);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [pendingOrderType, setPendingOrderType] = useState<'dine-in' | 'takeaway' | 'delivery' | null>(null);
  const [gstEnabled, setGstEnabled] = useState(() => {
    const saved = localStorage.getItem('pos_gst_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('pos_gst_enabled', gstEnabled.toString());
  }, [gstEnabled]);
  const [taxRates, setTaxRates] = useState({ gstRate: 0.16, serviceChargeRate: 0.05 });
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
  }, [floorsQuery.data, activeFloorId]);

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

  useEffect(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number }>('/settings/tax')
      .then((r) => {
        const gstRate = Number(r.salesTaxRate ?? 16) / 100;
        const serviceChargeRate = Number(r.serviceChargeRate ?? 5) / 100;
        setTaxRates({
          gstRate: Number.isFinite(gstRate) ? gstRate : 0.16,
          serviceChargeRate: Number.isFinite(serviceChargeRate) ? serviceChargeRate : 0.05,
        });
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

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
  const [categorySearch, setCategorySearch] = useState('');
  const [folderItemSearch, setFolderItemSearch] = useState('');
  const [pakistaniSubSearch, setPakistaniSubSearch] = useState('');

  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState<number | string>('');
  const [itemNotes, setItemNotes] = useState('');
  const [isCustomAddon, setIsCustomAddon] = useState(false);

  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedFolderItemSearch = useDebounce(folderItemSearch, 300);
  const debouncedPakistaniSubSearch = useDebounce(pakistaniSubSearch, 300);

  const selectedTable: TableInfo | null = useMemo(
    () => (selectedTableId != null ? tables.find(t => t.id === selectedTableId) ?? null : null),
    [selectedTableId, tables]
  );

  useEffect(() => {
    setCurrentOrderForEdit(null);
  }, [selectedTableId, orderType]);

  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(i => i.category))).sort((a, b) => a.localeCompare(b));
    const hasPakistani = uniqueCategories.includes('Karahi') || uniqueCategories.includes('Handi');
    const remaining = uniqueCategories.filter(c => c !== 'Karahi' && c !== 'Handi');
    return hasPakistani ? ['All', 'Pakistani', ...remaining] : ['All', ...remaining];
  }, [menuItems]);

  const filteredCategoryLabels = useMemo(() => {
    const q = debouncedCategorySearch.trim();
    if (!q) return categoryLabels;
    
    const fuse = new Fuse(categoryLabels, {
      threshold: 0.3,
      useExtendedSearch: true,
      ignoreLocation: true,
    });
    return fuse.search(q).map(r => r.item);
  }, [categoryLabels, debouncedCategorySearch]);

  const filteredPakistaniSubfolders = useMemo((): PakistaniSubfolder[] => {
    const q = debouncedPakistaniSubSearch.trim();
    if (!q) return [...PAKISTANI_SUBFOLDERS];
    
    const fuse = new Fuse(PAKISTANI_SUBFOLDERS as string[], {
      threshold: 0.3,
      useExtendedSearch: true,
      ignoreLocation: true,
    });
    return fuse.search(q).map(r => r.item as PakistaniSubfolder);
  }, [debouncedPakistaniSubSearch]);

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

  const displayFolderItems = useMemo(() => {
    const q = debouncedFolderItemSearch.trim();
    if (!q) return folderItems;

    const fuse = new Fuse(folderItems, {
      keys: ['name', 'description', 'category'],
      threshold: 0.3,
      useExtendedSearch: true,
      ignoreLocation: true,
    });
    return fuse.search(q).map(r => r.item);
  }, [folderItems, debouncedFolderItemSearch]);

  useEffect(() => {
    setFolderItemSearch('');
  }, [openFolder, pakistaniSub]);

  useEffect(() => {
    setPakistaniSubSearch('');
  }, [openFolder]);

  const posSearchInputClass =
    'w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

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

  const addToCart = (item: MenuItem, quantity: number = 1, notes: string = '', extraN: string = '', extraP: number = 0) => {
    setCart(prev => {
      // We only merge if notes and extras are the same
      const existing = prev.find(c => 
        c.menuItem.id === item.id && 
        c.notes === notes && 
        c.extraName === extraN && 
        c.extraPrice === extraP
      );
      if (existing) {
        return prev.map(c => 
          (c.menuItem.id === item.id && c.notes === notes && c.extraName === extraN && c.extraPrice === extraP) 
            ? { ...c, quantity: c.quantity + quantity } 
            : c
        );
      }
      return [...prev, { menuItem: item, quantity, notes, extraName: extraN, extraPrice: extraP }];
    });
  };

  const updateQty = (id: string, delta: number, notes: string = '', extraN: string = '', extraP: number = 0, absoluteQty?: number) => {
    setCart(prev =>
      prev
        .map(c =>
          (c.menuItem.id === id && c.notes === notes && c.extraName === extraN && c.extraPrice === extraP) 
            ? { ...c, quantity: absoluteQty !== undefined ? Math.max(0, absoluteQty) : Math.max(0, c.quantity + delta) } 
            : c
        )
        .filter(c => c.quantity > 0)
    );
  };

  const removeItem = (id: string, notes: string = '', extraN: string = '', extraP: number = 0) => {
    setCart(prev => prev.filter(c => 
      !(c.menuItem.id === id && c.notes === notes && c.extraName === extraN && c.extraPrice === extraP)
    ));
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

  const subtotal = cart.reduce((s, c) => s + (c.menuItem.price + (c.extraPrice || 0)) * c.quantity, 0);
  const discountAmt = 0;
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal, taxableAmount, serviceCharge } = computePakistanTaxTotals(
    subtotal,
    discountAmt,
    gstEnabled,
    taxRates,
    { applyServiceCharge: orderType === 'dine-in' }
  );

  const saveNote = () => {
    if (noteItem) {
      setCart(prev => prev.map(c => c.menuItem.id === noteItem ? { ...c, notes: noteText } : c));
      setNoteItem(null);
      setNoteText('');
    }
  };

  const loadActiveTableOrder = async () => {
    if (!selectedTable?.id) {
      toast.error('Select a table first');
      return;
    }

    try {
      const response = await api<{
        item: {
          dbId: string;
          id: string;
          status: string;
          type: 'dine-in';
          table?: number;
          items: Array<{ menuItem: MenuItem; quantity: number; notes?: string }>;
        } | null;
      }>(`/orders/open-by-table/${selectedTable.id}`);

      if (!response.item?.dbId) {
        toast.error('No active order found on this table');
        return;
      }
      if (['completed', 'cancelled'].includes(response.item.status)) {
        toast.error('Cannot edit this order');
        return;
      }

      setCart(
        (response.item.items || []).map(item => ({
          menuItem: item.menuItem,
          quantity: item.quantity || 1,
          notes: item.notes || '',
        }))
      );
      setCurrentOrderForEdit({ dbId: response.item.dbId, id: response.item.id });
      toast.success(`Loaded order ${response.item.id} for editing`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load order');
    }
  };

  const handleDiscardOrder = () => {
    if (pendingOrderType) {
      setOrderType(pendingOrderType);
      if (pendingOrderType !== 'dine-in') {
        setSelectedTableId(null);
      }
      setCart([]);
      setCurrentOrderForEdit(null);
    } else if (pendingNavigation) {
      // Handle navigation away from terminal
      setCart([]);
      setCurrentOrderForEdit(null);
      // Navigate to the pending route
      window.location.href = pendingNavigation;
      return;
    }
    setShowDiscardPopup(false);
    setPendingOrderType(null);
    setPendingNavigation(null);
  };

  const handleCancelDiscard = () => {
    setShowDiscardPopup(false);
    setPendingOrderType(null);
    setPendingNavigation(null);
  };

  const handleOrderTypeChange = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    // Allow switching order types without showing modal, just clear cart when switching
    setOrderType(type);
    if (type !== 'dine-in') {
      setSelectedTableId(null);
    }
    // Clear the current order being edited when switching order types
    if (type !== 'dine-in') {
      setCurrentOrderForEdit(null);
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length) {
      if (orderType === 'dine-in' && !selectedTable?.id) {
        toast.error('Table not selected', {
          style: {
            background: '#ef4444',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            minHeight: '80px'
          }
        });
        return;
      }
      if (orderType === 'delivery' && (!deliveryCustomerName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim())) {
        toast.error('Enter customer name, phone, and delivery address');
        return;
      }

      const createOrAppend = async () => {
        if (orderType === 'dine-in' && selectedTable?.id) {
          if (currentOrderForEdit?.dbId) {
            await api(`/orders/${currentOrderForEdit.dbId}/edit-items`, {
              method: 'PATCH',
              body: JSON.stringify({
                items: cart,
                subtotal,
                tax: totalTaxAmount,
                discount: 0,
                total: grandTotal,
                gstEnabled,
              }),
            });
            return 'updated';
          }

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
                gstEnabled,
              }),
            });
            return 'updated';
          }
        }

        await api('/orders', {
          method: 'POST',
          body: JSON.stringify({
            type: orderType,
            table: orderType === 'dine-in' && selectedTable ? selectedTable.id : undefined,
            status: 'pending',
            customerName: orderType === 'delivery' ? deliveryCustomerName.trim() : undefined,
            phone: orderType === 'delivery' ? deliveryPhone.trim() : undefined,
            deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
            subtotal,
            tax: totalTaxAmount,
            discount: 0,
            total: grandTotal,
            gstEnabled,
            items: cart,
          }),
        });
        return 'created';
      };

      createOrAppend()
        .then(mode => {
          toast.success(mode === 'updated' ? 'New items sent to kitchen' : 'Order placed to kitchen', {
            style: {
              background: '#22c55e',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              minHeight: '80px'
            }
          });
          setCart([]);
          setCurrentOrderForEdit(null);
          if (orderType === 'delivery') {
            setDeliveryCustomerName('');
            setDeliveryPhone('');
            setDeliveryAddress('');
          }
        })
        .catch(() => toast.error('Failed to save order'));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      <POSMenuArea
        openFolder={openFolder}
        pakistaniSub={pakistaniSub}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        folderItemSearch={folderItemSearch}
        setFolderItemSearch={setFolderItemSearch}
        pakistaniSubSearch={pakistaniSubSearch}
        setPakistaniSubSearch={setPakistaniSubSearch}
        filteredCategoryLabels={filteredCategoryLabels}
        itemCount={itemCount}
        openTopFolder={openTopFolder}
        handleFolderBack={handleFolderBack}
        filteredPakistaniSubfolders={filteredPakistaniSubfolders}
        setPakistaniSub={setPakistaniSub}
        displayFolderItems={displayFolderItems}
        addToCart={addToCart}
        posSearchInputClass={posSearchInputClass}
      />

      <POSCartArea
        orderType={orderType}
        handleOrderTypeChange={handleOrderTypeChange}
        selectedTable={selectedTable}
        floors={floors}
        setSelectedTableId={setSelectedTableId}
        tablesQuery={tablesQuery}
        setShowTablePicker={setShowTablePicker}
        deliveryCustomerName={deliveryCustomerName}
        setDeliveryCustomerName={setDeliveryCustomerName}
        deliveryPhone={deliveryPhone}
        setDeliveryPhone={setDeliveryPhone}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        cart={cart}
        removeItem={removeItem}
        updateQty={updateQty}
        setCustomizingItem={setCustomizingItem}
        setEditingCartItemIndex={setEditingCartItemIndex}
        setExtraName={setExtraName}
        setExtraPrice={setExtraPrice}
        setIsCustomAddon={setIsCustomAddon}
        setItemNotes={setItemNotes}
        subtotal={subtotal}
        taxableAmount={taxableAmount}
        serviceCharge={serviceCharge}
        totalTaxAmount={totalTaxAmount}
        grandTotal={grandTotal}
        gstEnabled={gstEnabled}
        setGstEnabled={setGstEnabled}
        taxRates={taxRates}
        loadActiveTableOrder={loadActiveTableOrder}
        currentOrderForEdit={currentOrderForEdit}
        setCurrentOrderForEdit={setCurrentOrderForEdit}
        onPlaceOrder={handlePlaceOrder}
        gstAmount={gstAmount}
      />

      {/* Note modal - reused logic if needed, or keeping for now */}
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

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border/50 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl font-bold text-foreground">{customizingItem.name}</h3>
                <p className="text-sm text-primary font-semibold mt-0.5">Base Price: Rs. {customizingItem.price.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setCustomizingItem(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Add-on selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Add-on Item</label>
                <div className="relative">
                  <select
                    value={isCustomAddon ? 'custom' : extraName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setIsCustomAddon(true);
                        setExtraName('');
                        setExtraPrice('');
                      } else {
                        setIsCustomAddon(false);
                        setExtraName(val);
                        setExtraPrice('');
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all cursor-pointer pr-10"
                  >
                    <option value="">None (Plain)</option>
                    {COMMON_ADDONS.map(addon => (
                      <option key={addon} value={addon}>{addon}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Conditional inputs for Add-ons */}
              {(isCustomAddon || extraName !== '') && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {isCustomAddon && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Extra Item Name</label>
                      <input
                        type="text"
                        value={extraName}
                        onChange={(e) => setExtraName(e.target.value)}
                        placeholder="e.g. Extra Cheese"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Extra Price (Rs.)</label>
                    <input
                      type="number"
                      value={extraPrice}
                      onChange={(e) => setExtraPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Order Notes</label>
                <textarea
                  rows={2}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Any special instructions?"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-3.5 rounded-2xl border border-border bg-card text-foreground text-sm font-bold hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingCartItemIndex !== null) {
                    setCart(prev => prev.map((item, i) => i === editingCartItemIndex ? {
                      ...item,
                      notes: itemNotes,
                      extraName: extraName,
                      extraPrice: Number(extraPrice) || 0
                    } : item));
                  } else {
                    addToCart(customizingItem, 1, itemNotes, extraName, Number(extraPrice) || 0);
                  }
                  setCustomizingItem(null);
                  setEditingCartItemIndex(null);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all border border-primary/20"
              >
                {editingCartItemIndex !== null ? 'Save Changes' : 'Add to Cart'} — Rs. {(customizingItem.price + (Number(extraPrice) || 0)).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Order Popup */}
      {showDiscardPopup && (
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">Order Not Placed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Do you want to discard the order to move to the new screen?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDiscard}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardOrder}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Discard Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
