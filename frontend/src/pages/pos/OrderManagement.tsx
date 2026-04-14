import { useEffect, useMemo, useState } from 'react';
import type { Order, TableInfo, MenuItem } from '@/data/mockData';
import { toast } from 'sonner';
import { Search, ShoppingCart, X, Plus, Minus, Trash2, Edit3, ChevronDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { api, type PaginatedResponse } from '@/lib/api';
import { formatOrderDateTime } from '@/utils/formatOrderDateTime';
import { billBreakdownForOrder } from '@/utils/pakistanTax';
import { useDebounce } from '@/hooks/use-debounce';
import Fuse from 'fuse.js';

type OrderWithDb = Order & { dbId?: string };

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  preparing: 'bg-primary/10 text-primary border-primary/20',
  ready: 'bg-success/10 text-success border-success/20',
  served: 'bg-secondary/10 text-secondary border-secondary/20',
  'taken away': 'bg-secondary/10 text-secondary border-secondary/20',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ hasNext: false, hasPrev: false });
  const [switchTableDialogOpen, setSwitchTableDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrderForSwitch, setSelectedOrderForSwitch] = useState<OrderWithDb | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderWithDb | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderWithDb | null>(null);
  const [editingItems, setEditingItems] = useState<Order['items']>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addItemMenuId, setAddItemMenuId] = useState<string | null>(null);
  const [addItemQty, setAddItemQty] = useState<number>(1);
  const [replaceItemIndex, setReplaceItemIndex] = useState<number | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [taxRates, setTaxRates] = useState({ gstRate: 0.16, serviceChargeRate: 0.05 });
  const [itemSearch, setItemSearch] = useState('');
  const debouncedMainSearch = useDebounce(search, 500);

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
      .catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: statusFilter,
        type: typeFilter,
      });
      if (search.trim()) params.set('search', search.trim());
      const response = await api<PaginatedResponse<Order & { dbId: string }>>(`/orders?${params.toString()}`);
      setOrders(response.items);
      setMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api<PaginatedResponse<{ number: number; name: string; seats: number; floorKey: string; status: TableInfo['status']; currentOrder?: string }>>('/tables?page=1&limit=500');
      setTables(response.items.map(table => ({
        id: table.number,
        name: table.name,
        seats: table.seats,
        floorId: table.floorKey,
        status: table.status,
        currentOrder: table.currentOrder,
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load tables');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api<PaginatedResponse<MenuItem & { id: string }>>('/menu?limit=500&page=1');
      setMenuItems(response.items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, typeFilter, debouncedMainSearch]);

  useEffect(() => {
    fetchTables();
    fetchMenuItems();
  }, []);

  const updateStatus = (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id) as (Order & { dbId?: string }) | undefined;
    if (!order?.dbId) return;
    api(`/orders/${order.dbId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(() => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        toast.success(`Order ${id} → ${status}`);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Update failed'));
  };

  const openCancelDialog = (order: OrderWithDb) => {
    if (order.status === 'completed') {
      toast.error('Cannot cancel a paid order');
      return;
    }
    if (order.status === 'served' || order.status === 'taken away') {
      toast.error('Cannot cancel a served order');
      return;
    }

    setSelectedOrderForCancel(order);
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedOrderForCancel(null);
  };

  const confirmCancelOrder = () => {
    if (!selectedOrderForCancel?.dbId) return;

    api(`/orders/${selectedOrderForCancel.dbId}/cancel`, { method: 'POST' })
      .then(() => {
        setOrders(prev => prev.map(o => o.id === selectedOrderForCancel.id ? { ...o, status: 'cancelled' } : o));
        toast.success(`Order ${selectedOrderForCancel.id} cancelled`);
        closeCancelDialog();
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Cancel failed'));
  };

  const openEditDialog = (order: OrderWithDb) => {
    if (!order.dbId) return;
    if (['completed', 'cancelled'].includes(order.status)) {
      toast.error('This order cannot be edited.');
      return;
    }

    setEditingOrder(order);
    setEditingItems(order.items.map(item => ({ ...item })));
    setAddItemMenuId(null);
    setAddItemQty(1);
    setReplaceItemIndex(null);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingOrder(null);
    setEditingItems([]);
    setAddItemMenuId(null);
    setAddItemQty(1);
    setReplaceItemIndex(null);
    setItemSearch('');
  };

  const updateEditingItemQuantity = (index: number, delta: number) => {
    setEditingItems(prev =>
      prev
        .map((item, i) => i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter(item => item.quantity > 0)
    );
  };

  const removeEditingItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!addItemMenuId || addItemQty <= 0) {
      toast.error('Select an item and quantity');
      return;
    }

    const menuItem = menuItems.find(m => m.id === addItemMenuId);
    if (!menuItem) return;

    const newItem: Order['items'][0] = {
      menuItem,
      quantity: addItemQty,
      notes: '',
      requestId: '',
      requestAt: new Date(),
    };

    if (replaceItemIndex !== null) {
      setEditingItems(prev => prev.map((item, i) => i === replaceItemIndex ? newItem : item));
      toast.success('Item replaced');
      setReplaceItemIndex(null);
    } else {
      setEditingItems(prev => [...prev, newItem]);
      toast.success('Item added');
    }

    setAddItemMenuId(null);
    setAddItemQty(1);
    setItemSearch('');
  };

  const saveEditedOrder = () => {
    if (!editingOrder?.dbId) return;
    if (editingItems.length === 0) {
      toast.error('Order must contain at least one item.');
      return;
    }

    api(`/orders/${editingOrder.dbId}/edit-items`, {
      method: 'PATCH',
      body: JSON.stringify({
        items: editingItems,
        tax: editingOrder.tax,
        discount: editingOrder.discount,
        total: editingOrder.total,
        gstEnabled: editingOrder.gstEnabled,
      }),
    })
      .then(() => {
        toast.success(`Order ${editingOrder.id} updated`);
        fetchOrders();
        closeEditDialog();
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Failed to update order'));
  };

  const openSwitchTableDialog = (order: OrderWithDb) => {
    if (order.type !== 'dine-in') {
      toast.error('Only dine-in orders can change tables');
      return;
    }

    setSelectedOrderForSwitch(order);
    setTableNumberInput(order.table ? String(order.table) : '');
    setSwitchTableDialogOpen(true);
  };

  const closeSwitchTableDialog = () => {
    setSwitchTableDialogOpen(false);
    setSelectedOrderForSwitch(null);
    setTableNumberInput('');
  };

  const confirmSwitchTable = () => {
    if (!selectedOrderForSwitch?.dbId) return;

    const tableNumber = Number(tableNumberInput);
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      toast.error('Select a valid table');
      return;
    }

    api(`/orders/${selectedOrderForSwitch.dbId}/table`, {
      method: 'PATCH',
      body: JSON.stringify({ table: tableNumber }),
    })
      .then(() => {
        const tableName = tableMap.get(tableNumber)?.name || String(tableNumber);
        toast.success(`Order moved to ${tableName}`);
        fetchOrders();
        closeSwitchTableDialog();
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Failed to switch table'));
  };

  const tableMap = useMemo(() => {
    return new Map<number, TableInfo>(tables.map(table => [table.id, table]));
  }, [tables]);

  const debouncedSearch = useDebounce(itemSearch, 300);

  const filteredMenuItems = useMemo(() => {
    const q = debouncedSearch.trim();
    if (!q) return [];
    
    const fuse = new Fuse(menuItems, {
      keys: ['name', 'category', 'description'],
      threshold: 0.3,
      useExtendedSearch: true,
      ignoreLocation: true,
    });

    return fuse.search(q).map(result => result.item);
  }, [menuItems, debouncedSearch]);

  const editingSubtotal = editingItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const nextStatus = (s: Order['status'], type?: Order['type']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: type === 'takeaway' ? 'taken away' : 'served',
    };
    return flow[s] || null;
  };

  const activeOrders = orders.filter(o => o.type !== 'delivery');
  const dineInCount = activeOrders.filter(o => o.type === 'dine-in').length;
  const takeawayCount = activeOrders.filter(o => o.type === 'takeaway').length;

  const grandTotalOnCard = (order: Order) => {
    if (order.status === 'completed' && Number.isFinite(Number(order.total))) return Number(order.total);
    return billBreakdownForOrder(order, taxRates).grandTotal;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Order Management</h1>
        <p className="text-sm text-muted-foreground">Track and manage all dine-in and takeout orders.</p>
      </div>

      {/* Order type summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Dine-in', count: dineInCount, color: 'text-primary' },
          { label: 'Takeout', count: takeawayCount, color: 'text-success' },
        ].map(t => (
          <div key={t.label} className="pos-card flex items-center gap-4 cursor-pointer hover:border-primary/30" onClick={() => setTypeFilter(t.label.toLowerCase().replace('takeout', 'takeaway'))}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className={`w-5 h-5 ${t.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="font-serif text-xl font-bold text-foreground">{t.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Status:</span>
          {['all', 'pending', 'preparing', 'ready', 'served', 'taken away', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {s} {s !== 'all' && `(${activeOrders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Type:</span>
          {[
            { label: 'all', value: 'all' },
            { label: 'dine-in', value: 'dine-in' },
            { label: 'takeout', value: 'takeaway' },
          ].map(t => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${typeFilter === t.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order number..."
            className="w-full pl-10 pr-3 py-2 bg-card border border-border rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOrders.map(order => (
          <div key={order.id} className="pos-card space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-lg text-foreground">{order.id}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-sm text-muted-foreground capitalize font-medium">
                    {order.type}
                  </p>
                  {order.table && (
                    <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-full text-sm font-bold">
                      {tableMap.get(order.table)?.name || `Table ${order.table}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatOrderDateTime(order.createdAt)}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-base">
                  <span className="text-foreground font-semibold">{item.quantity}× {item.menuItem.name}</span>
                  <span className="text-muted-foreground font-semibold">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">Order taker: {order.orderTaker || 'Unknown'}</div>

            {order.notes && <p className="text-xs text-primary italic">📝 {order.notes}</p>}

            <div className="flex justify-between items-center pt-2 border-t border-border gap-2">
              <div>
                <p className="text-xs text-foreground font-bold uppercase tracking-[0.2em]">Total Bill</p>
                <p className="font-serif text-xl font-bold text-foreground">Rs. {grandTotalOnCard(order).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 flex-wrap items-center">
                {order.type === 'dine-in' && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && order.status !== 'taken away' && (
                  <button
                    onClick={() => openSwitchTableDialog(order as OrderWithDb)}
                    className="bg-secondary/10 text-secondary px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/20 transition-colors whitespace-nowrap"
                  >
                    Switch table
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => openEditDialog(order as OrderWithDb)}
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                )}
                {nextStatus(order.status, order.type) && (
                  <button
                    onClick={() => updateStatus(order.id, nextStatus(order.status, order.type)!)}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary transition-colors capitalize whitespace-nowrap"
                  >
                    → {nextStatus(order.status, order.type)}
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && order.status !== 'taken away' && (
                  <button
                    onClick={() => openCancelDialog(order as OrderWithDb)}
                    className="bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-xs font-medium hover:bg-destructive/15 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={switchTableDialogOpen} onOpenChange={value => { if (!value) closeSwitchTableDialog(); setSwitchTableDialogOpen(value); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch table</AlertDialogTitle>
            <AlertDialogDescription>
              Move order {selectedOrderForSwitch?.id} from {selectedOrderForSwitch?.table ? tableMap.get(selectedOrderForSwitch.table)?.name || `Table ${selectedOrderForSwitch.table}` : 'No table selected'} to another table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="table-number-input">
              New table
            </label>
            <select
              id="table-number-input"
              value={tableNumberInput}
              onChange={event => setTableNumberInput(event.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select table</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeSwitchTableDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitchTable}>Move</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={value => { if (!value) closeCancelDialog(); setCancelDialogOpen(value); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order {selectedOrderForCancel?.id}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeCancelDialog}>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={editDialogOpen} onOpenChange={value => { if (!value) closeEditDialog(); setEditDialogOpen(value); }}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit order</AlertDialogTitle>
            <AlertDialogDescription>
              Adjust quantities, remove items, or add/replace items in {editingOrder?.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {/* Current items */}
            {editingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">This order has no items.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Current items:</p>
                <div className="space-y-2">
                  {editingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">Rs. {item.menuItem.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateEditingItemQuantity(index, -1)}
                          className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-muted"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateEditingItemQuantity(index, 1)}
                          className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-muted"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceItemIndex(index);
                            setAddItemMenuId(null);
                            setAddItemQty(1);
                          }}
                          className="rounded-lg border border-secondary/30 bg-secondary/10 px-2 py-1 text-secondary text-xs font-medium hover:bg-secondary/20 ml-1"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEditingItem(index)}
                          className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Replace item section */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {replaceItemIndex !== null ? 'Replace item' : 'Add new item'}
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search item to add..."
                    className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                {itemSearch.trim() !== '' && (
                  <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                      {filteredMenuItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          {debouncedSearch === itemSearch ? 'No items found.' : 'Searching...'}
                        </p>
                      ) : (
                        filteredMenuItems.map(item => {
                          const isSelected = addItemMenuId === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAddItemMenuId(item.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-card text-foreground border-transparent hover:bg-muted hover:border-border/60'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{item.name}</p>
                                  <p className={`text-[10px] uppercase tracking-wider ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {item.category}
                                  </p>
                                </div>
                                <span className={`text-xs font-bold shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>
                                  Rs. {item.price.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={addItemQty}
                    onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value)))}
                    placeholder="Qty"
                    className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex-1 rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> {replaceItemIndex !== null ? 'Replace' : 'Add'}
                  </button>
                  {replaceItemIndex !== null && (
                    <button
                      type="button"
                      onClick={() => setReplaceItemIndex(null)}
                      className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">Rs. {editingSubtotal.toLocaleString()}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeEditDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveEditedOrder}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-end gap-2">
        <button disabled={!meta.hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
          Previous
        </button>
        <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}
