import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus, Trash2, RotateCcw, Search, Filter, Clock, TrendingDown, Archive, Truck } from 'lucide-react';
import { type InventoryItem, type InventoryLog, type Supplier, inventoryCategories, type InventoryCategory } from '@/data/inventoryData';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';

type Tab = 'stock' | 'logs' | 'suppliers' | 'alerts';

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>('stock');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustAction, setAdjustAction] = useState<'add' | 'use' | 'waste'>('add');
  const [adjustNote, setAdjustNote] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [stockMeta, setStockMeta] = useState({ hasNext: false, hasPrev: false });
  const [logsMeta, setLogsMeta] = useState({ hasNext: false, hasPrev: false });

  useEffect(() => {
    const fetchStock = async () => {
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
    };
    fetchStock().catch(() => toast.error('Failed to load inventory'));
  }, [stockPage, search, catFilter, perishableOnly]);

  useEffect(() => {
    const fetchLogs = async () => {
      const response = await api<PaginatedResponse<InventoryLog>>(`/inventory/logs?page=${logsPage}&limit=10`);
      setLogs(response.items);
      setLogsMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    };
    fetchLogs().catch(() => toast.error('Failed to load inventory logs'));
  }, [logsPage]);

  useEffect(() => {
    api<{ items: Supplier[] }>('/inventory/suppliers')
      .then(r => setSuppliers(r.items))
      .catch(() => {});
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

  const filtered = inventory.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || i.category === catFilter;
    const matchPerishable = !perishableOnly || i.perishable;
    return matchSearch && matchCat && matchPerishable;
  });

  const perishableCount = inventory.filter(i => i.perishable).length;

  const handleAdjust = () => {
    if (!adjustItem || !adjustQty) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    api(`/inventory/items/${adjustItem.id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({
        action: adjustAction,
        quantity: qty,
        note: adjustNote || `${adjustAction} ${qty} ${adjustItem.unit}`,
      }),
    }).then(() => setStockPage(1));
    toast.success(`${adjustAction === 'add' ? 'Added' : adjustAction === 'use' ? 'Used' : 'Wasted'} ${qty} ${adjustItem.unit} of ${adjustItem.name}`);
    setAdjustItem(null);
    setAdjustQty('');
    setAdjustNote('');
  };

  const [newItem, setNewItem] = useState({ name: '', category: 'Meat' as InventoryCategory, quantity: '', unit: 'kg', minStock: '', costPerUnit: '', perishable: false, expiryDate: '', supplier: '' });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity) return;
    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: parseInt(newItem.quantity),
      unit: newItem.unit,
      minStock: parseInt(newItem.minStock) || 5,
      costPerUnit: parseInt(newItem.costPerUnit) || 0,
      perishable: newItem.perishable,
      expiryDate: newItem.expiryDate || undefined,
      supplier: newItem.supplier,
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    api('/inventory/items', { method: 'POST', body: JSON.stringify(item) }).then(() => {
      toast.success('Item added to inventory');
      setStockPage(1);
    });
    setShowAddForm(false);
    setNewItem({ name: '', category: 'Meat', quantity: '', unit: 'kg', minStock: '', costPerUnit: '', perishable: false, expiryDate: '', supplier: '' });
  };

  const tabs: { key: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle, count: lowStockItems.length + expiringItems.length + expiredItems.length },
    { key: 'logs', label: 'History', icon: Clock },
    { key: 'suppliers', label: 'Suppliers', icon: Truck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-xl font-bold text-foreground">Inventory management</h1>
        <button onClick={() => setShowAddForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Package className="w-3.5 h-3.5" /> Total Items</div>
          <p className="text-2xl font-bold text-foreground">{inventory.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-warning text-xs mb-1"><TrendingDown className="w-3.5 h-3.5" /> Low Stock</div>
          <p className="text-2xl font-bold text-warning">{lowStockItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-orange-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Expiring Soon</div>
          <p className="text-2xl font-bold text-orange-500">{expiringItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-destructive text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Expired</div>
          <p className="text-2xl font-bold text-destructive">{expiredItems.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-orange-600 text-xs mb-1"><Archive className="w-3.5 h-3.5" /> Perishable SKUs</div>
          <p className="text-2xl font-bold text-foreground">{perishableCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count ? <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-sm">
              <option value="All">All Categories</option>
              {inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
              <input type="checkbox" checked={perishableOnly} onChange={e => setPerishableOnly(e.target.checked)} className="rounded" />
              Perishable only
            </label>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
                  {filtered.map(item => {
                    const isLow = item.quantity <= item.minStock;
                    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                    return (
                      <tr key={item.id} className={`border-b border-border/50 ${isExpired ? 'bg-destructive/5' : isLow ? 'bg-warning/5' : ''}`}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name}
                          {item.perishable && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Perishable</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-warning' : 'text-foreground'}`}>{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.minStock}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.supplier}</td>
                        <td className={`px-4 py-3 ${isExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{item.expiryDate || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setAdjustItem(item); setAdjustAction('add'); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="Add stock"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setAdjustItem(item); setAdjustAction('use'); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Use stock"><Minus className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setAdjustItem(item); setAdjustAction('waste'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Waste"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          {lowStockItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-warning" /> Low Stock Items</h3>
              <div className="grid gap-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} remaining (min: {item.minStock})</p>
                    </div>
                    <button onClick={() => { setAdjustItem(item); setAdjustAction('add'); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium">Restock</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expiringItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Expiring Soon (≤2 days)</h3>
              <div className="grid gap-2">
                {expiringItems.map(item => (
                  <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Expires: {item.expiryDate} — {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expiredItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Expired Items</h3>
              <div className="grid gap-2">
                {expiredItems.map(item => (
                  <div key={item.id} className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Expired: {item.expiryDate} — {item.quantity} {item.unit}</p>
                    </div>
                    <button onClick={() => { setAdjustItem(item); setAdjustAction('waste'); }} className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-medium">Mark Wasted</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lowStockItems.length === 0 && expiringItems.length === 0 && expiredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No alerts — everything looks good!</p>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{log.itemName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.action === 'restocked' ? 'bg-primary/10 text-primary' : log.action === 'wasted' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{log.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'stock' && (
        <div className="flex justify-end gap-2">
          <button disabled={!stockMeta.hasPrev} onClick={() => setStockPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
            Previous
          </button>
          <button disabled={!stockMeta.hasNext} onClick={() => setStockPage(p => p + 1)} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
            Next
          </button>
        </div>
      )}
      {tab === 'logs' && (
        <div className="flex justify-end gap-2">
          <button disabled={!logsMeta.hasPrev} onClick={() => setLogsPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
            Previous
          </button>
          <button disabled={!logsMeta.hasNext} onClick={() => setLogsPage(p => p + 1)} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Truck className="w-4 h-4 text-primary" /></div>
                <h3 className="font-semibold text-foreground">{s.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{s.phone} • {s.email}</p>
              <p className="text-xs text-muted-foreground">{s.address}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {s.items.map(item => <span key={item} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setAdjustItem(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">
              {adjustAction === 'add' ? 'Add Stock' : adjustAction === 'use' ? 'Use Stock' : 'Mark Waste'} — {adjustItem.name}
            </h3>
            <p className="text-sm text-muted-foreground">Current: {adjustItem.quantity} {adjustItem.unit}</p>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(['add', 'use', 'waste'] as const).map(a => (
                <button key={a} onClick={() => setAdjustAction(a)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${adjustAction === a ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{a}</button>
              ))}
            </div>
            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Quantity" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Note (optional)" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setAdjustItem(null)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleAdjust} className={`flex-1 py-2 rounded-xl text-sm font-medium text-primary-foreground ${adjustAction === 'waste' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-secondary'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">Add Inventory Item</h3>
            <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value as InventoryCategory }))} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="Unit (kg, liter...)" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={newItem.minStock} onChange={e => setNewItem(p => ({ ...p, minStock: e.target.value }))} placeholder="Min stock" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={newItem.costPerUnit} onChange={e => setNewItem(p => ({ ...p, costPerUnit: e.target.value }))} placeholder="Cost/unit" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
            <input value={newItem.supplier} onChange={e => setNewItem(p => ({ ...p, supplier: e.target.value }))} placeholder="Supplier" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newItem.perishable} onChange={e => setNewItem(p => ({ ...p, perishable: e.target.checked }))} className="rounded" />
              Perishable item
            </label>
            {newItem.perishable && (
              <input type="date" value={newItem.expiryDate} onChange={e => setNewItem(p => ({ ...p, expiryDate: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleAddItem} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
