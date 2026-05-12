import { useState, useCallback, useEffect } from 'react';
import { Plus, ArrowRightLeft, Truck, Package, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { type InventoryItem, type Supplier, type StockTransfer, type InventoryLog } from '@/data/inventory/inventoryData';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api/api';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import { useSubmitLock } from '@/hooks/pos/use-submit-lock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TabsNavigation } from './components/TabsNavigation';
import { StockTab } from './components/StockTab';
import { AlertsTab } from './components/AlertsTab';
import { SuppliersTab } from './components/SuppliersTab';
import { TransfersTab } from './components/TransfersTab';
import { LogsTab } from './components/LogsTab';
import { AddItemModal } from './modals/AddItemModal';
import { RestockModal } from './modals/RestockModal';
import { AdjustmentModal } from './modals/AdjustmentModal';
import { TransferModal } from './modals/TransferModal';
import { SupplierFormModal } from './modals/SupplierFormModal';

type Tab = 'stock' | 'transfers' | 'alerts' | 'logs' | 'suppliers';

export default function InventoryManagement() {
  const queryClient = useQueryClient();
  const { isLocked, runLocked } = useSubmitLock();

  // Tab state
  const [tab, setTab] = useState<Tab>('stock');

  // Filter state
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [transferCatFilter, setTransferCatFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Pagination state
  const [stockPage, setStockPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);
  const [supplierPage, setSupplierPage] = useState(1);

  // Modal visibility
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  // Form data states
  const [newItem, setNewItem] = useState({
    name: '', category: 'Meat', quantity: '', unit: 'kg',
    minStock: '', costPerUnit: '', perishable: false, expiryDate: '', supplier: '',
  });
  const [restockData, setRestockData] = useState({ quantity: '', costPerUnit: '', supplier: '', note: '' });
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustAction, setAdjustAction] = useState<'use' | 'waste'>('use');
  const [adjustNote, setAdjustNote] = useState('');
  const [supplierData, setSupplierData] = useState({ name: '', phone: '', email: '', address: '', items: [] as string[] });
  const [newTransfer, setNewTransfer] = useState({
    fromLocation: '', toLocation: '', transferCategory: 'General', note: '',
    items: [{ itemId: '', quantity: '', name: '', unit: '' }],
  });

  // Queries
  const stockQuery = useQuery({
    queryKey: ['inventory-stock', stockPage, search, catFilter, perishableOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(stockPage),
        limit: '50',
        search,
        category: catFilter,
        perishableOnly: String(perishableOnly),
      });
      return api<PaginatedResponse<InventoryItem>>(`/inventory/items?${params.toString()}`);
    },
    enabled: tab === 'stock',
  });

  const alertsQuery = useQuery({
    queryKey: ['inventory-alerts', alertsPage],
    queryFn: async () => api<PaginatedResponse<InventoryItem>>(`/inventory/items/alerts?page=${alertsPage}&limit=30`),
    enabled: tab === 'alerts',
  });

  const statsQuery = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const [alerts, all, transfers, suppliers] = await Promise.all([
        api<PaginatedResponse<InventoryItem>>('/inventory/items/alerts?page=1&limit=1'),
        api<PaginatedResponse<InventoryItem>>('/inventory/items?page=1&limit=1'),
        api<PaginatedResponse<StockTransfer>>('/inventory/transfers?page=1&limit=1'),
        api<PaginatedResponse<Supplier>>('/inventory/suppliers?page=1&limit=1'),
      ]);
      return {
        totalItems: all.pagination.total,
        lowStockCount: alerts.pagination.total,
        totalTransfers: transfers.pagination.total,
        totalSuppliers: suppliers.pagination.total,
      };
    },
  });

  const suppliersQuery = useQuery({
    queryKey: ['inventory-suppliers', supplierPage, supplierSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(supplierPage), limit: '30', search: supplierSearch });
      return api<PaginatedResponse<Supplier>>(`/inventory/suppliers?${params.toString()}`);
    },
    enabled: tab === 'suppliers' || showAddForm || !!restockItem,
  });

  const logsQuery = useQuery({
    queryKey: ['inventory-logs', logsPage, logSearch, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        page: String(logsPage), 
        limit: '30', 
        search: logSearch,
        from: startDate,
        to: endDate
      });
      return api<PaginatedResponse<InventoryLog>>(`/inventory/logs?${params.toString()}`);
    },
    enabled: tab === 'logs',
  });

  const transfersQuery = useQuery({
    queryKey: ['inventory-transfers', transferPage, startDate, endDate, transferSearch, transferCatFilter, locationFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        page: String(transferPage), 
        limit: '30',
        from: startDate,
        to: endDate,
        search: transferSearch,
        transferCategory: transferCatFilter,
        toLocation: locationFilter,
      });
      return api<PaginatedResponse<StockTransfer>>(`/inventory/transfers?${params.toString()}`);
    },
    enabled: tab === 'transfers',
  });

  const locationsQuery = useQuery({
    queryKey: ['inventory-locations'],
    queryFn: async () => api<{ locations: string[] }>('/inventory/locations'),
  });

  const transferCategoriesQuery = useQuery({
    queryKey: ['inventory-transfer-categories'],
    queryFn: async () => api<{ categories: string[] }>('/inventory/transfers/categories'),
  });

  const allInventoryQuery = useQuery({
    queryKey: ['inventory-all'],
    queryFn: async () => api<PaginatedResponse<InventoryItem>>('/inventory/items?page=1&limit=500'),
    enabled: showTransferForm,
    staleTime: 30_000,
  });

  const inventory = stockQuery.data?.items ?? [];
  const alertItems = alertsQuery.data?.items ?? [];
  const allInventory = allInventoryQuery.data?.items ?? inventory;
  const suppliers = suppliersQuery.data?.items ?? [];
  const transfers = transfersQuery.data?.items ?? [];
  const logs = logsQuery.data?.items ?? [];
  const locations = locationsQuery.data?.locations ?? [];
  const transferCategories = transferCategoriesQuery.data?.categories ?? ['General'];

  // Derived values
  const totalItems = statsQuery.data?.totalItems ?? 0;
  const lowStockCount = statsQuery.data?.lowStockCount ?? 0;
  const totalTransfers = statsQuery.data?.totalTransfers ?? 0;
  const totalSuppliers = statsQuery.data?.totalSuppliers ?? 0;

  const refreshInventoryViews = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-all'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-logs'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-suppliers'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-locations'] });
  }, [queryClient]);

  usePosRealtimeScopes(['inventory', 'dashboard'], refreshInventoryViews);

  // Handlers for CRUD operations
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity) return;
    try {
      const itemData = {
        ...newItem,
        quantity: parseFloat(newItem.quantity),
        minStock: parseFloat(newItem.minStock) || 5,
        costPerUnit: parseFloat(newItem.costPerUnit) || 0,
        supplier: newItem.supplier || null,
      };
      if (editingItem?.id || editingItem?._id) {
        await api(`/inventory/items/${editingItem.id || editingItem._id}`, { method: 'PUT', body: JSON.stringify(itemData) });
        toast.success('Item updated');
      } else {
        await api('/inventory/items', { method: 'POST', body: JSON.stringify(itemData) });
        toast.success('Item added to inventory');
      }
      setShowAddForm(false); setEditingItem(null);
      resetNewItemForm();
      refreshInventoryViews();
    } catch { toast.error('Failed to add item'); }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const itemId = item.id || item._id;
    if (!itemId) { toast.error('Item id missing'); return; }
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    try {
      await api(`/inventory/items/${itemId}`, { method: 'DELETE' });
      toast.success('Item deleted');
      refreshInventoryViews();
    } catch { toast.error('Failed to delete item'); }
  };

  const handleRestockSubmit = async () => {
    if (!restockItem || !restockData.quantity) return;
    const qty = parseFloat(restockData.quantity);
    const cost = parseFloat(restockData.costPerUnit) || 0;
    if (isNaN(qty) || qty <= 0) return;
    try {
      await api(`/inventory/items/${restockItem.id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ quantity: qty, costPerUnit: cost, supplier: restockData.supplier || null, note: restockData.note }),
      });
      toast.success(`Restocked ${qty} ${restockItem.unit} of ${restockItem.name}`);
      setRestockItem(null);
      setRestockData({ quantity: '', costPerUnit: '', supplier: '', note: '' });
      refreshInventoryViews();
    } catch { toast.error('Failed to restock'); }
  };

  const handleAdjust = async () => {
    if (!adjustItem || !adjustQty) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return;
    try {
      await api(`/inventory/items/${adjustItem.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ action: adjustAction, quantity: qty, note: adjustNote || `${adjustAction === 'use' ? 'Used' : 'Wasted'} ${qty} ${adjustItem.unit}` }),
      });
      toast.success(`${adjustAction === 'use' ? 'Used' : 'Wasted'} ${qty} ${adjustItem.unit} of ${adjustItem.name}`);
      setAdjustItem(null); setAdjustQty(''); setAdjustNote('');
      refreshInventoryViews();
    } catch { toast.error('Failed to adjust stock'); }
  };

  const handleSupplierSubmit = async () => {
    if (!supplierData.name || !supplierData.phone) { toast.error('Name and phone are required'); return; }
    try {
      if (editingSupplier) {
        await api(`/inventory/suppliers/${editingSupplier.id}`, { method: 'PUT', body: JSON.stringify(supplierData) });
        toast.success('Supplier updated');
      } else {
        await api('/inventory/suppliers', { method: 'POST', body: JSON.stringify(supplierData) });
        toast.success('Supplier added');
      }
      setShowSupplierForm(false); setEditingSupplier(null);
      setSupplierData({ name: '', phone: '', email: '', address: '', items: [] });
      refreshInventoryViews();
    } catch { toast.error('Operation failed'); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api(`/inventory/suppliers/${id}`, { method: 'DELETE' });
      toast.success('Supplier removed');
      refreshInventoryViews();
    } catch { toast.error('Failed to delete supplier'); }
  };

  const handleCreateTransfer = async () => {
    // Filter out empty items
    const validItems = newTransfer.items.filter(i => i.itemId && i.quantity && parseFloat(i.quantity) > 0);

    if (!newTransfer.fromLocation || !newTransfer.toLocation || validItems.length === 0) {
      toast.error('Please add at least one valid item with quantity');
      return;
    }

    try {
      await api('/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromLocation: newTransfer.fromLocation,
          toLocation: newTransfer.toLocation,
          transferCategory: newTransfer.transferCategory,
          note: newTransfer.note,
          items: validItems.map(i => ({ itemId: i.itemId, quantity: parseFloat(i.quantity) })),
        }),
      });
      toast.success('Transfer complete');
      setShowTransferForm(false);
      resetTransferForm();
      refreshInventoryViews();
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    }
  };

  // Helper functions
  const resetNewItemForm = () => {
    setNewItem({ name: '', category: 'Meat', quantity: '', unit: 'kg', minStock: '', costPerUnit: '', perishable: false, expiryDate: '', supplier: '' });
  };

  const resetTransferForm = () => {
    setNewTransfer({ fromLocation: locations[0], toLocation: locations[1] || locations[0], transferCategory: 'General', note: '', items: [{ itemId: '', quantity: '', name: '', unit: '' }] });
  };

  const openAddItemForm = () => {
    setEditingItem(null);
    resetNewItemForm();
    setShowAddForm(true);
  };

  const openEditItemForm = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name || '', category: item.category || 'Meat',
      quantity: String(item.quantity ?? ''), unit: item.unit || 'kg',
      minStock: String(item.minStock ?? ''), costPerUnit: String(item.costPerUnit ?? ''),
      perishable: Boolean(item.perishable),
      expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : '',
      supplier: typeof item.supplier === 'object' ? ((item.supplier as any)?._id || '') : (item.supplier || ''),
    });
    setShowAddForm(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierData({ name: s.name, phone: s.phone, email: s.email, address: s.address, items: s.items || [] });
    setShowSupplierForm(true);
  };

  const addTransferItem = () => {
    setNewTransfer(p => ({ ...p, items: [...p.items, { itemId: '', quantity: '', name: '', unit: '' }] }));
  };

  const removeTransferItem = (index: number) => {
    if (newTransfer.items.length <= 1) return;
    setNewTransfer(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const updateTransferItem = (index: number, itemId: string, quantity?: string) => {
    const item = allInventory.find(i => (i.id === itemId || i._id === itemId));
    if (!item) return;
    setNewTransfer(p => {
      const newItems = [...p.items];
      newItems[index] = {
        itemId: item.id || item._id || '',
        name: item.name,
        unit: item.unit,
        quantity: quantity || newItems[index].quantity || ''
      };
      return { ...p, items: newItems };
    });
  };

  // Set initial transfer locations
  useEffect(() => {
    if (locations.length > 0 && !newTransfer.fromLocation) {
      setNewTransfer(prev => ({ ...prev, fromLocation: locations[0], toLocation: locations[1] || locations[0] }));
    }
  }, [locations]);

  const tabs = [
    { key: 'stock' as Tab, label: 'Stock', icon: Package, count: totalItems },
    { key: 'transfers' as Tab, label: 'Transfers', icon: ArrowRightLeft, count: totalTransfers },
    { key: 'alerts' as Tab, label: 'Alerts', icon: AlertTriangle, count: lowStockCount },
    { key: 'logs' as Tab, label: 'History', icon: Clock },
    { key: 'suppliers' as Tab, label: 'Suppliers', icon: Truck, count: totalSuppliers },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-xl font-bold text-foreground">Inventory Management</h1>
        <div className="flex gap-2">
          {tab === 'suppliers' ? (
            <button onClick={() => { setEditingSupplier(null); setSupplierData({ name: '', phone: '', email: '', address: '', items: [] }); setShowSupplierForm(true); }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          ) : (
            <>
              {(tab === 'transfers' || tab === 'logs') && (
                <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-2 rounded-xl mr-2 shadow-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:outline-none text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px] font-black uppercase">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:outline-none text-foreground"
                  />
                </div>
              )}
              <button onClick={() => setShowTransferForm(true)}
                className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/80 transition-colors shadow-sm">
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
              <button onClick={openAddItemForm}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <TabsNavigation tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {/* Tab Content */}
      {tab === 'stock' && (
        <StockTab
          inventory={inventory}
          stockMeta={stockQuery.data?.pagination ?? { hasNext: false, hasPrev: false }}
          stockPage={stockPage}
          setStockPage={setStockPage}
          search={search}
          setSearch={setSearch}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          perishableOnly={perishableOnly}
          setPerishableOnly={setPerishableOnly}
          isLocked={isLocked}
          runLocked={runLocked}
          setRestockItem={setRestockItem}
          setRestockData={setRestockData}
          openEditItemForm={openEditItemForm}
          setAdjustItem={setAdjustItem}
          setAdjustAction={setAdjustAction}
          handleDeleteItem={handleDeleteItem}
        />
      )}

      {tab === 'alerts' && (
        <AlertsTab
          alertItems={alertItems}
          alertsMeta={alertsQuery.data?.pagination ?? { hasNext: false, hasPrev: false }}
          alertsPage={alertsPage}
          setAlertsPage={setAlertsPage}
          setRestockItem={setRestockItem}
          setRestockData={setRestockData}
          setAdjustItem={setAdjustItem}
          setAdjustAction={setAdjustAction}
        />
      )}

      {tab === 'suppliers' && (
        <SuppliersTab
          suppliers={suppliers}
          supplierSearch={supplierSearch}
          setSupplierSearch={setSupplierSearch}
          supplierMeta={suppliersQuery.data?.pagination ?? { hasNext: false, hasPrev: false }}
          supplierPage={supplierPage}
          setSupplierPage={setSupplierPage}
          onEditSupplier={openEditSupplier}
          onDeleteSupplier={handleDeleteSupplier}
        />
      )}

      {tab === 'transfers' && (
        <TransfersTab
          transfers={transfers}
          transferMeta={transfersQuery.data?.pagination ?? { hasNext: false, hasPrev: false }}
          transferPage={transferPage}
          setTransferPage={setTransferPage}
          search={transferSearch}
          setSearch={setTransferSearch}
          category={transferCatFilter}
          setCategory={setTransferCatFilter}
          categories={transferCategories}
          location={locationFilter}
          setLocation={setLocationFilter}
          locations={locations}
        />
      )}

      {tab === 'logs' && (
        <LogsTab
          logs={logs}
          logsMeta={logsQuery.data?.pagination ?? { hasNext: false, hasPrev: false }}
          logsPage={logsPage}
          setLogsPage={setLogsPage}
          search={logSearch}
          setSearch={setLogSearch}
        />
      )}

      {/* Modals */}
      {showAddForm && (
        <AddItemModal
          editingItem={editingItem}
          newItem={newItem}
          setNewItem={setNewItem}
          suppliers={suppliers}
          isLocked={isLocked}
          runLocked={runLocked}
          onClose={() => { setShowAddForm(false); setEditingItem(null); }}
          onSubmit={handleAddItem}
        />
      )}

      {restockItem && (
        <RestockModal
          restockItem={restockItem}
          restockData={restockData}
          setRestockData={setRestockData}
          suppliers={suppliers}
          isLocked={isLocked}
          runLocked={runLocked}
          onClose={() => setRestockItem(null)}
          onSubmit={handleRestockSubmit}
        />
      )}

      {adjustItem && (
        <AdjustmentModal
          adjustItem={adjustItem}
          adjustQty={adjustQty}
          setAdjustQty={setAdjustQty}
          adjustAction={adjustAction}
          setAdjustAction={setAdjustAction}
          adjustNote={adjustNote}
          setAdjustNote={setAdjustNote}
          isLocked={isLocked}
          runLocked={runLocked}
          onClose={() => setAdjustItem(null)}
          onSubmit={handleAdjust}
        />
      )}

      {showTransferForm && (
        <TransferModal
          inventory={allInventory}
          locations={locations}
          categories={transferCategories}
          isLocked={isLocked}
          runLocked={runLocked}
          onClose={() => setShowTransferForm(false)}
          onSubmit={handleCreateTransfer}
          newTransfer={newTransfer}
          setNewTransfer={setNewTransfer}
          addTransferItem={addTransferItem}
          removeTransferItem={removeTransferItem}
          updateTransferItem={updateTransferItem}
        />
      )}

      {showSupplierForm && (
        <SupplierFormModal
          editingSupplier={editingSupplier}
          supplierData={supplierData}
          setSupplierData={setSupplierData}
          isLocked={isLocked}
          runLocked={runLocked}
          onClose={() => setShowSupplierForm(false)}
          onSubmit={handleSupplierSubmit}
        />
      )}
    </div>
  );
}
