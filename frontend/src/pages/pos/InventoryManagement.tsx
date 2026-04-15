import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus, Trash2, Search, Clock, TrendingDown, Archive, Truck, ArrowRightLeft, Edit2, X, Phone, Mail, MapPin, RotateCcw, Save } from 'lucide-react';
import { type InventoryItem, type InventoryLog, type Supplier, type StockTransfer, inventoryCategories, transferCategories } from '@/data/inventoryData';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';

type Tab = 'stock' | 'transfers' | 'alerts' | 'logs' | 'suppliers';

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>('stock');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  const [search, setSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [perishableOnly, setPerishableOnly] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  
  // Adjustment Modal (Use/Waste)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustAction, setAdjustAction] = useState<'use' | 'waste'>('use');
  const [adjustNote, setAdjustNote] = useState('');

  // Restock Modal
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockData, setRestockData] = useState({
    quantity: '',
    costPerUnit: '',
    supplier: '',
    note: ''
  });
  
  const [stockPage, setStockPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);
  const [supplierPage, setSupplierPage] = useState(1);
  
  const [stockMeta, setStockMeta] = useState({ hasNext: false, hasPrev: false });
  const [logsMeta, setLogsMeta] = useState({ hasNext: false, hasPrev: false });
  const [transferMeta, setTransferMeta] = useState({ hasNext: false, hasPrev: false });
  const [supplierMeta, setSupplierMeta] = useState({ hasNext: false, hasPrev: false });

  // Supplier Form State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierData, setSupplierData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    items: [] as string[]
  });

  const fetchStock = async () => {
    try {
      const params = new URLSearchParams({
        page: String(stockPage),
        limit: '12',
        search,
        category: catFilter,
        perishableOnly: String(perishableOnly),
      });
      const response = await api<PaginatedResponse<InventoryItem>>(`/inventory/items?${params.toString()}`);
      setInventory(response.items);
      setStockMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error('Failed to load inventory');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams({
        page: String(supplierPage),
        limit: '9',
        search: supplierSearch,
      });
      const response = await api<PaginatedResponse<Supplier>>(`/inventory/suppliers?${params.toString()}`);
      setSuppliers(response.items || []);
      setSupplierMeta({ 
        hasNext: response.pagination?.hasNext || false, 
        hasPrev: response.pagination?.hasPrev || false 
      });
    } catch (error) {
      console.error("Supplier fetch error:", error);
      toast.error('Failed to load suppliers');
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api<PaginatedResponse<InventoryLog>>(`/inventory/logs?page=${logsPage}&limit=15`);
      setLogs(response.items);
      setLogsMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error('Failed to load inventory logs');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await api<PaginatedResponse<StockTransfer>>(`/inventory/transfers?page=${transferPage}&limit=10`);
      setTransfers(response.items);
      setTransferMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error('Failed to load transfers');
    }
  };

  const fetchLocations = async () => {
    try {
      const r = await api<{ locations: string[] }>('/inventory/locations');
      setLocations(r.locations);
    } catch (error) {}
  };

  // Performance: Lazy load data based on active tab
  useEffect(() => {
    if (tab === 'stock' || tab === 'alerts') fetchStock();
  }, [stockPage, search, catFilter, perishableOnly, tab]);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [logsPage, tab]);

  useEffect(() => {
    if (tab === 'transfers') fetchTransfers();
  }, [transferPage, tab]);

  useEffect(() => {
    if (tab === 'suppliers' || showAddForm || !!restockItem) fetchSuppliers();
  }, [supplierPage, supplierSearch, tab, showAddForm, !!restockItem]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);
  const expiringItems = inventory.filter(i => {
    if (!i.expiryDate) return false;
    const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 2 && diff >= 0;
  });
  const expiredItems = inventory.filter(i => {
    if (!i.expiryDate) return false;
    return new Date(i.expiryDate) < new Date();
  });

  const perishableCount = inventory.filter(i => i.perishable).length;

  const handleAdjust = async () => {
    if (!adjustItem || !adjustQty) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    try {
      await api(`/inventory/items/${adjustItem.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          action: adjustAction,
          quantity: qty,
          note: adjustNote || `${adjustAction === 'use' ? 'Used' : 'Wasted'} ${qty} ${adjustItem.unit}`,
        }),
      });
      toast.success(`${adjustAction === 'use' ? 'Used' : 'Wasted'} ${qty} ${adjustItem.unit} of ${adjustItem.name}`);
      setAdjustItem(null);
      setAdjustQty('');
      setAdjustNote('');
      fetchStock();
      if (tab === 'logs') fetchLogs();
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleRestockSubmit = async () => {
    if (!restockItem || !restockData.quantity) return;
    const qty = parseFloat(restockData.quantity);
    const cost = parseFloat(restockData.costPerUnit) || 0;
    if (isNaN(qty) || qty <= 0) return;

    try {
      await api(`/inventory/items/${restockItem.id}/restock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: qty,
          costPerUnit: cost,
          supplier: restockData.supplier || null,
          note: restockData.note,
        }),
      });
      toast.success(`Restocked ${qty} ${restockItem.unit} of ${restockItem.name}`);
      setRestockItem(null);
      setRestockData({ quantity: '', costPerUnit: '', supplier: '', note: '' });
      fetchStock();
      if (tab === 'logs') fetchLogs();
    } catch (error) {
      toast.error('Failed to restock');
    }
  };

  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: 'Meat', 
    quantity: '', 
    unit: 'kg', 
    minStock: '', 
    costPerUnit: '', 
    perishable: false, 
    expiryDate: '', 
    supplier: '' 
  });

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
      await api('/inventory/items', { method: 'POST', body: JSON.stringify(itemData) });
      toast.success('Item added to inventory');
      setShowAddForm(false);
      setNewItem({ name: '', category: 'Meat', quantity: '', unit: 'kg', minStock: '', costPerUnit: '', perishable: false, expiryDate: '', supplier: '' });
      fetchStock();
      if (tab === 'logs') fetchLogs();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  // Supplier Management Handlers
  const handleSupplierSubmit = async () => {
    if (!supplierData.name || !supplierData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      if (editingSupplier) {
        await api(`/inventory/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(supplierData)
        });
        toast.success('Supplier updated');
      } else {
        await api('/inventory/suppliers', {
          method: 'POST',
          body: JSON.stringify(supplierData)
        });
        toast.success('Supplier added');
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setSupplierData({ name: '', phone: '', email: '', address: '', items: [] });
      fetchSuppliers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api(`/inventory/suppliers/${id}`, { method: 'DELETE' });
      toast.success('Supplier removed');
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierData({
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      items: s.items || []
    });
    setShowSupplierForm(true);
  };

  // Stock Transfer logic
  const [newTransfer, setNewTransfer] = useState({
    fromLocation: '',
    toLocation: '',
    transferCategory: 'General',
    note: '',
    items: [{ itemId: '', quantity: '', name: '', unit: '' }]
  });

  useEffect(() => {
    if (locations.length > 0 && !newTransfer.fromLocation) {
      setNewTransfer(prev => ({ 
        ...prev, 
        fromLocation: locations[0], 
        toLocation: locations[1] || locations[0] 
      }));
    }
  }, [locations]);

  const handleCreateTransfer = async () => {
    if (!newTransfer.fromLocation || !newTransfer.toLocation || newTransfer.items.some(i => !i.itemId || !i.quantity)) {
      toast.error('Please fill all required fields');
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
          items: newTransfer.items.map(i => ({ itemId: i.itemId, quantity: parseFloat(i.quantity) }))
        })
      });
      toast.success('Transfer complete');
      setShowTransferForm(false);
      setNewTransfer({
        fromLocation: locations[0],
        toLocation: locations[1] || locations[0],
        transferCategory: 'General',
        note: '',
        items: [{ itemId: '', quantity: '', name: '', unit: '' }]
      });
      fetchStock();
      if (tab === 'transfers') fetchTransfers();
      if (tab === 'logs') fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    }
  };

  const addTransferItem = () => {
    setNewTransfer(p => ({
      ...p,
      items: [...p.items, { itemId: '', quantity: '', name: '', unit: '' }]
    }));
  };

  const removeTransferItem = (index: number) => {
    if (newTransfer.items.length <= 1) return;
    setNewTransfer(p => ({
      ...p,
      items: p.items.filter((_, i) => i !== index)
    }));
  };

  const updateTransferItem = (index: number, itemId: string) => {
    const item = inventory.find(i => (i.id === itemId || i._id === itemId));
    if (!item) return;

    setNewTransfer(p => {
      const newItems = [...p.items];
      newItems[index] = {
        itemId: item.id || item._id || '',
        name: item.name,
        unit: item.unit,
        quantity: newItems[index].quantity
      };
      return { ...p, items: newItems };
    });
  };

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle, count: lowStockItems.length + expiringItems.length + expiredItems.length },
    { key: 'logs', label: 'History', icon: Clock },
    { key: 'suppliers', label: 'Suppliers', icon: Truck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-xl font-bold text-foreground">Inventory Management</h1>
        <div className="flex gap-2">
          {tab === 'suppliers' ? (
            <button onClick={() => { setEditingSupplier(null); setSupplierData({ name: '', phone: '', email: '', address: '', items: [] }); setShowSupplierForm(true); }} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          ) : (
            <>
              <button onClick={() => setShowTransferForm(true)} className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/80 transition-colors">
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
              <button onClick={() => setShowAddForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Package className="w-3.5 h-3.5" /> Total Items</div>
          <p className="text-2xl font-bold text-foreground">{inventory.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-warning text-xs mb-1"><TrendingDown className="w-3.5 h-3.5" /> Low Stock</div>
          <p className="text-2xl font-bold text-warning">{lowStockItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-orange-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Expiring Soon</div>
          <p className="text-2xl font-bold text-orange-500">{expiringItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-destructive text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Expired</div>
          <p className="text-2xl font-bold text-destructive">{expiredItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border col-span-2 lg:col-span-1 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600 text-xs mb-1"><Archive className="w-3.5 h-3.5" /> Perishable SKUs</div>
          <p className="text-2xl font-bold text-foreground">{perishableCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count ? <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'stock' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm outline-none shadow-sm" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
              <option value="All">All Categories</option>
              {inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap cursor-pointer">
              <input type="checkbox" checked={perishableOnly} onChange={e => setPerishableOnly(e.target.checked)} className="rounded accent-primary" />
              Perishable only
            </label>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Min</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.minStock;
                    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                    return (
                      <tr key={item.id || item._id} className={`border-b border-border/50 ${isExpired ? 'bg-destructive/5' : isLow ? 'bg-warning/5' : ''} hover:bg-muted/20 transition-colors`}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name}
                          {item.perishable && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">P</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-warning' : 'text-foreground'}`}>{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.minStock}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {item.supplier && typeof item.supplier === 'object' ? item.supplier.name : '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{item.expiryDate || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setRestockItem(item); setRestockData({ quantity: '', costPerUnit: item.costPerUnit?.toString() || '', supplier: typeof item.supplier === 'object' ? item.supplier._id : '', note: '' }); }} className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors">
                              <RotateCcw className="w-3 h-3" /> Restock
                            </button>
                            <button onClick={() => { setAdjustItem(item); setAdjustAction('use'); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground border border-border" title="Adjustment"><Edit2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {inventory.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">No items in inventory.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3">
            <button disabled={!stockMeta.hasPrev} onClick={() => setStockPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted transition-colors shadow-sm">Previous</button>
            <button disabled={!stockMeta.hasNext} onClick={() => setStockPage(p => p + 1)} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted transition-colors shadow-sm">Next</button>
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm outline-none shadow-sm" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map(s => (
              <div key={s.id || s._id} className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Truck className="w-5 h-5" /></div>
                    <h3 className="font-bold text-foreground">{s.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditSupplier(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground border border-border"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteSupplier(s.id || s._id || '')} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive border border-destructive/20"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <button disabled={!supplierMeta.hasPrev} onClick={() => setSupplierPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Previous</button>
            <button disabled={!supplierMeta.hasNext} onClick={() => setSupplierPage(p => p + 1)} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Next</button>
          </div>
        </div>
      )}

      {tab === 'transfers' && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transfer #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">From</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">To</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(tr => (
                    <tr key={tr.id || tr._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{tr.transferNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{tr.transferCategory}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tr.fromLocation}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tr.toLocation}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tr.items.length} items</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(tr.transferDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-[10px] font-bold uppercase"><span className={tr.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>{tr.status}</span></td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">No transfers recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3">
            <button disabled={!transferMeta.hasPrev} onClick={() => setTransferPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Previous</button>
            <button disabled={!transferMeta.hasNext} onClick={() => setTransferPage(p => p + 1)} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Next</button>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id || log._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold">{log.itemName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${log.action === 'restocked' ? 'bg-green-100 text-green-700' : log.action === 'wasted' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{log.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary font-bold">
                        {log.price ? `Rs. ${log.price}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs italic">{log.note}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">No activities recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3">
            <button disabled={!logsMeta.hasPrev} onClick={() => setLogsPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Previous</button>
            <button disabled={!logsMeta.hasNext} onClick={() => setLogsPage(p => p + 1)} className="px-3 py-1.5 rounded-xl border border-border text-xs disabled:opacity-50 hover:bg-muted shadow-sm transition-colors">Next</button>
          </div>
        </div>
      )}

      {/* Alerts Tab (Same as stock filtering basically) */}
      {tab === 'alerts' && (
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
                  {lowStockItems.map(item => (
                    <tr key={item.id || item._id} className="border-b border-border/50 bg-warning/5">
                      <td className="px-4 py-3 font-bold">{item.name}</td>
                      <td className="px-4 py-3 text-warning text-xs font-bold uppercase tracking-tight flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low Stock (Min: {item.minStock})</td>
                      <td className="px-4 py-3 text-right font-bold">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => { setRestockItem(item); setRestockData({ quantity: '', costPerUnit: item.costPerUnit?.toString() || '', supplier: typeof item.supplier === 'object' ? item.supplier._id : '', note: '' }); }} className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-bold">Restock</button></td>
                    </tr>
                  ))}
                  {expiredItems.map(item => (
                    <tr key={item.id || item._id} className="border-b border-border/50 bg-destructive/5">
                      <td className="px-4 py-3 font-bold">{item.name}</td>
                      <td className="px-4 py-3 text-destructive text-xs font-bold uppercase tracking-tight flex items-center gap-1"><X className="w-3 h-3" /> Expired ({item.expiryDate})</td>
                      <td className="px-4 py-3 text-right font-bold">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => { setAdjustItem(item); setAdjustAction('waste'); }} className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-xs font-bold">Mark Wasted</button></td>
                    </tr>
                  ))}
                  {lowStockItems.length === 0 && expiredItems.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-20 text-center text-muted-foreground italic"><Package className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No critical alerts at this time.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">Add Inventory Item</h3>
            <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Item Name</label><input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Basmati Rice" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Category</label><select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20">{inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Base Unit</label><input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="kg, pcs, liter" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Opening Qty</label><input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} placeholder="0" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Min Stock</label><input type="number" value={newItem.minStock} onChange={e => setNewItem(p => ({ ...p, minStock: e.target.value }))} placeholder="5" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Cost/Unit</label><input type="number" value={newItem.costPerUnit} onChange={e => setNewItem(p => ({ ...p, costPerUnit: e.target.value }))} placeholder="0.00" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Supplier (Optional)</label><select value={newItem.supplier} onChange={e => setNewItem(p => ({ ...p, supplier: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}</select></div>
            <label className="flex items-center gap-2 text-sm py-1 cursor-pointer"><input type="checkbox" checked={newItem.perishable} onChange={e => setNewItem(p => ({ ...p, perishable: e.target.checked }))} className="rounded accent-primary" /><span className="text-muted-foreground text-xs">Perishable item (has expiry date)</span></label>
            {newItem.perishable && (
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Expiry Date</label><input type="date" value={newItem.expiryDate} onChange={e => setNewItem(p => ({ ...p, expiryDate: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            )}
            <div className="flex gap-2 pt-2"><button onClick={() => setShowAddForm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button><button onClick={handleAddItem} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-all">Add Item</button></div>
          </div>
        </div>
      )}

      {restockItem && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRestockItem(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2"><RotateCcw className="w-5 h-5 text-primary" /> Restock Item</h3><button onClick={() => setRestockItem(null)}><X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" /></button></div>
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl"><p className="text-sm font-bold text-foreground">{restockItem.name}</p><p className="text-xs text-muted-foreground">Current Stock: {restockItem.quantity} {restockItem.unit}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">New Quantity</label><input type="number" value={restockData.quantity} onChange={e => setRestockData(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Cost Per {restockItem.unit}</label><input type="number" value={restockData.costPerUnit} onChange={e => setRestockData(p => ({ ...p, costPerUnit: e.target.value }))} placeholder="0.00" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Supplier</label><select value={restockData.supplier} onChange={e => setRestockData(p => ({ ...p, supplier: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Note</label><input value={restockData.note} onChange={e => setRestockData(p => ({ ...p, note: e.target.value }))} placeholder="Purchase details..." className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="flex gap-2 pt-2"><button onClick={() => setRestockItem(null)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button><button onClick={handleRestockSubmit} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20">Confirm</button></div>
          </div>
        </div>
      )}

      {adjustItem && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAdjustItem(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-foreground">Stock Adjustment</h3><button onClick={() => setAdjustItem(null)}><X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" /></button></div>
            <div className="p-3 bg-muted/50 rounded-xl"><p className="text-sm font-bold text-foreground">{adjustItem.name}</p><p className="text-xs text-muted-foreground">Current Balance: {adjustItem.quantity} {adjustItem.unit}</p></div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">{(['use', 'waste'] as const).map(a => (<button key={a} onClick={() => setAdjustAction(a)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${adjustAction === a ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{a}</button>))}</div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Quantity to {adjustAction}</label><input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="0.00" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Reason / Note</label><input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Daily prep..." className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" /></div>
            <div className="flex gap-2 pt-2"><button onClick={() => setAdjustItem(null)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button><button onClick={handleAdjust} className={`flex-1 py-2 rounded-xl text-sm font-bold text-primary-foreground transition-all shadow-md ${adjustAction === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-foreground hover:bg-black'}`}>Confirm</button></div>
          </div>
        </div>
      )}

      {showTransferForm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTransferForm(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-primary" /> Stock Transfer</h3>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Section</label><select value={newTransfer.transferCategory} onChange={e => setNewTransfer(p => ({ ...p, transferCategory: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">{transferCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">From</label><select value={newTransfer.fromLocation} onChange={e => setNewTransfer(p => ({ ...p, fromLocation: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">To</label><select value={newTransfer.toLocation} onChange={e => setNewTransfer(p => ({ ...p, toLocation: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center"><label className="text-xs font-medium text-muted-foreground ml-1">Items to Transfer</label><button onClick={addTransferItem} className="text-xs text-primary font-bold hover:underline">+ Add</button></div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {newTransfer.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 p-2 border border-border rounded-xl bg-muted/30">
                    <select value={item.itemId} onChange={e => updateTransferItem(idx, e.target.value)} className="flex-1 bg-transparent border-none text-sm outline-none"><option value="">Select Item</option>{inventory.map(i => <option key={i.id || i._id} value={i.id || i._id}>{i.name} ({i.quantity})</option>)}</select>
                    <input type="number" value={item.quantity} onChange={e => { const newItems = [...newTransfer.items]; newItems[idx].quantity = e.target.value; setNewTransfer(p => ({ ...p, items: newItems })); }} placeholder="Qty" className="w-20 bg-transparent border-none text-sm text-right outline-none" /><button onClick={() => removeTransferItem(idx)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Reason (Optional)</label><input value={newTransfer.note} onChange={e => setNewTransfer(p => ({ ...p, note: e.target.value }))} placeholder="Reason for transfer..." className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" /></div>
            <div className="flex gap-2 pt-2"><button onClick={() => setShowTransferForm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button><button onClick={handleCreateTransfer} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20">Complete Transfer</button></div>
          </div>
        </div>
      )}

      {showSupplierForm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSupplierForm(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-foreground">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3><button onClick={() => setShowSupplierForm(false)}><X className="w-5 h-5 text-muted-foreground hover:bg-muted rounded-full p-1" /></button></div>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Business Name</label><input value={supplierData.name} onChange={e => setSupplierData(p => ({ ...p, name: e.target.value }))} placeholder="Business Name" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Phone</label><input value={supplierData.phone} onChange={e => setSupplierData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Email</label><input value={supplierData.email} onChange={e => setSupplierData(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground ml-1">Address</label><textarea value={supplierData.address} onChange={e => setSupplierData(p => ({ ...p, address: e.target.value }))} placeholder="Address" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm min-h-[60px] shadow-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="flex gap-2 pt-2"><button onClick={() => setShowSupplierForm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button><button onClick={handleSupplierSubmit} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-all">{editingSupplier ? 'Save Changes' : 'Add Supplier'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
