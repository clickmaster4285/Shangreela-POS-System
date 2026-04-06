import { useEffect, useMemo, useState } from 'react';
import type { Order, TableInfo } from '@/data/mockData';
import { toast } from 'sonner';
import { ShoppingCart, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { api, type PaginatedResponse } from '@/lib/api';

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
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ hasNext: false, hasPrev: false });
  const [switchTableDialogOpen, setSwitchTableDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderForSwitch, setSelectedOrderForSwitch] = useState<OrderWithDb | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderWithDb | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState('');

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: statusFilter,
        type: typeFilter,
      });
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

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchTables();
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
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOrders.map(order => (
          <div key={order.id} className="pos-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground">{order.id}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {order.type}
                  {order.table ? ` • ${tableMap.get(order.table)?.name || `Table ${order.table}`}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.quantity}× {item.menuItem.name}</span>
                  <span className="text-muted-foreground">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">Order taker: {order.orderTaker || 'Unknown'}</div>

            {order.notes && <p className="text-xs text-primary italic">📝 {order.notes}</p>}

            <div className="flex justify-between items-center pt-2 border-t border-border gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Total bill</p>
                <p className="font-serif text-lg font-bold text-foreground">Rs. {order.total.toLocaleString()}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {order.type === 'dine-in' && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && order.status !== 'taken away' && (
                  <button
                    onClick={() => openSwitchTableDialog(order as OrderWithDb)}
                    className="bg-secondary/10 text-secondary px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/20 transition-colors"
                  >
                    Switch table
                  </button>
                )}
                {nextStatus(order.status, order.type) && (
                  <button
                    onClick={() => updateStatus(order.id, nextStatus(order.status, order.type)!)}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary transition-colors capitalize"
                  >
                    → {nextStatus(order.status, order.type)}
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && order.status !== 'taken away' && (
                  <button
                    onClick={() => openCancelDialog(order as OrderWithDb)}
                    className="bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-xs font-medium hover:bg-destructive/15 transition-colors flex items-center gap-1"
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
